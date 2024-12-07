import React, { useState } from 'react';
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

import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { useProductSearch } from './hooks/useProductSearch';
import ProductsTable from './ProductsTable';
import ProductModal from '../ProductModal';
import ProductsSelectionManager from './ProductsSelectionManager';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import apiService from '../../services/api';
import { useProductsData } from './hooks/useProductsData';

const ProductsView = ({
  useDataHook = useProductsData,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  viewTitle = 'productsDashboard',
  viewDescription = 'productStatus',
  emptyStateMessage = 'noProductsFound',
}) => {
  const { language } = useLanguage();
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';
  
  const [viewType, setViewType] = useState('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  const {
    data,
    isLoading,
    loadMore,
    hasMore,
    refreshData
  } = useDataHook();

  const {
    products = [],
    scales = [],
    customers = [],
    measurements = {},
    analytics = {}
  } = data || {};

  const {
    searchTerm,
    isSearching,
    handleSearchChange,
    filteredProducts
  } = useProductSearch(products, customers);

  const handleAddProduct = async (productData) => {
    if (!canCreate) return;
    try {
      await apiService.createProduct(productData);
      refreshData();
      setIsModalOpen(false);
      setSuccessMessage(t('productAdded'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err.message || t('failedToAddProduct'));
    }
  };

  const handleEdit = (product) => {
    if (!canEdit) return;
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleMessage = (customer, message) => {
    if (!customer?.phone) return;
    window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleSelect = (productId, isSelected) => {
    if (!canDelete) return;
    setSelectedProducts(prev =>
      isSelected
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    );
  };

  const handleSelectAll = (isSelected) => {
    if (!canDelete) return;
    setSelectedProducts(isSelected ? filteredProducts.map(p => p.product_id) : []);
  };

  const handleDeleteConfirm = async () => {
    if (!canDelete) return;
    try {
      await Promise.all(selectedProducts.map(productId =>
        apiService.deleteProduct(productId)
      ));
      refreshData();
      setSelectedProducts([]);
      setIsDeleteModalOpen(false);
      setSuccessMessage(t('productsDeleted'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting products:', err);
      setError(err.message || t('failedToDeleteProducts'));
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString(language === 'he' ? 'he-IL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && (!products || products.length === 0)) {
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
              {t(viewTitle)}
            </h2>
            <p className="text-gray-600 mt-1">{t(viewDescription)}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewType(viewType === 'table' ? 'cards' : 'table')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border rounded-lg"
            >
              {viewType === 'table' ? (
                <>
                  <LayoutGrid className="h-5 w-5" />
                  {t('cardView')}
                </>
              ) : (
                <>
                  <TableIcon className="h-5 w-5" />
                  {t('tableView')}
                </>
              )}
            </button>
            <button
              onClick={refreshData}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              {t('refresh')}
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

      {/* Search */}
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder={t('searchProducts')}
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
      {canCreate && (
        <div className="mb-6">
          <button
            onClick={() => {
              setSelectedProduct(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            {t('addProduct')}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredProducts.length === 0 && !error && !isSearching && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">{t(emptyStateMessage)}</p>
          <p className="text-gray-500 text-sm">{t('tryAdjustingSearch')}</p>
        </div>
      )}

      {/* Products Table */}
      {!error && filteredProducts.length > 0 && viewType === 'table' && (
        <ProductsTable
          products={filteredProducts}
          customers={customers}
          scales={scales}
          measurements={measurements}
          analytics={analytics}
          isLoading={isLoading}
          hasMore={hasMore}
          loadMore={loadMore}
          onEdit={canEdit ? handleEdit : undefined}
          onMessage={handleMessage}
          selectedProducts={canDelete ? selectedProducts : []}
          onSelect={canDelete ? handleSelect : undefined}
          onSelectAll={canDelete ? handleSelectAll : undefined}
        />
      )}

      {/* Selection Manager */}
      {canDelete && (
        <ProductsSelectionManager
          selectedProducts={selectedProducts}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
          onClearSelection={() => setSelectedProducts([])}
          onDelete={() => setIsDeleteModalOpen(true)}
          totalProducts={filteredProducts.length}
          isRTL={isRTL}
        />
      )}

      {/* Modals */}
      {canCreate && (
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
      )}

      {canDelete && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title={t('deleteProducts')}
          message={selectedProducts.length === 1 
            ? t('deleteProductConfirmation')
            : t('deleteMultipleProductsConfirmation')}
          selectedCount={selectedProducts.length}
          productNames={selectedProducts.map(id => 
            products.find(p => p.product_id === id)?.name
          ).filter(Boolean)}
        />
      )}
    </div>
  );
};

export default ProductsView;