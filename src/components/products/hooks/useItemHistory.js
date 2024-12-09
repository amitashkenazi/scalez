
// src/components/products/hooks/useItemHistory.js
import { useState, useCallback } from 'react';
import apiService from '../../../services/api';

export const useItemHistory = () => {
  const [histories, setHistories] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [errors, setErrors] = useState({});

  const loadHistory = useCallback(async (product) => {
    const historyKey = product.product_id;
    
    if (histories[historyKey] || loadingStates[historyKey]) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, [historyKey]: true }));
    setErrors(prev => ({ ...prev, [historyKey]: null }));

    try {
      const customerId = product.customer_id.split('_').pop();
      const itemId = product.item_id.split('_').pop();

      const response = await apiService.request('orders/customers/item-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ customer_id: customerId, item_id: itemId }]
        })
      });

      if (response?.results) {
        const historyKey = `${customerId}_${itemId}`;
        const orderHistory = response.results[historyKey];
        
        if (orderHistory) {
          setHistories(prev => ({
            ...prev,
            [product.product_id]: orderHistory
          }));
        } else {
          throw new Error('No history data available');
        }
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setErrors(prev => ({
        ...prev,
        [historyKey]: error.message || 'Failed to load history'
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [historyKey]: false }));
    }
  }, [histories]);

  const clearHistory = useCallback((productId) => {
    setHistories(prev => {
      const newHistories = { ...prev };
      delete newHistories[productId];
      return newHistories;
    });
    setLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[productId];
      return newStates;
    });
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[productId];
      return newErrors;
    });
  }, []);

  const clearAllHistories = useCallback(() => {
    setHistories({});
    setLoadingStates({});
    setErrors({});
  }, []);

  return {
    histories,
    loadingStates,
    errors,
    loadHistory,
    clearHistory,
    clearAllHistories
  };
};