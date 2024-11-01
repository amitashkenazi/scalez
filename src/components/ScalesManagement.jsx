import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { Plus, Trash2, Loader2, RefreshCw, AlertCircle, Link, Unlink } from 'lucide-react';
import apiService from '../services/api';

const ScalesManagement = () => {
  const [registeredScales, setRegisteredScales] = useState([]);
  const [unregisteredScales, setUnregisteredScales] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Fetch initial data
  const fetchData = async () => {
    try {
      setError(null);
      
      // Get all scales
      const scalesResponse = await apiService.request('scales', { 
        method: 'GET' 
      });
      
      // Get all products
      const productsResponse = await apiService.getProducts();
      setProducts(productsResponse);

      // Get latest measurements
      const measurementsResponse = await apiService.request('measurements', {
        method: 'GET'
      });

      // Separate registered and unregistered scales
      const registered = [];
      const unregistered = [];

      measurementsResponse.forEach(measurement => {
        const scale = scalesResponse.find(s => s.id === measurement.vendor_id);
        const scaleData = {
          id: measurement.vendor_id,
          lastMeasurement: measurement.timestamp,
          weight: measurement.weight,
          isActive: scale?.is_active || false,
          productId: scale?.product_id,
          productName: scale?.product_name
        };

        if (scale) {
          registered.push(scaleData);
        } else {
          unregistered.push(scaleData);
        }
      });

      setRegisteredScales(registered);
      setUnregisteredScales(unregistered);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch scales data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleLinkScale = async (scaleId) => {
    if (!selectedProduct) return;

    setIsLinking(true);
    try {
      await apiService.request('scales/link-product', {
        method: 'POST',
        body: JSON.stringify({
          scale_id: scaleId,
          product_id: selectedProduct
        })
      });
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to link scale to product');
    } finally {
      setIsLinking(false);
      setSelectedProduct('');
    }
  };

  const handleUnlinkScale = async (scaleId) => {
    try {
      await apiService.request(`scales/unlink-product/${scaleId}`, {
        method: 'DELETE'
      });
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to unlink scale from product');
    }
  };

  const handleDeleteScale = async (scaleId) => {
    try {
      await apiService.request(`scales/${scaleId}`, {
        method: 'DELETE'
      });
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete scale');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Scales Management</h2>
            <p className="text-gray-600 mt-1">Manage and monitor all scales in the system</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Registered Scales Section */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Registered Scales</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Scale ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Update
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {registeredScales.map((scale) => (
                <tr key={scale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{scale.id}</td>
                  <td className="px-6 py-4 text-sm">{scale.productName || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">{formatDate(scale.lastMeasurement)}</td>
                  <td className="px-6 py-4 text-sm">{scale.weight} kg</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
                      ${scale.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {scale.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <button
                        onClick={() => handleUnlinkScale(scale.id)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Unlink from product"
                      >
                        <Unlink className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteScale(scale.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete scale"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unregistered Scales Section */}
      <div>
        <h3 className="text-xl font-bold mb-4">Unregistered Scales</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Scale ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Measurement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {unregisteredScales.map((scale) => (
                <tr key={scale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{scale.id}</td>
                  <td className="px-6 py-4 text-sm">{formatDate(scale.lastMeasurement)}</td>
                  <td className="px-6 py-4 text-sm">{scale.weight} kg</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="text-sm border rounded-lg p-2 pr-8"
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleLinkScale(scale.id)}
                        disabled={!selectedProduct || isLinking}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      >
                        {isLinking ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Link className="h-5 w-5" />
                        )}
                        <span>Link to Product</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScalesManagement;