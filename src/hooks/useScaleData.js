// src/hooks/useScaleData.js
import { useState, useEffect } from 'react';
import scalesData from '../data/scalesData.json';

const useScaleData = () => {
  const [scales, setScales] = useState([]);

  useEffect(() => {
    // Simulate API call
    setScales(scalesData.scales);
  }, []);

  return { scales, setScales };
};

export default useScaleData;