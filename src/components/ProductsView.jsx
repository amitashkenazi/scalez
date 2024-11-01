import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { Plus, Pencil, Trash2, Loader2, RefreshCw, AlertCircle, Link as LinkIcon, Scale } from 'lucide-react';
import apiService from '../services/api';
import ProductModal from './ProductModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import useScaleData from '../hooks/useScaleData';

// Component to display thresholds in the product table
const ProductThreshold = ({ thresholds }) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm text-green-600">
      Upper: {thresholds?.upper || 'N/A'} kg
    </span>
    <span className="text-sm text-red-600">
      Lower: {thresholds?.lower || 'N/A'} kg
    </span>
  </div>
);

export default function ProductsView() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get scales data using the hook
  const { scales, isLoading: isLoadingScales } = useScaleData();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Fetch customers and products on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [customersResponse, productsResponse] = await Promise.all([
        apiService.getCustomers(),
        apiService.getProducts()
      ]);
      setCustomers(customersResponse);
      setProducts(productsResponse);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchInitialData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddProduct = async (productData) => {
    try {
      const newProductData = {
        name: productData.name,
        customer_id: productData.customer_id,
        customer_name: productData.customer_name,
        scale_id: productData.scale_id,
        thresholds: {
          upper: parseFloat(productData.thresholds.upper),
          lower: parseFloat(productData.thresholds.lower)
        }
      };

      const newProduct = await apiService.createProduct(newProductData);
      setProducts(prev => [...prev, newProduct]);
      showSuccessMessage(t.productAdded || 'Product added successfully');
    } catch (err) {
      console.error('Error creating product:', err);
      throw new Error(err.message || 'Failed to add product');
    }
  };

  const handleEditProduct = async (productData) => {
    try {
      const updatedProductData = {
        product_id: productData.product_id,
        name: productData.name,
        customer_id: productData.customer_id,
        customer_name: productData.customer_name,
        scale_id: productData.scale_id,
        thresholds: {
          upper: parseFloat(productData.thresholds.upper),
          lower: parseFloat(productData.thresholds.lower)
        }
      };

      const updatedProduct = await apiService.updateProduct(
        productData.product_id, 
        updatedProductData
      );
      
      setProducts(prev => prev.map(p => 
        p.product_id === productData.product_id ? updatedProduct : p
      ));
      showSuccessMessage(t.productUpdated || 'Product updated successfully');
    } catch (err) {
      console.error('Error updating product:', err);
      throw new Error(err.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct?.product_id) return;

    try {
      await apiService.deleteProduct(selectedProduct.product_id);
      setProducts(prev => prev.filter(p => p.product_id !== selectedProduct.product_id));
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
      showSuccessMessage(t.productDeleted || 'Product deleted successfully');
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.customer_id === customerId);
    return customer ? customer.name : (t.unassigned || 'Unassigned');
  };

  const getScaleInfo = (scaleId) => {
    console.log('Scales:', scales, 'Scale ID:', scaleId);
    const scale = scales.find(s => s.scale_id === scaleId);
    if (!scale) return null;
    return scale;
  };

  if (isLoading || isLoadingScales) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">{t.loading}</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{t.productsManagement}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t.refresh}
            </button>
            <button
              onClick={() => {
                setSelectedProduct(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              {t.addProduct}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-400 rounded-lg p-4">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.productName}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.customer}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.thresholds}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Linked Scale
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.actions}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map(product => {
              const scaleInfo = getScaleInfo(product.scale_id);
              console.log('Scale Info:', scaleInfo);
              return (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {getCustomerName(product.customer_id)}
                  </td>
                  <td className="px-6 py-4">
                    <ProductThreshold thresholds={product.thresholds} />
                  </td>
                  <td className="px-6 py-4">
                    {scaleInfo ? (
                      <div className="flex items-center gap-2">
                        <Scale size={16} className="text-blue-500" />
                        <span className="text-sm">
                          {scaleInfo.scale_id}
                          {scaleInfo.location && ` - ${scaleInfo.location}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No scale linked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil size={20} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={selectedProduct ? handleEditProduct : handleAddProduct}
        customers={customers}
        initialData={selectedProduct}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDeleteProduct}
        title={t.deleteProduct}
        message={`${t.deleteConfirmationDesc} "${selectedProduct?.name}"`}
      />
    </div>
  );
}