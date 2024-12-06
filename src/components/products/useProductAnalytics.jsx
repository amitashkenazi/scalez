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

  const calculateAnalytics = (orders, productId) => {
    if (!Array.isArray(orders) || orders.length === 0) return null;

    try {
      console.log(`[Analytics] Input orders for product ${productId}:`, orders);
      
      // Sort orders by date
      const sortedOrders = [...orders].sort((a, b) => {
        const dateA = parseDate(a.order_date);
        const dateB = parseDate(b.order_date);
        if (!dateA || !dateB) return 0;
        return dateA - dateB;
      });

      console.log(`[Analytics] Sorted orders:`, sortedOrders);

      const firstDate = parseDate(sortedOrders[0].order_date);
      const lastDate = parseDate(sortedOrders[sortedOrders.length - 1].order_date);
      const now = new Date();

      console.log(`[Analytics] Date ranges:`, {
        firstDate,
        lastDate,
        now
      });

      // Calculate time periods
      const daysFromLastOrder = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      const daysBetweenOrders = Math.max(1, Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
      const totalPeriod = daysBetweenOrders + 1; // Include both start and end dates

      // Extract quantities, ensuring proper numeric parsing
      const quantities = sortedOrders.map(order => {
        const qty = parseFloat(order.quantity || 0);
        return isNaN(qty) ? 0 : qty;
      });

      const quantityLastOrder = quantities[quantities.length - 1];
      const totalQuantity = quantities.reduce((sum, qty) => sum + qty, 0);

      console.log(`[Analytics] Quantity calculations:`, {
        quantities,
        quantityLastOrder,
        totalQuantity,
        daysFromLastOrder,
        totalPeriod
      });

      // Calculate order intervals
      const orderIntervals = [];
      for (let i = 1; i < sortedOrders.length; i++) {
        const currentDate = parseDate(sortedOrders[i].order_date);
        const prevDate = parseDate(sortedOrders[i - 1].order_date);
        if (currentDate && prevDate) {
          const interval = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
          orderIntervals.push(interval);
        }
      }

      // Calculate consumption metrics
      const averageDaysBetweenOrders = orderIntervals.length > 0 
        ? orderIntervals.reduce((sum, interval) => sum + interval, 0) / orderIntervals.length
        : totalPeriod;

      // Calculate daily average based on the pattern of orders
      const dailyAverage = sortedOrders.length > 1
        ? quantities.reduce((sum, qty) => sum + qty, 0) / totalPeriod
        : quantityLastOrder / averageDaysBetweenOrders;

      // Calculate estimated quantity left
      const estimationQuantityLeft = quantityLastOrder - (dailyAverage * daysFromLastOrder);

      // Calculate consumption percentage per day
      const dailyConsumptionPercentage = (dailyAverage / quantityLastOrder) * 100;

      const result = {
        dailyAverage: dailyAverage.toFixed(2),
        quantityLastOrder,
        daysFromLastOrder: daysFromLastOrder.toString(),
        estimationQuantityLeft: estimationQuantityLeft.toFixed(2),
        averageDaysBetweenOrders: averageDaysBetweenOrders.toFixed(2),
        lastOrderDate: sortedOrders[sortedOrders.length - 1].order_date,
        totalOrders: sortedOrders.length,
        totalQuantity: totalQuantity.toFixed(2),
        dailyConsumptionPercentage: dailyConsumptionPercentage.toFixed(1),
        orderHistory: sortedOrders.map(order => ({
          date: order.order_date,
          quantity: parseFloat(order.quantity || 0),
          total: parseFloat(order.total || 0)
        }))
      };

      console.log(`[Analytics] Calculated result for product ${productId}:`, result);
      return result;
    } catch (error) {
      console.error(`[Analytics] Error calculating analytics for product ${productId}:`, error);
      return null;
    }
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

        console.log('[Batch] Setting final analytics data:', analyticsData);
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