import React from 'react';

const ThresholdSettings = ({ thresholds, action, onThresholdsChange, onActionChange }) => {
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

  const handleActionChange = (field, value) => {
    onActionChange({
      ...action,
      type: 'whatsapp',
      [field]: value
    });
  };

  const isValid = thresholds.upper > thresholds.lower;

  return (
    <div className="bg-white rounded-lg p-6 shadow mt-4">
      <h2 className="text-xl font-bold mb-4">Threshold Settings</h2>
      <div className="space-y-4">
        {!isValid && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Upper threshold must be higher than lower threshold
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Upper Threshold (kg)
          </label>
          <input
            type="number"
            value={thresholds.upper}
            onChange={(e) => handleThresholdChange('upper', e.target.value)}
            className="w-full p-2 border rounded"
            min={thresholds.lower + 1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Lower Threshold (kg)
          </label>
          <input
            type="number"
            value={thresholds.lower}
            onChange={(e) => handleThresholdChange('lower', e.target.value)}
            className="w-full p-2 border rounded"
            max={thresholds.upper - 1}
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-2">WhatsApp Notification Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Alert Message
              </label>
              <textarea
                value={action.message}
                onChange={(e) => handleActionChange('message', e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Enter the message to be sent when threshold is breached"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={action.recipient}
                onChange={(e) => handleActionChange('recipient', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="+1234567890"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThresholdSettings;