import React, { useState } from 'react';
import useScaleData from '../hooks/useScaleData';
import ScaleDetail from './ScaleDetail';
import ScaleCard from './ScaleCard';
import { getDefaultDateRange } from '../utils/dateFilterUtils';

const Dashboard = ({ selectedScaleIds }) => {
  const { scales, updateScale } = useScaleData();
  const [selectedScale, setSelectedScale] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    const firstScale = scales[0];
    return firstScale ? getDefaultDateRange(firstScale.history) : getDefaultDateRange([]);
  });

  // Filter scales based on selectedScaleIds if provided
  const displayedScales = selectedScaleIds 
    ? scales.filter(scale => selectedScaleIds.includes(scale.id))
    : scales;

  const handleCardClick = (scale) => {
    setSelectedScale(scale);
  };

  const handleStartDateChange = (newStartDate) => {
    setDateRange(prev => ({ ...prev, startDate: newStartDate }));
  };

  const handleEndDateChange = (newEndDate) => {
    setDateRange(prev => ({ ...prev, endDate: newEndDate }));
  };

  const handleSaveScale = async (updatedScale) => {
    try {
      await updateScale(updatedScale);
      // Update the selected scale with new values
      setSelectedScale(updatedScale);
      return true;
    } catch (error) {
      console.error('Error saving scale:', error);
      throw error;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Scale Monitor Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedScales.map((scale) => (
          <ScaleCard
            key={scale.id}
            scale={scale}
            onCardClick={handleCardClick}
          />
        ))}
      </div>

      {selectedScale && (
        <ScaleDetail 
          scale={selectedScale} 
          onClose={() => setSelectedScale(null)}
          onSave={handleSaveScale}
          dateRange={dateRange}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
        />
      )}
    </div>
  );
};

export default Dashboard;