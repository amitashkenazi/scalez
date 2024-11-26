export const createCustomMarkerIcon = (weight, thresholds, hasPendingDelivery, isVendor = false) => {
  const getStatusColor = (value, upper, lower) => {
    if (!value || !upper || !lower) return '#6B7280'; // gray-500
    if (value >= upper) return '#22C55E'; // green-600
    if (value >= lower) return '#F97316'; // orange-500
    return '#DC2626'; // red-600
  };

  const baseColor = isVendor ? '#3B82F6' : getStatusColor(weight, thresholds?.upper, thresholds?.lower);
  const strokeColor = hasPendingDelivery ? '#9333EA' : '#FFFFFF';
  const strokeWidth = hasPendingDelivery ? 3 : 2;

  const displayText = isVendor ? 'HQ' : (weight ? Math.round(weight) : '?');

  const svgContent = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${baseColor}" 
        stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
      <text x="20" y="20" font-size="12" fill="white" 
        text-anchor="middle" dominant-baseline="middle" font-family="Arial">
        ${displayText}
      </text>
    </svg>
  `;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgContent),
    scaledSize: new window.google.maps.Size(40, 40),
    anchor: new window.google.maps.Point(20, 20),
  };
};