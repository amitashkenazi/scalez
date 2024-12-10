// Helper function to parse numeric values, handling special cases
export const parseNumericValue = (value) => {
    if (typeof value === 'number') return value;
    if (!value || value === 'Not enough data' || value === 'No enough dataa') return -Infinity;
    
    // Remove any non-numeric characters except decimal points and negative signs
    const numericString = value.toString().replace(/[^\d.-]/g, '');
    const parsed = parseFloat(numericString);
    return isNaN(parsed) ? -Infinity : parsed;
  };
  
  // Helper to compare strings, handling null/undefined
  export const compareStrings = (a, b) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.toString().localeCompare(b.toString());
  };
  
  // Get color based on weight status
  export const getStatusColor = (measurement, thresholds) => {
    if (!measurement?.weight || !thresholds) return 'text-gray-400';
    const weight = measurement.weight;
    if (weight >= thresholds.upper) return 'text-green-600';
    if (weight >= thresholds.lower) return 'text-orange-500';
    return 'text-red-600';
  };
  
  
  // Parse date string in DD-MM-YY format
  export const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('-').map(num => parseInt(num, 10));
    return new Date(2000 + year, month - 1, day);
  };
  
  // Calculate analytics for orders
  export const calculateAnalytics = (orders) => {
    if (!Array.isArray(orders) || orders.length === 0) return null;
  
    try {
      // Sort orders by date
      const sortedOrders = [...orders].sort((a, b) => {
        const dateA = parseDate(a.order_date);
        const dateB = parseDate(b.order_date);
        if (!dateA || !dateB) return 0;
        return dateA - dateB;
      });
  
      const firstDate = parseDate(sortedOrders[0].order_date);
      const lastDate = parseDate(sortedOrders[sortedOrders.length - 1].order_date);
      const now = new Date();
  
      // Calculate time periods
      const daysFromLastOrder = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      const totalPeriod = Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
  
      // Extract quantities
      const quantities = sortedOrders.map(order => parseFloat(order.quantity || 0));
      const quantityLastOrder = quantities[quantities.length - 1];
      const totalQuantity = quantities.reduce((sum, qty) => sum + qty, 0);
  
      // Calculate daily average
      const dailyAverage = totalQuantity / totalPeriod;
  
      // Calculate estimated quantity left
      let estimationQuantityLeft = "Not enough data";
      if (orders.length > 3) {
        estimationQuantityLeft = (quantityLastOrder - (dailyAverage * daysFromLastOrder)).toFixed(2);
      }
  
      // Calculate average days between orders
      const orderIntervals = [];
      for (let i = 1; i < sortedOrders.length; i++) {
        const currentDate = parseDate(sortedOrders[i].order_date);
        const prevDate = parseDate(sortedOrders[i - 1].order_date);
        if (currentDate && prevDate) {
          const interval = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
          orderIntervals.push(interval);
        }
      }
      
      const averageDaysBetweenOrders = orderIntervals.length > 0 
        ? (orderIntervals.reduce((sum, interval) => sum + interval, 0) / orderIntervals.length).toFixed(2)
        : totalPeriod.toString();
  
      return {
        dailyAverage: dailyAverage.toFixed(2),
        quantityLastOrder,
        daysFromLastOrder: daysFromLastOrder.toString(),
        estimationQuantityLeft,
        averageDaysBetweenOrders,
        lastOrderDate: sortedOrders[sortedOrders.length - 1].order_date,
        totalOrders: sortedOrders.length,
        totalQuantity: totalQuantity.toFixed(2),
        orderHistory: sortedOrders,
        dailyConsumptionRate: (orders.length - 1) / (totalPeriod - 1),
      };
    } catch (error) {
      console.error('Error calculating analytics:', error);
      return null;
    }
  };
  
  // Calculate severity score for a product
  export const calculateSeverityScore = (analytics) => {
    if (!analytics) return 0;
  
    let score = 0;
    
    // Factor 1: Days since last order vs average (0-50 points)
    const daysFromLast = parseFloat(analytics.daysFromLastOrder);
    const avgDays = parseFloat(analytics.averageDaysBetweenOrders);
    
    if (!isNaN(daysFromLast) && !isNaN(avgDays) && avgDays > 0) {
      const daysRatio = daysFromLast / avgDays;
      if (daysRatio >= 1.5) score += 50;
      else if (daysRatio >= 1.2) score += 35;
      else if (daysRatio >= 1.0) score += 20;
      else score += 10;
    }
  
    // Factor 2: Estimated quantity remaining vs last order quantity (0-50 points)
    const estimatedLeft = parseFloat(analytics.estimationQuantityLeft);
    const lastOrderQty = parseFloat(analytics.quantityLastOrder);
    
    if (!isNaN(estimatedLeft) && !isNaN(lastOrderQty) && lastOrderQty > 0) {
      const qtyRatio = estimatedLeft / lastOrderQty;
      if (qtyRatio <= 0.25) score += 50;
      else if (qtyRatio <= 0.5) score += 35;
      else if (qtyRatio <= 0.75) score += 20;
      else score += 10;
    }
  
    return Math.round(score);
  };
  
  
  
  // Get severity level information based on score
  export const getSeverityLevel = (score) => {
    if (score >= 80) return { 
      level: 'Critical', 
      className: 'bg-red-100 text-red-800'
    };
    if (score >= 60) return { 
      level: 'High', 
      className: 'bg-orange-100 text-orange-800'
    };
    if (score >= 40) return { 
      level: 'Medium', 
      className: 'bg-yellow-100 text-yellow-800'
    };
    return { 
      level: 'Low', 
      className: 'bg-green-100 text-green-800'
    };
  };
  
  // Get analytics warning level
  export const getAnalyticsWarningLevel = (type, estimationQuantityLeft, quantityLastOrder, daysFromLastOrder, averageDaysBetweenOrders) => {
  
    if (type === 'quantity') {
      const value = parseFloat(estimationQuantityLeft);
      const threshold = parseFloat(quantityLastOrder * 0.75);
      
      if (value <= threshold * 0.5) {
        return { className: 'bg-red-50 text-red-700 font-medium', warningLevel: 'critical' };
      }
      if (value <= threshold) {
        return { className: 'bg-orange-50 text-orange-700 font-medium', warningLevel: 'warning' };
      }
    }
  
    if (type === 'days') {
      const value = parseFloat(daysFromLastOrder);
      const avgDays = parseFloat(averageDaysBetweenOrders);
      
      if (value >= avgDays) {
        return { className: 'bg-red-50 text-red-700 font-medium', warningLevel: 'critical' };
      }
      if (value >= avgDays * 0.9) {
        return { className: 'bg-orange-50 text-orange-700 font-medium', warningLevel: 'warning' };
      }
    }
  
    return { className: '', warningLevel: 'normal' };
  };
  
  
  // Sort products based on various criteria
  export const sortProducts = (products, sortConfig, measurements, analytics) => {
    if (!sortConfig.key) return products;
  
    return [...products].sort((a, b) => {
      let aValue, bValue;
  
      switch (sortConfig.key) {
        case 'severity': {
          const aAnalyticsKey = `${a.customer_id.split('_').pop()}_${a.item_id.split('_').pop()}`;
          const bAnalyticsKey = `${b.customer_id.split('_').pop()}_${b.item_id.split('_').pop()}`;
          const aAnalytics = analytics[aAnalyticsKey] ? calculateAnalytics(analytics[aAnalyticsKey]) : null;
          const bAnalytics = analytics[bAnalyticsKey] ? calculateAnalytics(analytics[bAnalyticsKey]) : null;
          
          aValue = calculateSeverityScore(aAnalytics);
          bValue = calculateSeverityScore(bAnalytics);
          break;
        }
  
        case 'name': {
          aValue = a.name;
          bValue = b.name;
          const comparison = compareStrings(aValue, bValue);
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }
  
        case 'weight': {
          aValue = measurements[a.scale_id]?.weight || -Infinity;
          bValue = measurements[b.scale_id]?.weight || -Infinity;
          break;
        }
  
        case 'estimationQuantityLeft': {
          const aAnalyticsKey = `${a.customer_id.split('_').pop()}_${a.item_id.split('_').pop()}`;
          const bAnalyticsKey = `${b.customer_id.split('_').pop()}_${b.item_id.split('_').pop()}`;
          const aAnalytics = analytics[aAnalyticsKey] ? calculateAnalytics(analytics[aAnalyticsKey]) : null;
          const bAnalytics = analytics[bAnalyticsKey] ? calculateAnalytics(analytics[bAnalyticsKey]) : null;
          
          aValue = parseNumericValue(aAnalytics?.estimationQuantityLeft);
          bValue = parseNumericValue(bAnalytics?.estimationQuantityLeft);
          break;
        }
  
        case 'daysFromLastOrder': {
          const aAnalyticsKey = `${a.customer_id.split('_').pop()}_${a.item_id.split('_').pop()}`;
          const bAnalyticsKey = `${b.customer_id.split('_').pop()}_${b.item_id.split('_').pop()}`;
          const aAnalytics = analytics[aAnalyticsKey] ? calculateAnalytics(analytics[aAnalyticsKey]) : null;
          const bAnalytics = analytics[bAnalyticsKey] ? calculateAnalytics(analytics[bAnalyticsKey]) : null;
          
          aValue = parseNumericValue(aAnalytics?.daysFromLastOrder);
          bValue = parseNumericValue(bAnalytics?.daysFromLastOrder);
          break;
        }
  
        default:
          return 0;
      }
  
      // Handle special cases
      if (aValue === -Infinity && bValue === -Infinity) return 0;
      if (aValue === -Infinity) return 1;
      if (bValue === -Infinity) return -1;
      
      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  };