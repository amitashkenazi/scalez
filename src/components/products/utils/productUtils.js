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
  
  // Calculate analytics for invoices
  export const calculateAnalytics = (product, invoices) => {
    if (!Array.isArray(invoices) || invoices.length === 0) return null;
    console.log('calculateAnalytics product',product);
    try {
      // Sort invoices by date
      const sortedInvoices = [...invoices].sort((a, b) => {
        const dateA = parseDate(a.invoice_date);
        const dateB = parseDate(b.invoice_date);
        if (!dateA || !dateB) return 0;
        return dateA - dateB;
      });
  
      const firstDate = parseDate(sortedInvoices[0].invoice_date);
      const lastDate = parseDate(sortedInvoices[sortedInvoices.length - 1].invoice_date);
      const now = new Date();
  
      // Calculate time periods
      const daysFromLastInvoice = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      const totalPeriod = Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
      
      // Extract quantities
      const quantities = sortedInvoices.map(invoice => parseFloat(invoice.quantity || 0));
      const quantityLastInvoice = quantities[quantities.length - 1];
      const totalQuantity = quantities.reduce((sum, qty) => sum + qty, 0);
  
      // Calculate daily average
      const dailyAverage = totalQuantity / totalPeriod;
  
      // Calculate estimated quantity left
      let estimationQuantityLeft = "Not enough data";
      if (invoices.length > 3) {
        estimationQuantityLeft = (quantityLastInvoice - (dailyAverage * daysFromLastInvoice)).toFixed(2);
      }
  
      // Calculate average days between invoices
      const invoiceIntervals = [];
      for (let i = 1; i < sortedInvoices.length; i++) {
        const currentDate = parseDate(sortedInvoices[i].invoice_date);
        const prevDate = parseDate(sortedInvoices[i - 1].invoice_date);
        if (currentDate && prevDate) {
          const interval = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
          invoiceIntervals.push(interval);
        }
      }
      
      const averageDaysBetweenInvoices = invoiceIntervals.length > 0 
        ? (invoiceIntervals.reduce((sum, interval) => sum + interval, 0) / invoiceIntervals.length).toFixed(2)
        : totalPeriod.toString();
      console.log("productproduct: ",product);
      console.log("productproduct: ",product.daily_average);
      return {
        dailyAverage: product.daily_average,
        quantityLastInvoice,
        daysFromLastInvoice: daysFromLastInvoice.toString(),
        estimationQuantityLeft,
        averageDaysBetweenInvoices,
        lastInvoiceDate: sortedInvoices[sortedInvoices.length - 1].invoice_date,
        totalInvoices: sortedInvoices.length,
        totalQuantity: totalQuantity.toFixed(2),
        invoiceHistory: sortedInvoices,
        dailyConsumptionRate: product.daily_consumption_percentage,
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
    // Factor 1: Days since last invoice vs average (0-50 points)
    const daysFromLast = parseFloat(analytics.daysFromLastInvoice);
    const avgDays = parseFloat(analytics.averageDaysBetweenInvoices);
    
    if (!isNaN(daysFromLast) && !isNaN(avgDays) && avgDays > 0) {
      const daysRatio = daysFromLast / avgDays;
      if (daysRatio >= 1.5) score += 50;
      else if (daysRatio >= 1.2) score += 35;
      else if (daysRatio >= 1.0) score += 20;
      else score += 10;
    }
  
    // Factor 2: Estimated quantity remaining vs last invoice quantity (0-50 points)
    const estimatedLeft = parseFloat(analytics.estimationQuantityLeft);
    const lastInvoiceQty = parseFloat(analytics.quantityLastInvoice);
    
    if (!isNaN(estimatedLeft) && !isNaN(lastInvoiceQty) && lastInvoiceQty > 0) {
      const qtyRatio = estimatedLeft / lastInvoiceQty;
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
  export const getAnalyticsWarningLevel = (type, estimationQuantityLeft, quantityLastInvoice, daysFromLastInvoice, averageDaysBetweenInvoices) => {
    if (type === 'quantity') {
      const value = parseFloat(estimationQuantityLeft);
      const threshold = parseFloat(quantityLastInvoice * 0.75);
      
      if (value <= threshold * 0.5) {
        return { className: 'bg-red-50 text-red-700 font-medium', warningLevel: 'critical' };
      }
      if (value <= threshold) {
        return { className: 'bg-orange-50 text-orange-700 font-medium', warningLevel: 'warning' };
      }
    }
  
    if (type === 'days') {
      const value = parseFloat(daysFromLastInvoice);
      const avgDays = parseFloat(averageDaysBetweenInvoices);
      
      if (value >= avgDays) {
        return { className: 'bg-red-50 text-red-700 font-medium', warningLevel: 'critical' };
      }
      if (value >= avgDays * 0.9) {
        return { className: 'bg-orange-50 text-orange-700 font-medium', warningLevel: 'warning' };
      }
    }
  
    return { className: '', warningLevel: 'normal' };
  };
  
  