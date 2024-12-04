// src/utils/statusUtils.js

/**
 * Get status information based on weight and thresholds
 * @param {number} weight - Current weight value
 * @param {Object} thresholds - Threshold values
 * @param {number} thresholds.upper - Upper threshold
 * @param {number} thresholds.lower - Lower threshold
 * @returns {Object} Status information including color, background color, status, and distance
 */
export const getStatusInfo = (weight, thresholds) => {
    if (!weight || !thresholds) return { 
      color: 'text-gray-400',
      bgColor: 'bg-gray-50',
      status: 'unknown',
      distance: 0 
    };
  
    const value = parseFloat(weight);
    const upper = parseFloat(thresholds.upper);
    const lower = parseFloat(thresholds.lower);
  
    if (value >= upper) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        status: 'good',
        distance: value - upper
      };
    } else if (value >= lower) {
      return {
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        status: 'warning',
        distance: value - lower
      };
    }
    return {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      status: 'critical',
      distance: lower - value
    };
  };
  
  /**
   * Sort products based on their status
   * @param {Array} products - Array of product objects
   * @param {Object} measurements - Object containing measurements for each scale
   * @returns {Array} Sorted array of products
   */
  export const sortProducts = (products, measurements) => {
    return [...products].sort((a, b) => {
      // If a product doesn't have a scale, it should appear at the end
      if (!a.scale_id && !b.scale_id) return 0;
      if (!a.scale_id) return 1;
      if (!b.scale_id) return -1;
  
      const aWeight = measurements[a.scale_id]?.weight;
      const bWeight = measurements[b.scale_id]?.weight;
      
      const aStatus = getStatusInfo(aWeight, a.thresholds);
      const bStatus = getStatusInfo(bWeight, b.thresholds);
  
      // Sort by status priority: red (critical) -> orange (warning) -> green (good)
      const statusPriority = { critical: 0, warning: 1, good: 2, unknown: 3 };
      
      if (statusPriority[aStatus.status] !== statusPriority[bStatus.status]) {
        return statusPriority[aStatus.status] - statusPriority[bStatus.status];
      }
  
      // Within the same status, sort by distance from threshold
      return bStatus.distance - aStatus.distance;
    });
  };