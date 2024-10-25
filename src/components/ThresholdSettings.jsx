import React from 'react';

const ThresholdSettings = ({ 
  thresholds, 
  onThresholdsChange, 
  notifications,
  onNotificationsChange 
}) => {
  const handleThresholdChange = (type, value) => {
    const newValue = Number(value);
    
    // Validate that upper threshold is always higher than lower
    if (type === 'upper' && newValue <= thresholds.lower) return;
    if (type === 'lower' && newValue >= thresholds.upper) return;

    onThresholdsChange({
      ...thresholds,
      [type]: newValue
    });
  };

  const handleNotificationChange = (threshold, field, value) => {
    onNotificationsChange({
      ...notifications,
      [threshold]: {
        ...notifications[threshold],
        [field]: value
      }
    });
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow mt-6">
      <h3 className="text-xl font-bold mb-4">Threshold Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upper Threshold Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upper Threshold (kg)
            </label>
            <input
              type="number"
              value={thresholds.upper}
              onChange={(e) => handleThresholdChange('upper', e.target.value)}
              min={thresholds.lower + 1}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Upper Threshold Notification
            </label>
            <input
              type="text"
              placeholder="WhatsApp Number"
              value={notifications.upper.phoneNumber}
              onChange={(e) => handleNotificationChange('upper', 'phoneNumber', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <textarea
              placeholder="Message when weight exceeds upper threshold"
              value={notifications.upper.message}
              onChange={(e) => handleNotificationChange('upper', 'message', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
        </div>

        {/* Lower Threshold Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lower Threshold (kg)
            </label>
            <input
              type="number"
              value={thresholds.lower}
              onChange={(e) => handleThresholdChange('lower', e.target.value)}
              max={thresholds.upper - 1}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Lower Threshold Notification
            </label>
            <input
              type="text"
              placeholder="WhatsApp Number"
              value={notifications.lower.phoneNumber}
              onChange={(e) => handleNotificationChange('lower', 'phoneNumber', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <textarea
              placeholder="Message when weight falls below lower threshold"
              value={notifications.lower.message}
              onChange={(e) => handleNotificationChange('lower', 'message', e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThresholdSettings;