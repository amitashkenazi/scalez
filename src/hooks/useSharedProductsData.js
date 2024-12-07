import { useState, useCallback, useEffect } from 'react';
import { useProductsData } from '../components/products/hooks/useProductsData';
import apiService from '../services/api';

export const useSharedProductsData = () => {
  const [data, setData] = useState({
    products: [],
    customers: [],
    scales: [],
    measurements: {},
    analytics: {}
  });
  const [sharedCustomers, setSharedCustomers] = useState([]);
  const productsData = useProductsData();

  const fetchSharedProducts = useCallback(async () => {
    try {
      // Get customers where the current user is listed
      const customers = await apiService.request('customers/users/me', {
        method: 'GET'
      });
      setSharedCustomers(customers);

      if (productsData.data?.products) {
        // Filter the products to only include those from shared customers
        const sharedProducts = productsData.data.products.filter(product =>
          customers.some(customer => customer.customer_id === product.customer_id)
        );

        const newData = {
          ...productsData.data,
          products: sharedProducts,
          customers: customers, // Only include shared customers
          scales: productsData.data.scales || [],
          measurements: productsData.data.measurements || {},
          analytics: productsData.data.analytics || {},
        };
        
        setData(newData);
        return newData;
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching shared products:', err);
      return data;
    }
  }, [productsData.data, data]);

  const refreshSharedData = useCallback(async () => {
    await productsData.refreshData();
    return fetchSharedProducts();
  }, [productsData.refreshData, fetchSharedProducts]);

  const loadMore = useCallback(async () => {
    if (!productsData.hasMore) return;
    await productsData.loadMore();
    return fetchSharedProducts();
  }, [productsData.loadMore, productsData.hasMore, fetchSharedProducts]);

  // Fetch data when productsData changes
  useEffect(() => {
    fetchSharedProducts();
  }, [fetchSharedProducts]);

  return {
    data,
    isLoading: productsData.isLoading,
    error: productsData.error,
    refreshData: refreshSharedData,
    loadMore,
    hasMore: productsData.hasMore,
  };
};