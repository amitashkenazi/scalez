// src/hooks/useScaleData.js

import { useState, useEffect } from 'react';
import apiService from '../services/api';

const useScaleData = () => {
  const [scales, setScales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchScales = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);
      
      const response = await apiService.getScales();
      console.log('response:', response);
      
      // Transform the data to match the expected format
      const transformedScales = response.map(scale => ({
        ...scale,
        notifications: scale.notifications || {
          upper: { phoneNumber: '', message: '' },
          lower: { phoneNumber: '', message: '' }
        },
        // Ensure history is sorted by timestamp
        history: (scale.history || []).sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      }));

      setScales(transformedScales);
    } catch (err) {
      console.error('Error fetching scales:', err);
      setError(err.message || 'Failed to fetch scales data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScales();
  }, []);

  const updateScale = async (updatedScale) => {
    try {
      setIsRefreshing(true);
      
      // Make the API call to update the scale
      await apiService.updateScale(updatedScale.id, updatedScale);

      // Update local state
      setScales(currentScales =>
        currentScales.map(scale =>
          scale.id === updatedScale.id ? updatedScale : scale
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating scale:', error);
      throw new Error('Failed to update scale. Please try again later.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshScales = async () => {
    setIsRefreshing(true);
    await fetchScales(true);
    setIsRefreshing(false);
  };

  return {
    scales,
    isLoading,
    isRefreshing,
    error,
    updateScale,
    refreshScales,
    setScales,
  };
};

export default useScaleData;