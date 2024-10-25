// src/components/ScaleCard.jsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ScaleModal from './ScaleModal';
import { getStatusColor } from '../utils/thresholdUtils';

const ScaleCard = ({ scale }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statusColor = getStatusColor(
    scale.currentWeight,
    scale.thresholds.upper,
    scale.thresholds.lower
  );

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setIsModalOpen(true)}
      >
        <CardHeader>
          <CardTitle>{scale.productName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${statusColor}`}>
            {scale.currentWeight} {scale.unit}
          </div>
          <div className="text-sm text-gray-500">
            Thresholds: {scale.thresholds.lower} - {scale.thresholds.upper} {scale.unit}
          </div>
        </CardContent>
      </Card>

      <ScaleModal 
        scale={scale} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default ScaleCard;
