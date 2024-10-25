import React from 'react';
import { getStatusColor, getThresholdStatus } from '../utils/thresholdUtils';
import customersData from '../data/customersData.json';

const NotificationsView = ({ scales }) => {
  // Helper function to find customer name by scale ID
  const findCustomerName = (scaleId) => {
    const customer = customersData.customers.find(customer => 
      customer.scaleIds.includes(scaleId)
    );
    return customer ? customer.name : 'Unknown Customer';
  };

  // Filter and sort scales by severity (red first, then orange)
  const filteredScales = scales
    .map(scale => {
      const sortedHistory = [...scale.history].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const currentWeight = sortedHistory[0]?.weight;
      const status = currentWeight ? getThresholdStatus(currentWeight, scale.thresholds) : null;
      const statusColor = currentWeight ? getStatusColor(currentWeight, scale.thresholds.upper, scale.thresholds.lower) : null;
      const customerName = findCustomerName(scale.id);
      
      return {
        ...scale,
        currentWeight,
        status,
        statusColor,
        customerName
      };
    })
    .filter(scale => scale.statusColor === 'text-red-600' || scale.statusColor === 'text-orange-500')
    .sort((a, b) => {
      if (a.statusColor === 'text-red-600' && b.statusColor !== 'text-red-600') return -1;
      if (a.statusColor !== 'text-red-600' && b.statusColor === 'text-red-600') return 1;
      return 0;
    });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Scale Alerts</h1>
      {filteredScales.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No alerts to display
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Product Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Current Weight</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Thresholds</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredScales.map(scale => {
                const [hebrewName, englishName] = scale.customerName.split(" - ");
                return (
                  <tr key={scale.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium">{englishName}</div>
                        <div className="text-gray-500">{hebrewName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{scale.productName}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={scale.statusColor}>
                        {scale.currentWeight} {scale.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>Upper: {scale.thresholds.upper} {scale.unit}</div>
                      <div>Lower: {scale.thresholds.lower} {scale.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        scale.statusColor === 'text-red-600' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {scale.status.message}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default NotificationsView;