import { useState, useEffect } from 'react';
import apiService from '../services/api';

const useScaleMeasurement = (scaleId) => {
  const [measurement, setMeasurement] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMeasurement = async () => {
    if (!scaleId) {
      setError('Scale ID is required');
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiService.getLatestMeasurement(scaleId);
      setMeasurement(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching measurement:', err);
      setError(err.message);
      setMeasurement(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scaleId) {
      fetchMeasurement();
    }
  }, [scaleId]);

  return {
    measurement,
    isLoading,
    error,
    refreshMeasurement: fetchMeasurement
  };
};

export default useScaleMeasurement;