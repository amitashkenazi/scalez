// src/utils/thresholdUtils.js
export const getStatusColor = (value, upper, lower) => {
  if (value >= upper) {
    return 'text-green-600';
  } else if (value >= lower) {
    return 'text-orange-500';
  } else {
    return 'text-red-600';
  }
};
