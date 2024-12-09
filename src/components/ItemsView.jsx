import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { 
  Package, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Search,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import apiService from '../services/api';

const ItemsView = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [generatingProducts, setGeneratingProducts] = useState({});
  const [monitoredItems, setMonitoredItems] = useState(new Set());

  const { language } = useLanguage();
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';

  const fetchItems = async (showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoading(true);
    }
    
    try {
      const response = await apiService.request('items', {
        method: 'GET'
      });
      setItems(response || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to fetch items');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchItems(false);
  };

  const handleGenerateProducts = async (itemId) => {
    setGeneratingProducts(prev => ({ ...prev, [itemId]: true }));
    try {
      const result = await apiService.generateProductsForItem(itemId);
      
      const message = `Successfully generated ${result.created_products.length} products for ${
        result.total_customers_found} customers. ${
        result.skipped_products.length} products already existed.`;
      
      showSuccessMessage(message);
      setMonitoredItems(prev => new Set([...prev, itemId]));
    } catch (err) {
      setError('Failed to generate products');
      console.error('Error generating products:', err);
    } finally {
      setGeneratingProducts(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const filteredItems = items.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              {t('title')}
            </h2>
            <p className="text-gray-600 mt-1">{t('description')}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 h-5 w-5 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('itemCode')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('uom')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('status')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <tr key={item.item_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.itemCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.uom}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {monitoredItems.has(item.itemCode) && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      {t('monitored')}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleGenerateProducts(item.itemCode)}
                    disabled={generatingProducts[item.itemCode]}
                    className={`inline-flex items-center px-3 py-1.5 border border-transparent 
                      text-sm font-medium rounded-md text-white
                      ${generatingProducts[item.itemCode] 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'}
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                      transition-all duration-200 min-w-[150px] justify-center`}
                  >
                    {generatingProducts[item.itemCode] ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {t('generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {t('generateProducts')}
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">
              {t('noItemsFound')}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? t('adjustSearch') : t('addItemsPrompt')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemsView;