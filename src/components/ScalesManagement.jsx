import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { AlertCircle, Plus, Trash2, Loader2, RefreshCw } from 'lucide-react';
import apiService from '../services/api';

const ScalesManagement = () => {
  const [dbScales, setDbScales] = useState([]);
  const [measurementScales, setMeasurementScales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mock data for testing - replace with actual API calls
      const mockDbScales = [
        { id: 'scale-001', last_update: '2024-10-30T10:00:00', is_active: true },
        { id: 'scale-002', last_update: '2024-10-30T09:30:00', is_active: false }
      ];

      const mockMeasurements = [
        { 
          latest_measurement: {
            vendor_id: 'scale-003',
            timestamp: '2024-10-30T10:15:00',
            weight: 42.5
          }
        }
      ];

      // Replace these with actual API calls
      // const scalesResponse = await apiService.request('scales', { method: 'GET' });
      // const measurementsResponse = await apiService.request('scales/measurements', { method: 'GET' });
      
      setDbScales(mockDbScales);
      
      const transformedMeasurements = mockMeasurements.map(scale => ({
        id: scale.latest_measurement?.vendor_id || 'unknown',
        lastMeasurement: scale.latest_measurement?.timestamp || null,
        weight: scale.latest_measurement?.weight || 0
      }));
      
      setMeasurementScales(transformedMeasurements);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch scales data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleAddScale = async (scaleId) => {
    try {
      await apiService.request('scales', {
        method: 'POST',
        body: JSON.stringify({ scale_id: scaleId })
      });
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to add scale');
    }
  };

  const handleDeleteScale = async (scaleId) => {
    try {
      await apiService.request(`scales/${scaleId}`, {
        method: 'DELETE'
      });
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete scale');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  // Find scales that are in measurements but not in database
  const unregisteredScales = measurementScales.filter(
    mScale => !dbScales.find(dbScale => dbScale.id === mScale.id)
  );

  if (isLoading && !isRefreshing) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Scales Management</h2>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t.refresh}
          </button>
        </div>
        <p className="text-gray-600 mt-1">Manage and monitor all scales in the system</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Registered Scales Section */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Registered Scales</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Scale ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Last Update</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dbScales.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No registered scales found
                  </td>
                </tr>
              ) : (
                dbScales.map((scale) => (
                  <tr key={scale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{scale.id}</td>
                    <td className="px-6 py-4">{formatDate(scale.last_update)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
                        ${scale.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {scale.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteScale(scale.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unregistered Scales Section */}
      <div>
        <h3 className="text-xl font-bold mb-4">Unregistered Scales</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Scale ID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Last Measurement</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {unregisteredScales.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No unregistered scales found
                  </td>
                </tr>
              ) : (
                unregisteredScales.map((scale) => (
                  <tr key={scale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{scale.id}</td>
                    <td className="px-6 py-4">{formatDate(scale.lastMeasurement)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleAddScale(scale.id)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="h-5 w-5" />
                        <span>Add to System</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScalesManagement;