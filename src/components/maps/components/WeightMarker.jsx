import React from 'react';

const WeightMarker = ({ weight, thresholds }) => {
  const getStatusColor = (value, upper, lower) => {
    if (!value || !upper || !lower) return '#6B7280'; // gray-500
    if (value >= upper) return '#22C55E'; // green-600
    if (value >= lower) return '#F97316'; // orange-500
    return '#DC2626'; // red-600
  };

  const backgroundColor = getStatusColor(weight, thresholds?.upper, thresholds?.lower);

  return (
    <div className="relative flex items-center justify-center">
      {/* Circle background */}
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
        style={{ backgroundColor }}
      >
        {weight ? `${Math.round(weight)}` : '?'}
      </div>
      {/* Bottom label showing kg */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded-full text-xs shadow-md">
        kg
      </div>
    </div>
  );
};

export default WeightMarker;