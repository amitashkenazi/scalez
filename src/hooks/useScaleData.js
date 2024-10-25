import { useState, useEffect } from 'react';
import scalesData from '../data/scalesData.json';

const useScaleData = () => {
  const [scales, setScales] = useState([]);

  useEffect(() => {
    // Load initial data
    const loadedScales = scalesData.scales.map(scale => ({
      ...scale,
      notifications: scale.notifications || {
        upper: { phoneNumber: '', message: '' },
        lower: { phoneNumber: '', message: '' }
      }
    }));
    setScales(loadedScales);
  }, []);

  const updateScale = async (updatedScale) => {
    try {
      // In a real application, you would make an API call here
      // For now, we'll just update the local state
      setScales(currentScales => 
        currentScales.map(scale => 
          scale.id === updatedScale.id ? updatedScale : scale
        )
      );

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // You could save to localStorage here if needed
      // localStorage.setItem('scalesData', JSON.stringify({ scales }));
      
      return true;
    } catch (error) {
      console.error('Error updating scale:', error);
      throw error;
    }
  };

  return {
    scales,
    updateScale,
    setScales,
  };
};

export default useScaleData;