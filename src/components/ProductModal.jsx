import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { X, Loader2, AlertCircle, Plus } from 'lucide-react';
import apiService from '../services/api';
import CustomerModal from './CustomerModal';
import ScaleModal from './ScaleModal';

const ProductModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  customers, 
  initialData = null,
  onCustomerAdded 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    customer_id: '',
    customer_name: '',
    scale_id: '',
    thresholds: {
      upper: 40,
      lower: 8
    }
  });

  const [availableScales, setAvailableScales] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);

  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Fetch available scales when modal opens
  useEffect(() => {
    const fetchScales = async () => {
      try {
        const response = await apiService.getScales();
        setAvailableScales(response);
      } catch (error) {
        console.error('Error fetching scales:', error);
        setErrors(prev => ({ ...prev, scales: 'Error loading scales' }));
      }
    };

    if (isOpen) {
      fetchScales();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const customer = customers.find(c => c.customer_id === initialData.customer_id);
        setFormData({
          name: initialData.name || '',
          customer_id: initialData.customer_id || '',
          customer_name: customer?.name || '',
          scale_id: initialData.scale_id || '',
          thresholds: {
            upper: initialData.thresholds?.upper || 40,
            lower: initialData.thresholds?.lower || 8
          }
        });
      } else {
        setFormData({
          name: '',
          customer_id: '',
          customer_name: '',
          scale_id: '',
          thresholds: {
            upper: 40,
            lower: 8
          }
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData, customers]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (formData.thresholds.upper <= formData.thresholds.lower) {
      newErrors.thresholds = 'Upper threshold must be greater than lower threshold';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const productData = {
        name: formData.name.trim(),
        customer_id: formData.customer_id || null,
        customer_name: formData.customer_name,
        scale_id: formData.scale_id || null,
        thresholds: {
          upper: Number(formData.thresholds.upper),
          lower: Number(formData.thresholds.lower)
        },
        ...(initialData?.product_id && { product_id: initialData.product_id })
      };

      await onSubmit(productData);
      onClose();
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save product' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerModalSubmit = async (customerData) => {
    try {
      const newCustomer = await apiService.createCustomer({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address
      });

      const customer_id = newCustomer.customer_id || newCustomer.id;
      if (!customer_id) {
        throw new Error('Invalid customer ID from server response');
      }

      const formattedCustomer = {
        ...newCustomer,
        customer_id: customer_id,
        name: newCustomer.name
      };

      if (onCustomerAdded) {
        onCustomerAdded(formattedCustomer);
      }

      setFormData(prevData => ({
        ...prevData,
        customer_id: customer_id,
        customer_name: formattedCustomer.name
      }));

      setIsCustomerModalOpen(false);
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.customer_id;
        return newErrors;
      });
    } catch (err) {
      console.error('Error creating customer:', err);
      setErrors({ customer: err.message || 'Failed to create customer' });
    }
  };

  const handleScaleModalSubmit = async (scaleData) => {
    try {
      const newScale = await apiService.createScale(scaleData);
      
      // Add the new scale to available scales
      setAvailableScales(prev => [...prev, newScale]);
      
      // Select the new scale
      setFormData(prevData => ({
        ...prevData,
        scale_id: newScale.scale_id
      }));

      setIsScaleModalOpen(false);
    } catch (err) {
      console.error('Error creating scale:', err);
      setErrors({ scale: err.message || 'Failed to create scale' });
    }
  };

  const handleCustomerChange = (e) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === 'new') {
      setIsCustomerModalOpen(true);
      return;
    }

    const selectedCustomer = customers.find(c => 
      (c.customer_id || c.id).toString() === selectedValue
    );
    
    if (selectedCustomer) {
      setFormData(prevData => ({
        ...prevData,
        customer_id: selectedValue,
        customer_name: selectedCustomer.name
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        customer_id: '',
        customer_name: ''
      }));
    }
  };

  const handleScaleChange = (e) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === 'new') {
      setIsScaleModalOpen(true);
      return;
    }

    setFormData(prevData => ({
      ...prevData,
      scale_id: selectedValue
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {initialData ? t.updateProduct : t.addProduct}
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
              {t.productName}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.selectCustomer}
            </label>
            <select
              value={formData.customer_id ? formData.customer_id.toString() : ''}
              onChange={handleCustomerChange}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                ${errors.customer_id ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSubmitting}
            >
              <option value="">{t.selectCustomer}</option>
              {customers.map(customer => {
                const customerId = (customer.customer_id || customer.id).toString();
                return (
                  <option 
                    key={customerId}
                    value={customerId}
                  >
                    {customer.name}
                  </option>
                );
              })}
              <option value="" disabled className="border-t border-gray-200">
                ────────────────
              </option>
              <option value="new" className="text-blue-600 font-medium">
                + Create New Customer
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.linkedScales}
            </label>
            <select
              value={formData.scale_id || ''}
              onChange={handleScaleChange}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                ${errors.scale_id ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSubmitting}
            >
              <option value="">{t.unassigned}</option>
              {availableScales.map(scale => (
                <option 
                  key={scale.scale_id} 
                  value={scale.scale_id}
                >
                  {scale.name || `Scale ${scale.scale_id}`}
                </option>
              ))}
              <option value="" disabled className="border-t border-gray-200">
                ────────────────
              </option>
              <option value="new" className="text-blue-600 font-medium">
                + Add New Scale
              </option>
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t.thresholds}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.upperThresholdKg}
                </label>
                <input
                  type="number"
                  value={formData.thresholds.upper}
                  onChange={(e) => setFormData(prevData => ({
                    ...prevData,
                    thresholds: {
                      ...prevData.thresholds,
                      upper: Number(e.target.value)
                    }
                  }))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-300"
                  min="0"
                  step="1"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.lowerThresholdKg}
                </label>
                <input
                  type="number"
                  value={formData.thresholds.lower}
                  onChange={(e) => setFormData(prevData => ({
                    ...prevData,
                    thresholds: {
                      ...prevData.thresholds,
                      lower: Number(e.target.value)
                    }
                  }))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-300"
                  min="0"
                  max={formData.thresholds.upper - 1}
                  step="1"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            {errors.thresholds && (
              <p className="text-red-500 text-sm">{errors.thresholds}</p>
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
              className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                disabled:bg-blue-400 flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? t.saving : (initialData ? t.update : t.add)}
            </button>
          </div>
        </form>
      </div>

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={handleCustomerModalSubmit}
      />

      <ScaleModal
        isOpen={isScaleModalOpen}
        onClose={() => setIsScaleModalOpen(false)}
        onSubmit={handleScaleModalSubmit}
      />
    </div>
  );
};

export default ProductModal;