// src/components/ScaleModal.jsx
import React, { useState } from 'react';
import ScaleGraph from './ScaleGraph';
import ThresholdSettings from './ThresholdSettings';
import { Button } from '@/components/ui/button';

const ScaleModal = ({ scale, isOpen, onClose }) => {
  const [thresholds, setThresholds] = useState(scale.thresholds);
  const [action, setAction] = useState(scale.action);

  const handleSaveSettings = () => {
    // TODO: Implement API call to save settings
    console.log('Saving settings:', { thresholds, action });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{scale.productName}</h2>
          <Button onClick={onClose}>Close</Button>
        </div>

        <div className="mb-6">
          <ScaleGraph 
            history={scale.history} 
            thresholds={thresholds}
          />
        </div>

        <ThresholdSettings
          thresholds={thresholds}
          action={action}
          onThresholdsChange={setThresholds}
          onActionChange={setAction}
        />

        <div className="flex justify-end mt-4">
          <Button onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScaleModal;
