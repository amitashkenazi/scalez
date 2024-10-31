import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { X, Loader2 } from 'lucide-react';

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

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      } else {
        // Reset form when opening for new customer
        setFormData({
          name_en: '',
          name_he: '',
          email: '',
          phone: '',
          address: ''
        });
      }
      setErrors({});
    }
  }, [initialData, isOpen]);

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
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{7,14}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Invalid phone number format';
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
        id: initialData?.id // Include ID if editing existing customer
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
        className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
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
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
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

          {errors.submit && (
            <div className="bg-red-50 border border-red-400 rounded-lg p-3">
              <p className="text-red-700">{errors.submit}</p>
            </div>
          )}

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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-blue-400"
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