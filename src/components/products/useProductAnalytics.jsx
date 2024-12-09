import { useState, useEffect } from 'react';
import apiService from '../../services/api';

export const useProductAnalytics = (products) => {
  const [analytics, setAnalytics] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    // Handle date format 'DD-MM-YY'
    const [day, month, year] = dateStr.split('-').map(num => parseInt(num, 10));
    return new Date(2000 + year, month - 1, day);
  };

  useEffect(() => {
    if (!Array.isArray(products) || products.length === 0) return;

    const fetchBatchAnalytics = async () => {
      setIsLoading(true);
      const analyticsData = {};

      try {
        const items = products
          .filter(product => product?.customer_id && product?.item_id)
          .map(product => {
            const customerParts = product.customer_id.split('_');
            const itemParts = product.item_id.split('_');
            
            return {
              customer_id: customerParts[customerParts.length - 1],
              item_id: itemParts[itemParts.length - 1],
              product_id: product.product_id,
              name: product.name
            };
          });

        if (items.length === 0) {
          setAnalytics({});
          return;
        }

        const chunkSize = 50;
        for (let i = 0; i < items.length; i += chunkSize) {
          const chunk = items.slice(i, i + chunkSize);
          
          try {
            const requestItems = chunk.map(({ customer_id, item_id }) => ({
              customer_id,
              item_id
            }));

            if (requestItems.length === 0) continue;

            const response = await apiService.request('orders/customers/item-history', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ items: requestItems })
            });

            if (response?.results) {
              Object.entries(response.results).forEach(([resultKey, orders]) => {
                const [customer_id, item_id] = resultKey.split('_');
                const matchingItem = items.find(
                  item => item.customer_id === customer_id && item.item_id === item_id
                );

                if (matchingItem && orders) {
                  const productAnalytics = calculateAnalytics(orders, matchingItem.product_id);
                  if (productAnalytics) {
                    analyticsData[matchingItem.product_id] = productAnalytics;
                  }
                }
              });
            }
          } catch (error) {
            console.error('[Batch] Error processing chunk:', error);
          }
        }

        setAnalytics(analyticsData);
      } catch (error) {
        console.error('[Batch] Error in fetchBatchAnalytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatchAnalytics();
  }, [products]);

  return { analytics, isLoading };
};