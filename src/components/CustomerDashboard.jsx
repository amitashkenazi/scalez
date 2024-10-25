import React from 'react';
import { getStatusColor } from '../utils/thresholdUtils';
import useScaleData from '../hooks/useScaleData';
import customersData from '../data/customersData.json';

const ScaleCircle = ({ scale }) => {
  const sortedHistory = [...scale.history].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const latestMeasurement = sortedHistory[0];
  const currentWeight = latestMeasurement ? latestMeasurement.weight : null;
  const statusColor = currentWeight !== null 
    ? getStatusColor(currentWeight, scale.thresholds.upper, scale.thresholds.lower)
    : 'text-gray-400';

  const bgColorMap = {
    'text-green-600': 'bg-green-100',
    'text-orange-500': 'bg-orange-100',
    'text-red-600': 'bg-red-100',
    'text-gray-400': 'bg-gray-100'
  };

  return (
    <div className="text-center">
      <div 
        className={`w-16 h-16 rounded-full flex items-center justify-center ${bgColorMap[statusColor]} ${statusColor} mx-auto`}
      >
        {currentWeight !== null ? (
          <span className="font-bold">{Math.round(currentWeight)}</span>
        ) : (
          <span className="text-sm">No data</span>
        )}
      </div>
      <span className="text-sm text-gray-500 mt-2 block">{scale.productName}</span>
    </div>
  );
};

const CustomerCard = ({ customer, scales, onSelect }) => {
  const customerScales = scales.filter(scale => customer.scaleIds.includes(scale.id));
  const [hebrewName, englishName] = customer.name.split(" - ");
  
  return (
    <div 
      className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onSelect(customer.scaleIds)}
    >
      <div className="flex justify-between items-center mb-6">
        <span className="text-xl">{englishName}</span>
        <span className="text-xl font-bold">{hebrewName}</span>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {customerScales.map(scale => (
          <ScaleCircle key={scale.id} scale={scale} />
        ))}
      </div>
    </div>
  );
};

const CustomerDashboard = ({ onCustomerSelect }) => {
  const { scales } = useScaleData();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Customer Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {customersData.customers.map(customer => (
          <CustomerCard 
            key={customer.id}
            customer={customer}
            scales={scales}
            onSelect={onCustomerSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default CustomerDashboard;