import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  AlertCircle,
  RefreshCw,
  Search,
  Plus,
  TableIcon,
  LayoutGrid,
  Loader2,
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
  const t = (key) => translations[key]?.[language] || `Missing translation: ${key}`;
  const isRTL = language === 'he';

  const [viewType, setViewType] = useState('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    sortConfig,
    updateSort,
  } = useDataHook(page);

  const { products, scales, customers, measurements, analytics } = data;

  const { searchTerm, isSearching, handleSearchChange, filteredProducts } = useProductSearch(
    products,
    customers
  );

  const handleScroll = useCallback(() => {
    if (isLoading || !hasNextPage) return;

    const buffer = 200;
    const scrollPosition = window.innerHeight + window.pageYOffset;
    const pageHeight = document.documentElement.scrollHeight - buffer;

    if (scrollPosition >= pageHeight) {
      setPage(prevPage => prevPage + 1);
      fetchNextPage();
    }
  }, [isLoading, hasNextPage, fetchNextPage]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleSelect = (productId, isSelected) => {
    setSelectedProducts(prev => 
      isSelected ? [...prev, productId] : prev.filter(id => id !== productId)
    );
  };

  const handleSelectAll = (isSelected) => {
    setSelectedProducts(isSelected ? filteredProducts.map(p => p.product_id) : []);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await Promise.all(selectedProducts.map(id => 
        apiService.request(`products/${id}`, { method: 'DELETE' })
      ));
      setSelectedProducts([]);
      setIsDeleteModalOpen(false);
      setPage(1);
      fetchNextPage(true);
      setSuccessMessage(t('productsDeleted'));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleMessage = (customer, product) => {
    const message = encodeURIComponent(
      `${t('runningLowMessage')} ${product.name}\n${t('productLeft')}: ${measurements[product.scale_id]?.weight || 0}kg\n${t('doYouWantToOrder')}`
    );
    const phone = customer?.phone?.replace(/\D/g, '');
    if (phone) {
      const formattedPhone = phone.startsWith('972') ? phone :
                            phone.startsWith('0') ? `972${phone.slice(1)}` : 
                            `972${phone}`;
      window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
    }
  };

  if (isLoading && page === 1) {
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
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              {t(viewTitle)}
            </h2>
            <p className="text-gray-600 mt-1">{t(viewDescription)}</p>
          </div>
          <div className="flex items-center gap-4">
            {canCreate && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
                  hover:bg-blue-700 transition-colors"
                disabled={isDeleting}
              >
                <Plus className="h-5 w-5" />
                {t('addNewProduct')}
              </button>
            )}
            <button
              onClick={() => setViewType(viewType === 'table' ? 'cards' : 'table')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border rounded-lg"
              disabled={isDeleting}
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
              onClick={() => {
                setPage(1);
                fetchNextPage(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isDeleting}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder={t('searchProducts')}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          disabled={isDeleting}
        />
        <div className="absolute left-3 top-2.5">
          {isSearching ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg flex items-center gap-2 text-green-700">
          <AlertCircle className="h-5 w-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {filteredProducts.length === 0 && !isLoading && !error && !isSearching && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">{t(emptyStateMessage)}</p>
          <p className="text-gray-500 text-sm">{t('tryAdjustingSearch')}</p>
        </div>
      )}

      {filteredProducts.length > 0 && viewType === 'table' && (
        <>
          <ProductsTable
            products={filteredProducts}
            customers={customers}
            scales={scales}
            measurements={measurements}
            analytics={analytics}
            selectedProducts={selectedProducts}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onEdit={handleEdit}
            onMessage={handleMessage}
            sortConfig={sortConfig}
            onSort={updateSort}
            isDeleting={isDeleting}
          />
          {isLoading && page > 1 && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
          {selectedProducts.length > 0 && (
            <ProductsSelectionManager
              selectedProducts={selectedProducts}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onDelete={() => setIsDeleteModalOpen(true)}
              totalProducts={filteredProducts.length}
              isRTL={isRTL}
              isDeleting={isDeleting}
            />
          )}
        </>
      )}

      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onSuccess={() => {
            setPage(1);
            fetchNextPage(true);
            setIsModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          itemCount={selectedProducts.length}
          itemType="product"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default ProductsView;