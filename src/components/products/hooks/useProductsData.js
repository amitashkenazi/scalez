import { useState, useEffect, useCallback } from 'react';
import apiService from '../../../services/api';
import { calculateAnalytics } from '../utils/productUtils';

export const useProductsData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const fetchOrdersHistory = async (products) => {
    try {
      const items = products.map(product => ({
        customer_id: product.customer_id.split('_').pop(),
        item_id: product.item_id.split('_').pop()
      }));

      console.log('Requesting orders history for:', items);

    //   const response = await apiService.request('orders/customers/item-history', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ items })
    //   });

    //   console.log('Orders history response:', response);

      const analyticsMap = {};
        products.forEach(product => {
        //     dailyAverage: dailyAverage.toFixed(2),
        // quantityLastOrder,
        // daysFromLastOrder: daysFromLastOrder.toString(),
        // estimationQuantityLeft,
        // averageDaysBetweenOrders,
        // lastOrderDate: sortedOrders[sortedOrders.length - 1].order_date,
        // totalOrders: sortedOrders.length,
        // totalQuantity: totalQuantity.toFixed(2),
        // orderHistory: sortedOrders
        analyticsMap[product.product_id] = product;
        });

      console.log('Processed analytics map:', analyticsMap);
      return analyticsMap;
    } catch (error) {
      console.error('Error fetching orders history:', error);
      return {};
    }
  };

  const fetchData = useCallback(async (shouldResetData = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const query_string = `products?${
        sortConfig ? `sort_by=${sortConfig.key}&sort_order=${sortConfig.direction}&` : ''
      }`;
      
      console.log('Fetching products...');

      const [productsResponse, scales, customers] = await Promise.all([
        apiService.request(query_string, { method: 'GET' }),
        shouldResetData ? apiService.getScales() : Promise.resolve(data.scales),
        shouldResetData ? apiService.getCustomers() : Promise.resolve(data.customers)
      ]);

      const products = productsResponse.items || [];
      console.log('Products fetched:', products);

      // Process measurements
      let measurementsMap = data.measurements;
      if (shouldResetData) {
        const measurements = await Promise.all(
          scales.map(scale => apiService.getLatestMeasurement(scale.scale_id))
        );
        measurementsMap = scales.reduce((acc, scale, index) => {
          acc[scale.scale_id] = measurements[index];
          return acc;
        }, {});
      }

      // Fetch and process analytics
      const analyticsMap = await fetchOrdersHistory(products);

      setData({
        products,
        scales: shouldResetData ? scales : data.scales,
        customers: shouldResetData ? customers : data.customers,
        measurements: measurementsMap,
        analytics: analyticsMap
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [sortConfig, data]);

  const updateSort = useCallback((newSortKey) => {
    setSortConfig(prevSort => ({
      key: newSortKey,
      direction: prevSort.key === newSortKey && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  useEffect(() => {
    fetchData();
  }, [sortConfig.key, sortConfig.direction]);

  return {
    data,
    isLoading,
    error,
    refreshData: () => fetchData(true),
    sortConfig,
    updateSort
  };
};