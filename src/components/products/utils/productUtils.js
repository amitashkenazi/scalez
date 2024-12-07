export const getStatusColor = (measurement, thresholds) => {
    if (!measurement?.weight || !thresholds) return 'text-gray-400';
    const weight = measurement.weight;
    if (weight >= thresholds.upper) return 'text-green-600';
    if (weight >= thresholds.lower) return 'text-orange-500';
    return 'text-red-600';
  };
  
  export const getAnalyticsWarningLevel = (type, productAnalytics) => {
    if (!productAnalytics) return { className: '', warningLevel: 'normal' };
  
    if (type === 'quantity') {
      const value = parseFloat(productAnalytics.estimationQuantityLeft);
      const threshold = parseFloat(productAnalytics.quantityLastOrder * 0.75);
      
      if (value <= threshold * 0.5) {
        return { className: 'bg-red-50 text-red-700 font-medium', warningLevel: 'critical' };
      }
      if (value <= threshold) {
        return { className: 'bg-orange-50 text-orange-700 font-medium', warningLevel: 'warning' };
      }
    }
  
    if (type === 'days') {
      const value = parseFloat(productAnalytics.daysFromLastOrder);
      const avgDays = parseFloat(productAnalytics.averageDaysBetweenOrders);
      
      if (value >= avgDays) {
        return { className: 'bg-red-50 text-red-700 font-medium', warningLevel: 'critical' };
      }
      if (value >= avgDays * 0.9) {
        return { className: 'bg-orange-50 text-orange-700 font-medium', warningLevel: 'warning' };
      }
    }
  
    return { className: '', warningLevel: 'normal' };
  };
  
  export const calculateAnalytics = (orders) => {
    if (!Array.isArray(orders) || orders.length === 0) return null;
  
    const parseDate = (dateStr) => {
      const [day, month, year] = dateStr.split('-').map(num => parseInt(num, 10));
      return new Date(2000 + year, month - 1, day);
    };
  
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = parseDate(a.order_date);
      const dateB = parseDate(b.order_date);
      return dateA - dateB;
    });
  
    const firstDate = parseDate(sortedOrders[0].order_date);
    const lastDate = parseDate(sortedOrders[sortedOrders.length - 1].order_date);
    const now = new Date();
  
    const daysFromLastOrder = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    const totalPeriod = Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
  
    const quantities = sortedOrders.map(order => parseFloat(order.quantity || 0));
    const quantityLastOrder = quantities[quantities.length - 1];
    const totalQuantity = quantities.reduce((sum, qty) => sum + qty, 0);
    const dailyAverage = totalQuantity / totalPeriod;
    
    return {
      dailyAverage: dailyAverage.toFixed(2),
      quantityLastOrder,
      daysFromLastOrder: daysFromLastOrder.toString(),
      estimationQuantityLeft: (quantityLastOrder - (dailyAverage * daysFromLastOrder)).toFixed(2),
      averageDaysBetweenOrders: (totalPeriod / (sortedOrders.length - 1)).toFixed(2),
      lastOrderDate: sortedOrders[sortedOrders.length - 1].order_date,
      totalOrders: sortedOrders.length,
      totalQuantity: totalQuantity.toFixed(2)
    };
  };