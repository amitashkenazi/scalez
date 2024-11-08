import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { 
  X, 
  Loader2, 
  UserPlus, 
  User, 
  Trash2, 
  AlertCircle 
} from 'lucide-react';
import apiService from '../services/api';

const CustomerModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  const [formData, setFormData] = useState({
    name_en: '',
    name_he: '',
    email: '',
    phone: '',
    address: ''
  });

  const [users, setUsers] = useState([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userError, setUserError] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const [hebrewName, englishName] = initialData.name?.split(' - ') || ['', ''];
        setFormData({
          name_en: englishName || '',
          name_he: hebrewName || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          address: initialData.address || ''
        });
        if (initialData.customer_id) {
          fetchCustomerUsers(initialData.customer_id);
        }
      } else {
        setFormData({
          name_en: '',
          name_he: '',
          email: '',
          phone: '',
          address: ''
        });
        setUsers([]);
      }
      setErrors({});
    }
  }, [initialData, isOpen]);

  const fetchCustomerUsers = async (customerId) => {
    try {
      setIsLoadingUsers(true);
      setUserError('');
      
      const response = await apiService.request(`customers/${customerId}/users`, {
        method: 'GET'
      });
      console.log('Users:', response);
      
      if (Array.isArray(response)) {
        setUsers(response);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUserError('Failed to load users. Please try again.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      setUserError('Email is required');
      return;
    }

    try {
      setIsAddingUser(true);
      setUserError('');

      const response = await apiService.request('customers/user', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: initialData?.customer_id,
          user_email: newUserEmail.trim()
        })
      });

      // Update users array with complete user object
      setUsers(prev => [...prev, {
        user_email: newUserEmail.trim(), // Add email explicitly
        ...response // Include any additional fields from response
      }]);
      
      setNewUserEmail('');
    } catch (error) {
      setUserError(error.message || 'Failed to add user');
    } finally {
      setIsAddingUser(false);
    }
};

  const handleRemoveUser = async (user_email) => {
    try {
      await apiService.request(`customers/${initialData?.customer_id}/users/email/${user_email}`, {
        method: 'DELETE'
      });

      setUsers(prev => prev.filter(user => user.user_email !== user_email));
    } catch (error) {
      setUserError('Failed to remove user');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name_en.trim()) {
      newErrors.name_en = 'English name is required';
    }
    
    if (!formData.name_he.trim()) {
      newErrors.name_he = 'Hebrew name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const formattedData = {
        name: `${formData.name_he} - ${formData.name_en}`,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        id: initialData?.id
      };

      await onSubmit(formattedData);
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? t.editCustomer : t.addCustomer}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.customerNameHe}
            </label>
            <input
              type="text"
              value={formData.name_he}
              onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                ${errors.name_he ? 'border-red-500' : 'border-gray-300'}`}
              dir="rtl"
            />
            {errors.name_he && (
              <p className="text-red-500 text-sm mt-1">{errors.name_he}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.customerNameEn}
            </label>
            <input
              type="text"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                ${errors.name_en ? 'border-red-500' : 'border-gray-300'}`}
              dir="ltr"
            />
            {errors.name_en && (
              <p className="text-red-500 text-sm mt-1">{errors.name_en}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.email}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              dir="ltr"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.phone}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.address}
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
              rows={3}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          {/* Users Section */}
          {initialData && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Users</h3>
              
              {/* Add User Form */}
              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Enter user email"
                  className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddUser}
                  disabled={isAddingUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                    disabled:bg-blue-400 flex items-center gap-2"
                >
                  {isAddingUser ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus size={20} />
                  )}
                  Add
                </button>
              </div>

              {/* Error Message */}
              {userError && (
                <div className="bg-red-50 border border-red-400 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-red-700 text-sm">{userError}</p>
                  </div>
                </div>
              )}

              {/* Users List with Loading State */}
              {isLoadingUsers ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map(user => (
                    <div 
                      key={user.user_email} 
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <User size={20} className="text-gray-500" />
                        <span className="text-sm font-medium">{user.user_email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(user.user_email)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {users.length === 0 && !userError && (
                    <div className="text-center py-4 text-gray-500">
                      No users found. Add users using the form above.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {errors.submit && (
            <div className="bg-red-50 border border-red-400 rounded-lg p-3">
              <p className="text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className={`flex justify-end gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                transition-colors flex items-center gap-2 disabled:bg-blue-400"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? t.saving : (initialData ? t.update : t.add)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;