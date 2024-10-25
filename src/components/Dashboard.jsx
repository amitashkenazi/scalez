// src/components/Dashboard.jsx
import React from 'react';
import { Card } from '@/components/ui/card';
import ScaleCard from './ScaleCard';
import useScaleData from '../hooks/useScaleData';

const Dashboard = () => {
  const { scales } = useScaleData();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">IoT Scales Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scales.map((scale) => (
          <ScaleCard key={scale.id} scale={scale} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
