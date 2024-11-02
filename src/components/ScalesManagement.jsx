import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Trash2, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import apiService from '../services/api';
import ScaleModal from './ScaleModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

const ScalesManagement = () => {
  const [registeredScales, setRegisteredScales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedScale, setSelectedScale] = useState(null);

  const { language } = useLanguage();
  const isRTL = language === 'he';

  // Fetch initial data
  const fetchData = async () => {
    try {
      setError(null);
      
      // Get all scales
      const scalesResponse = await apiService.request('scales', { 
        method: 'GET' 
      });

      // Get latest measurements
      const measurementsResponse = await apiService.request('measurements', {
        method: 'GET'
      });

      // Map measurements to scales
      const scalesWithMeasurements = scalesResponse.map(scale => {
        const measurement = measurementsResponse.find(m => m.vendor_id === scale.id);
        return {
          ...scale,
          lastMeasurement: measurement?.timestamp,
          weight: measurement?.weight
        };
      });

      setRegisteredScales(scalesWithMeasurements);
    } catch (err) {
      console.error('Error fetching data:', err);
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

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddScale = async (scaleId) => {
    try {
      // The vendor ID will be extracted from the auth token on the server side
      await apiService.request('scales/register', {
        method: 'POST',
        body: JSON.stringify({ id: scaleId })
      });
      
      await fetchData();
      showSuccessMessage('Scale added successfully');
    } catch (err) {
      throw new Error(err.message || 'Failed to add scale');
    }
  };

  const handleDeleteScale = async () => {
    if (!selectedScale?.scale_id) return;

    try {
      await apiService.request(`scales/${selectedScale.scale_id}`, {
        method: 'DELETE'
      });
      
      setRegisteredScales(prev => prev.filter(s => s.scale_id !== selectedScale.scale_id));
      setIsDeleteModalOpen(false);
      setSelectedScale(null);
      showSuccessMessage('Scale deleted successfully');
    } catch (err) {
      setError(err.message || 'Failed to delete scale');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Scales Management</h2>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Add Scale
            </button>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-400 rounded-lg p-4">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Registered Scales Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Scale ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Last Update
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {registeredScales.map((scale) => (
              <tr key={scale.scale_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{scale.scale_id}</td>
                <td className="px-6 py-4 text-sm">{formatDate(scale.lastMeasurement)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
                    ${scale.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {scale.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => {
                      setSelectedScale(scale);
                      setIsDeleteModalOpen(true);
                    }}
                    className="text-red-600 hover:text-red-800"
                    title="Delete scale"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <ScaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddScale}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedScale(null);
        }}
        onConfirm={handleDeleteScale}
        title="Delete Scale"
        message={`Are you sure you want to delete scale "${selectedScale?.id}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default ScalesManagement;