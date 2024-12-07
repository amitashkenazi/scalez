import { useState, useCallback, useEffect, useRef } from 'react';
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
  const customersRef = useRef(null);

  // Fetch shared customers once
  useEffect(() => {
    const fetchSharedCustomers = async () => {
      try {
        const customers = await apiService.request('customers/users/me', {
          method: 'GET'
        });
        customersRef.current = customers;
        setSharedCustomers(customers);
      } catch (err) {
        console.error('Error fetching shared customers:', err);
      }
    };

    if (!customersRef.current) {
      fetchSharedCustomers();
    }
  }, []);

  // Update data when either products or customers change
  useEffect(() => {
    if (productsData.data?.products && sharedCustomers.length > 0) {
      const customerIds = sharedCustomers.map(customer => 
        customer.customer_id.includes('_') 
          ? customer.customer_id 
          : `customer_${customer.customer_id}`
      );

      const sharedProducts = productsData.data.products.filter(product => {
        const productCustomerId = product.customer_id.includes('_') 
          ? product.customer_id 
          : `customer_${product.customer_id}`;
        return customerIds.includes(productCustomerId);
      });

      setData({
        ...productsData.data,
        products: sharedProducts,
        customers: sharedCustomers,
      });
    }
  }, [productsData.data, sharedCustomers]);

  const refreshSharedData = useCallback(async () => {
    customersRef.current = null; // Reset customers to force a refresh
    const customers = await apiService.request('customers/users/me', {
      method: 'GET'
    });
    setSharedCustomers(customers);
    await productsData.refreshData();
  }, [productsData.refreshData]);

  const loadMore = useCallback(async () => {
    if (productsData.hasMore) {
      await productsData.loadMore();
    }
  }, [productsData.loadMore, productsData.hasMore]);

  return {
    data,
    isLoading: productsData.isLoading,
    error: productsData.error,
    refreshData: refreshSharedData,
    loadMore,
    hasMore: productsData.hasMore,
  };
};