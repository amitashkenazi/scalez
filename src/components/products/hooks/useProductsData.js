import { useState, useEffect, useCallback } from 'react';
import apiService from '../../../services/api';

export const useProductsData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [data, setData] = useState({
    products: [],
    scales: [],
    customers: [],
    measurements: {},
    analytics: {}
  });

  const fetchPage = useCallback(async (pageToken = null) => {
    if (!hasMore && pageToken) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Fetch products with pagination
      const productsResponse = await apiService.request('products', {
        method: 'GET',
        params: {
          cursor: pageToken,
          limit: 20 // Adjust this value based on your needs
        }
      });

      // If it's the first page, fetch other data as well
      if (!pageToken) {
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

        const analyticsItems = productsResponse.items.map(product => ({
          customer_id: product.customer_id.split('_').pop(),
          item_id: product.item_id.split('_').pop(),
          product_id: product.product_id
        }));

        const analyticsResponse = await apiService.request('orders/customers/item-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: analyticsItems })
        });

        setData(prev => ({
          products: productsResponse.items,
          scales,
          customers,
          measurements: measurementsMap,
          analytics: analyticsResponse.results || {}
        }));
      } else {
        // For subsequent pages, only update products and related analytics
        const analyticsItems = productsResponse.items.map(product => ({
          customer_id: product.customer_id.split('_').pop(),
          item_id: product.item_id.split('_').pop(),
          product_id: product.product_id
        }));

        const analyticsResponse = await apiService.request('orders/customers/item-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: analyticsItems })
        });

        setData(prev => ({
          ...prev,
          products: [...prev.products, ...productsResponse.items],
          analytics: { ...prev.analytics, ...analyticsResponse.results }
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
  }, [hasMore]);

  const refreshData = useCallback(async () => {
    setCursor(null);
    setHasMore(true);
    await fetchPage(null);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchPage(cursor);
    }
  }, [isLoading, hasMore, cursor, fetchPage]);

  useEffect(() => {
    fetchPage(null);
  }, [fetchPage]);

  return { 
    data,
    isLoading,
    error,
    refreshData,
    loadMore,
    hasMore
  };
};