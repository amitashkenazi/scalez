// src/components/vendors/VendorsView.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import apiService from '../../services/api';
import { Plus, Pencil, Trash2, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import VendorModal from './VendorModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';

const VendorsView = () => {
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const { language } = useLanguage();
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';

  const fetchVendors = async () => {
    try {
      const response = await apiService.getVendors();
      setVendors(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to fetch vendors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchVendors();
    setIsRefreshing(false);
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddVendor = async (vendorData) => {
    try {
      const newVendor = await apiService.createVendor(vendorData);
      setVendors(prev => [...prev, newVendor]);
      setIsModalOpen(false);
      showSuccessMessage('Vendor added successfully');
    } catch (err) {
      setError('Failed to add vendor');
      console.error('Error adding vendor:', err);
    }
  };

  const handleEditVendor = async (vendorData) => {
    try {
      const updatedVendor = await apiService.updateVendor(selectedVendor.vendor_id, vendorData);
      setVendors(prev => prev.map(v => v.vendor_id === updatedVendor.vendor_id ? updatedVendor : v));
      setIsModalOpen(false);
      setSelectedVendor(null);
      showSuccessMessage('Vendor updated successfully');
    } catch (err) {
      setError('Failed to update vendor');
      console.error('Error updating vendor:', err);
    }
  };

  const handleDeleteVendor = async () => {
    try {
      await apiService.deleteVendor(selectedVendor.vendor_id);
      setVendors(prev => prev.filter(v => v.vendor_id !== selectedVendor.vendor_id));
      setIsDeleteModalOpen(false);
      setSelectedVendor(null);
      showSuccessMessage('Vendor deleted successfully');
    } catch (err) {
      setError('Failed to delete vendor');
      console.error('Error deleting vendor:', err);
    }
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
          <h2 className="text-2xl font-bold">Vendor Management</h2>
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
              onClick={() => {
                setSelectedVendor(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Add Vendor
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

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map(vendor => (
          <div
            key={vendor.vendor_id}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-2">{vendor.name}</h3>
                <div className="text-gray-600">
                  <p>{vendor.contact_person}</p>
                  <p>{vendor.email}</p>
                  <p>{vendor.phone}</p>
                  <p className="mt-2">{vendor.address}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setIsModalOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Pencil size={20} />
                </button>
                <button
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setIsDeleteModalOpen(true);
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <VendorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVendor(null);
        }}
        onSubmit={selectedVendor ? handleEditVendor : handleAddVendor}
        initialData={selectedVendor}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedVendor(null);
        }}
        onConfirm={handleDeleteVendor}
        title="Delete Vendor"
        message={`Are you sure you want to delete "${selectedVendor?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default VendorsView;

