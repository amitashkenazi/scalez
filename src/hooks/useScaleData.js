import { useState, useEffect } from 'react';
import apiService from '../services/api';

const useScaleData = (initialScaleId = null) => {
  const [scales, setScales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [latestMeasurement, setLatestMeasurement] = useState(null);

  const fetchScales = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);
      
      const response = await apiService.getScales();
      console.log('Scales:', response);
      
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
      
      // If we have an initial scale ID, fetch its latest measurement
      if (initialScaleId) {
        await fetchLatestMeasurement(initialScaleId);
      }
    } catch (err) {
      console.error('Error fetching scales:', err);
      setError(err.message || 'Failed to fetch scales data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLatestMeasurement = async (scaleId) => {
    if (!scaleId) {
      console.error('Scale ID is required to fetch latest measurement');
      return;
    }

    try {
      const measurement = await apiService.getLatestMeasurement(scaleId);
      setLatestMeasurement(measurement);
      return measurement;
    } catch (error) {
      console.error(`Error fetching latest measurement for scale ${scaleId}:`, error);
      setError(error.message);
      return null;
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

      // Fetch latest measurement after update
      if (updatedScale.id) {
        await fetchLatestMeasurement(updatedScale.id);
      }

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
    latestMeasurement,
    fetchLatestMeasurement
  };
};

export default useScaleData;