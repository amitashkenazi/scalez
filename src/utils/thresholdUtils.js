// thresholdUtils.js
export function getStatusColor(value, upper, lower) {
  if (value >= upper) {
    return 'text-green-600';
  } else if (value >= lower) {
    return 'text-orange-500';
  } else {
    return 'text-red-600';
  }
}

export function getGraphColor(value, upper, lower) {
  if (value >= upper) {
    return '#22c55e'; // green
  } else if (value >= lower) {
    return '#f97316'; // orange
  } else {
    return '#dc2626'; // red
  }
}