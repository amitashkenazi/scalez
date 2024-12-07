import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle, Loader2, AlertCircle, Check } from 'lucide-react';
import apiService from '../services/api';

const MyAccountView = () => {
  const { user, refreshUser } = useAuth();
  const { language } = useLanguage();
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';

  const [formData, setFormData] = useState({
    company_name: '',
    personal_name: '',
    phone: '',
    address: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.request(`vendors/me`, {
          method: 'GET'
        });
        console.log('response:', response);

        setFormData({
          company_name: response.name || '',
          personal_name: response.contact_person || '',
          phone: response.phone || '',
          address: response.address || ''
        });
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const updatedDetails = await apiService.request('vendors/me', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      // Update the local user data
      const updatedUserData = {
        ...user,
        ...updatedDetails
      };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));

      // Refresh the global auth context
      await refreshUser();

      setSuccessMessage('Account details updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating account:', err);
      setError(err.message || 'Failed to update account details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      company_name: user?.company_name || '',
      personal_name: user?.personal_name || '',
      phone: user?.phone || '',
      address: user?.address || ''
    });
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <UserCircle className="h-8 w-8 text-gray-600" />
          <h2 className="text-2xl font-bold">My Account</h2>
        </div>
        <p className="text-gray-600 mt-1">Manage your account details</p>
      </div>

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-400 rounded-lg p-4 flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-lg p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name
          </label>
          <input
            type="text"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Personal Name
          </label>
          <input
            type="text"
            value={formData.personal_name}
            onChange={(e) => setFormData({ ...formData, personal_name: e.target.value })}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>

        <div className={`flex justify-end gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
              disabled:bg-blue-400 flex items-center gap-2"
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MyAccountView;