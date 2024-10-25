// src/utils/dateFilterUtils.js

/**
 * Filter data array based on timestamp within date range
 * @param {Array} data - Array of objects with timestamp property
 * @param {string} startDate - Start date in ISO string format
 * @param {string} endDate - End date in ISO string format
 * @returns {Array} Filtered data array
 */
export const filterDataByDateRange = (data, startDate, endDate) => {
    if (!data || !Array.isArray(data)) return [];
    if (!startDate || !endDate) return data;
  
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
  
    return data.filter(item => {
      const timestamp = new Date(item.timestamp).getTime();
      return timestamp >= start && timestamp <= end;
    });
  };
  
  /**
   * Get default date range based on data
   * @param {Array} data - Array of objects with timestamp property
   * @returns {Object} Object containing startDate and endDate
   */
  export const getDefaultDateRange = (data) => {
    if (!data || !data.length) {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        startDate: oneWeekAgo.toISOString().slice(0, 16),
        endDate: now.toISOString().slice(0, 16)
      };
    }
  
    // Find earliest and latest timestamps in the data
    const timestamps = data.map(item => new Date(item.timestamp).getTime());
    const startDate = new Date(Math.min(...timestamps));
    const endDate = new Date(Math.max(...timestamps));
  
    // Format dates to datetime-local input format (YYYY-MM-DDTHH:mm)
    return {
      startDate: startDate.toISOString().slice(0, 16),
      endDate: endDate.toISOString().slice(0, 16)
    };
  };