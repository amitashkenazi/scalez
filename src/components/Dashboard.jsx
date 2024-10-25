// src/components/Dashboard.jsx
import React, { useState } from 'react';
import { filterDataByDateRange, getDefaultDateRange } from '../utils/dateFilterUtils';
import useScaleData from '../hooks/useScaleData';
import DateRangeSelector from './DateRangeSelector';
import ScaleDetail from './ScaleDetail';
import ScaleCard from './ScaleCard';  // Assuming you'll move ScaleCard to its own file

const Dashboard = () => {
  const { scales } = useScaleData();
  const [selectedScale, setSelectedScale] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    const firstScale = scales[0];
    return firstScale ? getDefaultDateRange(firstScale.history) : getDefaultDateRange([]);
  });

  const handleCardClick = (scale) => {
    setSelectedScale(scale);
  };

  const handleStartDateChange = (newStartDate) => {
    setDateRange(prev => ({ ...prev, startDate: newStartDate }));
  };

  const handleEndDateChange = (newEndDate) => {
    setDateRange(prev => ({ ...prev, endDate: newEndDate }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Scale Monitor Dashboard</h1>
        <DateRangeSelector
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scales.map((scale) => (
          <ScaleCard
            key={scale.id}
            scale={scale}
            dateRange={dateRange}
            onCardClick={handleCardClick}
          />
        ))}
      </div>

      {selectedScale && (
        <ScaleDetail 
          scale={selectedScale} 
          onClose={() => setSelectedScale(null)}
          dateRange={dateRange}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
        />
      )}
    </div>
  );
};

export default Dashboard;