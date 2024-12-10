import { useState, useCallback, useEffect } from 'react';
import apiService from '../../../services/api';

export const useProductsData = () => {
  const [data, setData] = useState({
    products: [],
    scales: [],
    customers: [],
    measurements: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: 'severity',
    direction: 'desc'
  });
  const [pageSize] = useState(20);

  const fetchNextPage = useCallback(async (reset = false) => {
    if (isLoading && !reset) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const currentProducts = reset ? [] : data.products;
      const page = reset ? 1 : Math.floor(currentProducts.length / pageSize) + 1;

      const query = `products?${
        sortConfig ? `sort_by=${sortConfig.key}&sort_order=${sortConfig.direction}&` : ''
      }page=${page}&limit=${pageSize}`;
      
      const [productsResponse, scales, customers] = await Promise.all([
        apiService.request(query),
        reset ? apiService.getScales() : Promise.resolve(data.scales),
        reset ? apiService.getCustomers() : Promise.resolve(data.customers)
      ]);
      console.log('Products response:', productsResponse);

      const newProducts = productsResponse.items || [];
      setHasNextPage(newProducts.length === pageSize);

      const newMeasurements = reset ? {} : { ...data.measurements };
      if (reset || !data.scales.length) {
        const validScales = scales.filter(scale => scale.scale_id);
        const measurements = await Promise.all(
          validScales.map(scale => apiService.getLatestMeasurement(scale.scale_id))
        );
        validScales.forEach((scale, index) => {
          newMeasurements[scale.scale_id] = measurements[index];
        });
      } else {
        const newScaleIds = newProducts
          .map(p => p.scale_id)
          .filter(id => id && !newMeasurements[id]);
        
        if (newScaleIds.length > 0) {
          const newMeasurementsData = await Promise.all(
            newScaleIds.map(scaleId => apiService.getLatestMeasurement(scaleId))
          );
          newScaleIds.forEach((scaleId, index) => {
            newMeasurements[scaleId] = newMeasurementsData[index];
          });
        }
      }
      
      setData(prev => ({
        products: reset ? newProducts : [...prev.products, ...newProducts],
        scales: reset ? scales : prev.scales,
        customers: reset ? customers : prev.customers,
        measurements: newMeasurements
      }));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [data, isLoading, sortConfig, pageSize]);

  const updateSort = useCallback((newSortKey) => {
    setSortConfig(prev => ({
      key: newSortKey,
      direction: prev.key === newSortKey && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    fetchNextPage(true);
  }, [fetchNextPage]);

  useEffect(() => {
    fetchNextPage(true);
  }, []);

  return {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    sortConfig,
    updateSort
  };
};