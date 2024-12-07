import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { 
  Package, 
  AlertCircle, 
  RefreshCw, 
  Search,
  Plus,
  TableIcon,
  LayoutGrid,
  Loader2
} from 'lucide-react';

import { useProductsData } from './hooks/useProductsData';
import { useProductSearch } from './hooks/useProductSearch';
import ProductsTable from './ProductsTable';
import ProductModal from '../ProductModal';
import apiService from '../../services/api';

const ProductsView = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';
  const [viewType, setViewType] = useState('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  const { 
    data: { products, scales, customers, measurements, analytics },
    isLoading,
    loadMore,
    hasMore,
    refreshData
  } = useProductsData();

  const {
    searchTerm,
    isSearching,
    handleSearchChange,
    filteredProducts
  } = useProductSearch(products, customers);

  const handleAddProduct = async (productData) => {
    try {
      await apiService.createProduct(productData);
      refreshData();
      setIsModalOpen(false);
      setSuccessMessage(t.productAdded);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err.message || t.failedToAddProduct);
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleMessage = (customer, message) => {
    if (!customer?.phone) return;
    window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString(language === 'he' ? 'he-IL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && products.length === 0) {
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
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              {t.productsDashboard}
            </h2>
            <p className="text-gray-600 mt-1">{t.productStatus}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {t.lastUpdated}: {formatTime(new Date())}
            </span>
            <button
              onClick={() => setViewType(viewType === 'table' ? 'cards' : 'table')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border rounded-lg"
            >
              {viewType === 'table' ? (
                <>
                  <LayoutGrid className="h-5 w-5" />
                  {t.cardView}
                </>
              ) : (
                <>
                  <TableIcon className="h-5 w-5" />
                  {t.tableView}
                </>
              )}
            </button>
            <button
              onClick={refreshData}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-400 rounded-lg p-4">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder={t.searchProducts}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          autoComplete="off"
        />
        <div className="absolute left-3 top-2.5">
          {isSearching ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      {/* Add Product Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            setSelectedProduct(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          {t.addProduct}
        </button>
      </div>

      {/* Empty State */}
      {!isLoading && filteredProducts.length === 0 && !error && !isSearching && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">{t.noProductsFound}</p>
          <p className="text-gray-500 text-sm">{t.tryAdjustingSearch}</p>
        </div>
      )}

      {/* Products Display */}
      {!error && filteredProducts.length > 0 && (
        <ProductsTable
          products={filteredProducts}
          customers={customers}
          scales={scales}
          measurements={measurements}
          analytics={analytics}
          isLoading={isLoading}
          hasMore={hasMore}
          loadMore={loadMore}
          onEdit={handleEdit}
          onMessage={handleMessage}
        />
      )}

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleAddProduct}
        customers={customers}
        initialData={selectedProduct}
        t={t}
      />
    </div>
  );
};

export default ProductsView;