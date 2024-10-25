import React from 'react';
import { getStatusColor, getThresholdStatus } from '../utils/thresholdUtils';
import customersData from '../data/customersData.json';
import { MessageSquare } from 'lucide-react';

const NotificationsView = ({ scales }) => {
  const findCustomerName = (scaleId) => {
    const customer = customersData.customers.find(customer => 
      customer.scaleIds.includes(scaleId)
    );
    return customer ? customer.name : 'Unknown Customer';
  };

  const getWhatsAppLink = (scale, status) => {
    const message = encodeURIComponent(
      `I am running out of ${scale.productName}: ${status.message}. \nCurrent weight: ${scale.currentWeight}${scale.unit}\nPlease send me coffee! ☕️`
    );
    const number = scale.notifications?.lower?.phoneNumber || '+972545868545'; // Fallback number if not set
    return `https://wa.me/${number.replace('+', '')}?text=${message}`;
  };

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

  // Desktop Table View
  const TableView = () => (
    <div className="hidden md:block overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg shadow">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Product Name</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Current Weight</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Action</th>
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
                <td className="px-6 py-4 text-sm font-medium">{scale.productName}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={scale.statusColor}>
                    {scale.currentWeight} {scale.unit}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    scale.statusColor === 'text-red-600' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {scale.status.message}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <a
                    href={getWhatsAppLink(scale, scale.status)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                  >
                    <MessageSquare size={20} />
                    <span>WhatsApp</span>
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Mobile Card View
  const CardView = () => (
    <div className="md:hidden space-y-4">
      {filteredScales.map(scale => {
        const [hebrewName, englishName] = scale.customerName.split(" - ");
        return (
          <div 
            key={scale.id} 
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="flex flex-col space-y-2">
              <div className="text-sm">
                <div className="font-bold">{englishName}</div>
                <div className="text-gray-600">{hebrewName}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{scale.productName}</div>
                  <div className={`${scale.statusColor} font-bold`}>
                    {scale.currentWeight} {scale.unit}
                  </div>
                </div>

                <a
                  href={getWhatsAppLink(scale, scale.status)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-12 h-12 bg-green-500 text-white rounded-full hover:bg-green-600"
                >
                  <MessageSquare size={24} />
                </a>
              </div>

              <div>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                  scale.statusColor === 'text-red-600' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {scale.status.message}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Scale Alerts</h1>
      {filteredScales.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No alerts to display
        </div>
      ) : (
        <>
          <TableView />
          <CardView />
        </>
      )}
    </div>
  );
};

export default NotificationsView;