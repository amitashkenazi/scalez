import React, { useState } from 'react';
import ScaleGraph from './ScaleGraph';
import ThresholdSettings from './ThresholdSettings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ScaleModal = ({ scale, isOpen, onClose, onSave }) => {
  const [thresholds, setThresholds] = useState(scale.thresholds);
  const [action, setAction] = useState(scale.action);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Create updated scale data
      const updatedScale = {
        ...scale,
        thresholds,
        action
      };

      // Call save handler
      await onSave(updatedScale);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isValid = thresholds.upper > thresholds.lower;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <Card className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{scale.productName}</h2>
          <Button 
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>

        <ScaleGraph 
          data={scale.history}
          thresholds={thresholds}
        />

        <ThresholdSettings
          thresholds={thresholds}
          action={action}
          onThresholdsChange={setThresholds}
          onActionChange={setAction}
        />

        <div className="flex justify-end mt-4">
          <Button
            onClick={handleSave}
            disabled={!isValid || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ScaleModal;