import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { Plus, Pencil, Trash2, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import apiService from '../services/api';
import ProductModal from './ProductModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

export default function ProductsView() {
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
  const t = translations[language];
  const isRTL = language === 'he';

  // Fetch products from the API
  const fetchProducts = async () => {
    try {
      const productsData = await apiService.getProducts();
      console.log('Fetched products:', productsData);
      setProducts(productsData);
    } catch (err) {
      console.error('Error fetching products:', err);
      throw new Error('Failed to fetch products');
    }
  };

  // Fetch customers from the API
  const fetchCustomers = async () => {
    try {
      const response = await apiService.getCustomers();
      console.log('Fetched customers:', response);
      // Make sure each customer has a customer_id property
      const formattedCustomers = response.map(customer => ({
        ...customer,
        customer_id: customer.customer_id || customer.id // Fallback to id if customer_id is not present
      }));
      setCustomers(formattedCustomers);
    } catch (err) {
      console.error('Error fetching customers:', err);
      throw new Error('Failed to fetch customers');
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchProducts(),
          fetchCustomers()
        ]);
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchProducts(),
        fetchCustomers()
      ]);
    } catch (err) {
      setError(err.message || 'Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add new product
  const handleAddProduct = async (productData) => {
    try {
      console.log('Creating product with data:', productData);
      const newProductData = {
        name: productData.name,
        description: '',
        vendor_id: 'test_vendor_123',
        price: 0,
        sku: '',
        category: '',
        customer_id: productData.customer_id,
        customer_name: productData.customer_name
      };

      console.log('Sending to API:', newProductData);
      const newProduct = await apiService.createProduct(newProductData);
      setProducts(prev => [...prev, newProduct]);
      showSuccessMessage('Product added successfully');
    } catch (err) {
      console.error('Error creating product:', err);
      throw new Error(err.message || 'Failed to add product');
    }
  };

  // Edit existing product
  const handleEditProduct = async (productData) => {
    try {
      const updatedProductData = {
        product_id: productData.product_id,
        name: productData.name,
        description: productData.description || '',
        vendor_id: productData.vendor_id || 'test_vendor_123',
        price: productData.price || 0,
        sku: productData.sku || '',
        category: productData.category || '',
        customer_id: productData.customer_id,
        customer_name: productData.customer_name
      };

      const updatedProduct = await apiService.updateProduct(
        productData.product_id, 
        updatedProductData
      );
      
      setProducts(prev => prev.map(p => 
        p.product_id === productData.product_id ? updatedProduct : p
      ));
      showSuccessMessage('Product updated successfully');
    } catch (err) {
      console.error('Error updating product:', err);
      throw new Error(err.message || 'Failed to update product');
    }
  };

  // Delete product
  const handleDeleteProduct = async () => {
    if (!selectedProduct?.product_id) return;

    try {
      await apiService.deleteProduct(selectedProduct.product_id);
      setProducts(prev => prev.filter(p => p.product_id !== selectedProduct.product_id));
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
      showSuccessMessage('Product deleted successfully');
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Get customer name helper function
  const getCustomerName = (customer_id) => {
    console.log('customers', customers, 'customer_id', customer_id);
    const customer = customers.find(c => c.customer_id === customer_id);
    return customer ? customer.name : t.unassigned;
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

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.productName}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.customer}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map(product => (
              <tr key={product.product_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500">
                  {product.product_id}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {getCustomerName(product.customer_id)}
                </td>
                <td className="px-6 py-4 text-sm font-medium flex gap-3">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}