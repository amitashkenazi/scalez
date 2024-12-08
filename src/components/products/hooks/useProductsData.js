import { useState, useEffect, useCallback } from 'react';
import apiService from '../../../services/api';

export const useProductsData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'desc'
  });
  const [data, setData] = useState({
    products: [],
    scales: [],
    customers: [],
    measurements: {},
    analytics: {}
  });

  const fetchPage = useCallback(async (pageToken = null, shouldResetData = false) => {
    if (!hasMore && pageToken) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Fetch products with pagination and sorting
      console.log('Fetching products with cursor get params:', {
        pageToken,
        sortConfig
        }
      );

      var query_string = `products?`
      if (pageToken) {
        query_string += `page_token=${pageToken}&`;
      }
      console.log('sortConfig', sortConfig);
        
      if (sortConfig) {
        query_string += `sort_by=${sortConfig.key}&sort_order=${sortConfig.direction}&`;
      }
      const productsResponse = await apiService.request(query_string, {
        method: 'GET'
      });

      // If it's the first page or resetting data, fetch other data as well
      if (!pageToken || shouldResetData) {
        const [scales, customers] = await Promise.all([
          apiService.getScales(),
          apiService.getCustomers()
        ]);

        const measurementsPromises = scales.map(scale => 
          apiService.getLatestMeasurement(scale.scale_id)
        );

        const measurements = await Promise.all(measurementsPromises);
        const measurementsMap = scales.reduce((acc, scale, index) => {
          acc[scale.scale_id] = measurements[index];
          return acc;
        }, {});

        const analyticsItems = productsResponse.items
          .filter(product => product?.customer_id && product?.item_id)
          .map(product => ({
            customer_id: product.customer_id.split('_').pop(),
            item_id: product.item_id.split('_').pop(),
            product_id: product.product_id
          }));

        var analyticsResponse = { results: {} };
        if (analyticsItems.length > 0) {
          analyticsResponse = await apiService.request('orders/customers/item-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: analyticsItems })
          });
        }

        setData({
          products: productsResponse.items,
          scales,
          customers,
          measurements: measurementsMap,
          analytics: analyticsResponse.results || {}
        });
      } else {
        setData(prev => ({
          ...prev,
          products: [...prev.products, ...productsResponse.items]
        }));
      }

      setCursor(productsResponse.next_cursor);
      setHasMore(!!productsResponse.next_cursor);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [sortConfig, hasMore]);

  // Function to update sort configuration
  const updateSort = useCallback((newSortKey) => {
    setSortConfig(prevSort => ({
      key: newSortKey,
      direction: prevSort.key === newSortKey && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const refreshData = useCallback(() => {
    setCursor(null);
    setHasMore(true);
    fetchPage(null, true);
  }, [fetchPage]);

  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, [sortConfig.key, sortConfig.direction]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && cursor) {
      fetchPage(cursor);
    }
  }, [isLoading, hasMore, cursor, fetchPage]);

  return { 
    data,
    isLoading,
    error,
    refreshData,
    loadMore,
    hasMore,
    sortConfig,
    updateSort
  };
};