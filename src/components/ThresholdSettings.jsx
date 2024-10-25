// src/components/ThresholdSettings.jsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const ThresholdSettings = ({ 
  thresholds, 
  action, 
  onThresholdsChange, 
  onActionChange 
}) => {
  const handleThresholdChange = (type, value) => {
    onThresholdsChange({
      ...thresholds,
      [type]: Number(value)
    });
  };

  const handleActionChange = (field, value) => {
    onActionChange({
      ...action,
      [field]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Threshold Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Upper Threshold (kg)
            </label>
            <input
              type="number"
              value={thresholds.upper}
              onChange={(e) => handleThresholdChange('upper', e.target.value)}
              className="w-full p-2 border rounded"
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              WhatsApp Message
            </label>
            <textarea
              value={action.message}
              onChange={(e) => handleActionChange('message', e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              WhatsApp Recipient
            </label>
            <input
              type="text"
              value={action.recipient}
              onChange={(e) => handleActionChange('recipient', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThresholdSettings;
