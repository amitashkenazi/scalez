/**
 * Determines the status color class based on weight value and thresholds
 * @param {number} value - Current weight value
 * @param {number} upper - Upper threshold
 * @param {number} lower - Lower threshold
 * @returns {string} Tailwind CSS color class
 */
export function getStatusColor(value, upper, lower) {
  if (value >= upper) {
    return 'text-green-600';
  } else if (value >= lower) {
    return 'text-orange-500';
  } else {
    return 'text-red-600';
  }
}

/**
 * Determines the graph color based on weight value and thresholds
 * @param {number} value - Current weight value
 * @param {number} upper - Upper threshold
 * @param {number} lower - Lower threshold
 * @returns {string} HEX color code
 */
export function getGraphColor(value, upper, lower) {
  if (value >= upper) {
    return '#22c55e'; // green
  } else if (value >= lower) {
    return '#f97316'; // orange
  } else {
    return '#dc2626'; // red
  }
}

/**
 * Gets the background color class for the scale circle based on status
 * @param {string} statusColor - The status color class
 * @returns {string} Tailwind CSS background color class
 */
export function getBackgroundColor(statusColor) {
  const bgColorMap = {
    'text-green-600': 'bg-green-100',
    'text-orange-500': 'bg-orange-100',
    'text-red-600': 'bg-red-100',
    'text-gray-400': 'bg-gray-100'
  };
  return bgColorMap[statusColor] || 'bg-gray-100';
}

/**
 * Validates threshold values
 * @param {Object} thresholds - Threshold object
 * @param {number} thresholds.upper - Upper threshold value
 * @param {number} thresholds.lower - Lower threshold value
 * @returns {Object} Validation result with status and message
 */
export function validateThresholds(thresholds) {
  if (!thresholds || typeof thresholds !== 'object') {
    return {
      isValid: false,
      message: 'Invalid threshold object'
    };
  }

  const { upper, lower } = thresholds;

  if (typeof upper !== 'number' || typeof lower !== 'number') {
    return {
      isValid: false,
      message: 'Thresholds must be numbers'
    };
  }

  if (isNaN(upper) || isNaN(lower)) {
    return {
      isValid: false,
      message: 'Thresholds cannot be NaN'
    };
  }

  if (upper <= lower) {
    return {
      isValid: false,
      message: 'Upper threshold must be greater than lower threshold'
    };
  }

  if (upper <= 0 || lower < 0) {
    return {
      isValid: false,
      message: 'Thresholds cannot be negative'
    };
  }

  return {
    isValid: true,
    message: 'Valid thresholds'
  };
}

/**
 * Validates notification settings
 * @param {Object} notifications - Notifications configuration object
 * @returns {Object} Validation result with status and message
 */
export function validateNotifications(notifications) {
  if (!notifications || typeof notifications !== 'object') {
    return {
      isValid: false,
      message: 'Invalid notifications object'
    };
  }

  const { upper, lower } = notifications;

  if (!upper || !lower) {
    return {
      isValid: false,
      message: 'Both upper and lower notifications must be configured'
    };
  }

  // Validate phone numbers using E.164 format
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;

  if (!phoneRegex.test(upper.phoneNumber)) {
    return {
      isValid: false,
      message: 'Invalid upper threshold phone number'
    };
  }

  if (!phoneRegex.test(lower.phoneNumber)) {
    return {
      isValid: false,
      message: 'Invalid lower threshold phone number'
    };
  }

  if (!upper.message || upper.message.trim().length === 0) {
    return {
      isValid: false,
      message: 'Upper threshold message is required'
    };
  }

  if (!lower.message || lower.message.trim().length === 0) {
    return {
      isValid: false,
      message: 'Lower threshold message is required'
    };
  }

  return {
    isValid: true,
    message: 'Valid notifications configuration'
  };
}

/**
 * Gets the threshold status of a scale
 * @param {number} currentWeight - Current weight value
 * @param {Object} thresholds - Threshold object
 * @returns {Object} Status object with type and message
 */
export function getThresholdStatus(currentWeight, thresholds) {
  if (currentWeight >= thresholds.upper) {
    return {
      type: 'success',
      message: 'Weight is above upper threshold'
    };
  } else if (currentWeight >= thresholds.lower) {
    return {
      type: 'warning',
      message: 'Weight is between thresholds'
    };
  } else {
    return {
      type: 'error',
      message: 'Weight is below lower threshold'
    };
  }
}

/**
 * Formats a weight value for display
 * @param {number} weight - Weight value
 * @param {string} unit - Weight unit (default: 'kg')
 * @returns {string} Formatted weight string
 */
export function formatWeight(weight, unit = 'kg') {
  if (typeof weight !== 'number' || isNaN(weight)) {
    return 'N/A';
  }
  return `${Math.round(weight * 10) / 10} ${unit}`;
}

/**
 * Calculates the percentage between thresholds
 * @param {number} value - Current value
 * @param {number} upper - Upper threshold
 * @param {number} lower - Lower threshold
 * @returns {number} Percentage value (0-100)
 */
export function calculateThresholdPercentage(value, upper, lower) {
  if (value >= upper) return 100;
  if (value <= lower) return 0;
  
  const range = upper - lower;
  const valueAboveLower = value - lower;
  return Math.round((valueAboveLower / range) * 100);
}