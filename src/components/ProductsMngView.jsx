import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { Plus, Pencil, Trash2, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import apiService from '../services/api';
import ProductModal from './ProductModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

export default function ProductsManagementView() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { language } = useLanguage();
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';

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

  useEffect(() => {
    fetchInitialData();
  }, []);

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
      console.log('productData', productData);
      const newProduct = await apiService.createProduct(productData);
      console.log('newProduct', newProduct);
      setProducts(prev => [...prev, newProduct]);
      setIsModalOpen(false);
      showSuccessMessage(t('productAdded') || 'Product added successfully');
    } catch (err) {
      throw new Error(err.message || 'Failed to add product');
    }
  };

  const handleEditProduct = async (productData) => {
    try {
      console.log('productData', productData);
      const updatedProduct = await apiService.updateProduct(productData.product_id, productData);
      setProducts(prev => prev.map(p => p.product_id === updatedProduct.product_id ? updatedProduct : p));
      setIsModalOpen(false);
      setSelectedProduct(null);
      showSuccessMessage(t('productUpdated') || 'Product updated successfully');
    } catch (err) {
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
      showSuccessMessage(t('productDeleted') || 'Product deleted successfully');
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    }
  };

  const handleNewCustomerAdded = (newCustomer) => {
    // Make sure we format the customer data consistently
    const formattedCustomer = {
      ...newCustomer,
      customer_id: newCustomer.customer_id || newCustomer.id,
      name: newCustomer.name
    };
    
    setCustomers(prev => [...prev, formattedCustomer]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  console.log('products', products);
  console.log('customers', customers);

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{t('productsManagement')}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </button>
            <button
              onClick={() => {
                setSelectedProduct(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              {t('addProduct')}
            </button>
          </div>
        </div>
      </div>

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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('productName')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('customer')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('thresholds')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('linkedScales')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map(product => (
              <tr key={product.product_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {customers.find(c => c.customer_id === product.customer_id)?.name || 'Unknown'}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm space-y-1">
                    <div className="text-green-600">
                      Upper: {product.thresholds?.upper || '-'} kg
                    </div>
                    <div className="text-red-600">
                      Lower: {product.thresholds?.lower || '-'} kg
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {product.scale_id || 'No scale linked'}
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
            ))}
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
        onCustomerAdded={handleNewCustomerAdded}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDeleteProduct}
        title={t('deleteProduct')}
        message={`${t('deleteConfirmationDesc')} "${selectedProduct?.name}"`}
      />
    </div>
  );
}