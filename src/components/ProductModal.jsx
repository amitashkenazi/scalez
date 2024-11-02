import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { X, Loader2, AlertCircle } from 'lucide-react';
import useScaleData from '../hooks/useScaleData';

const ProductModal = ({ isOpen, onClose, onSubmit, customers, initialData = null }) => {
  const { scales, isLoading: isLoadingScales, error: scalesError } = useScaleData();
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

  const { language } = useLanguage();
  const t = translations[language];
  // const isRTL = language === 'he';

  useEffect(() => {
    if (!isLoadingScales && scales) {
      try {
        // Map all scales, including assigned ones
        console.log('scales:', scales);
        const mappedScales = scales.map(scale => {
          let status = '';
          if (scale.productName && initialData?.scale_id !== scale.id) {
            status = ` (Currently assigned to: ${scale.productName})`;
          }
          return {
            id: scale.scale_id,
            displayName: `Scale ${scale.scale_id}${status}`
          };
        });

        console.log('Processed scales:', mappedScales);
        setAvailableScales(mappedScales);
      } catch (error) {
        console.error('Error processing scales:', error);
        setErrors(prev => ({ ...prev, scales: 'Error processing scales data' }));
      }
    }
  }, [scales, isLoadingScales, initialData]);

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
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer selection is required';
    }
    if (!formData.scale_id) {
      newErrors.scale_id = 'Scale selection is required';
    }
    if (formData.thresholds.upper <= formData.thresholds.lower) {
      newErrors.thresholds = 'Upper threshold must be greater than lower threshold';
    }
    if (formData.thresholds.upper <= 0 || formData.thresholds.lower < 0) {
      newErrors.thresholds = 'Thresholds must be positive numbers';
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
        customer_id: formData.customer_id,
        customer_name: formData.customer_name,
        scale_id: formData.scale_id,
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

  const handleCustomerChange = (e) => {
    const selectedCustomerId = e.target.value;
    const selectedCustomer = customers.find(c => c.customer_id === selectedCustomerId);
    
    if (selectedCustomer) {
      setFormData({
        ...formData,
        customer_id: selectedCustomer.customer_id,
        customer_name: selectedCustomer.name,
        scale_id: '' // Reset scale selection when customer changes
      });
    } else {
      setFormData({
        ...formData,
        customer_id: '',
        customer_name: '',
        scale_id: ''
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {initialData ? t.updateProduct : t.addProduct}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
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
              value={formData.customer_id}
              onChange={handleCustomerChange}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                ${errors.customer_id ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSubmitting}
            >
              <option value="">{t.selectCustomer}</option>
              {customers.map(customer => (
                <option key={customer.customer_id} value={customer.customer_id}>
                  {customer.name}
                </option>
              ))}
            </select>
            {errors.customer_id && (
              <p className="text-red-500 text-sm mt-1">{errors.customer_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.linkedScales}
            </label>
            <select
              value={formData.scale_id}
              onChange={(e) => setFormData({ ...formData, scale_id: e.target.value })}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                ${errors.scale_id ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSubmitting || isLoadingScales}
            >
              <option value="">
                {isLoadingScales ? 'Loading scales...' : 
                 scalesError ? 'Error loading scales' : 
                 'Select a scale'}
              </option>
              {!isLoadingScales && !scalesError && availableScales.map(scale => (
                <option 
                  key={scale.id} 
                  value={scale.id}
                  className={scale.displayName.includes('Currently assigned') ? 'text-orange-600' : ''}
                >
                  {scale.displayName}
                </option>
              ))}
            </select>
            {errors.scale_id && (
              <p className="text-red-500 text-sm mt-1">{errors.scale_id}</p>
            )}
            {scalesError && (
              <p className="text-red-500 text-sm mt-1">
                <AlertCircle className="inline-block w-4 h-4 mr-1" />
                {scalesError}
              </p>
            )}
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
                  onChange={(e) => setFormData({
                    ...formData,
                    thresholds: {
                      ...formData.thresholds,
                      upper: Number(e.target.value)
                    }
                  })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-300"
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.lowerThresholdKg}
                </label>
                <input
                  type="number"
                  value={formData.thresholds.lower}
                  onChange={(e) => setFormData({
                    ...formData,
                    thresholds: {
                      ...formData.thresholds,
                      lower: Number(e.target.value)
                    }
                  })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-300"
                  min="0"
                  max={formData.thresholds.upper - 1}
                  step="1"
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

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
            disabled={isSubmitting || isLoadingScales}
          >
            {(isSubmitting || isLoadingScales) && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? t.saving : (initialData ? t.update : t.add)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;