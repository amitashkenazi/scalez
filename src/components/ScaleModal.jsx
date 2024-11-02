import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ScaleModal = ({ isOpen, onClose, onSubmit }) => {
  const { language } = useLanguage();
  const isRTL = language === 'he';

  const [scaleId, setScaleId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!scaleId.trim()) {
      setError('Scale ID is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(scaleId.trim());
      onClose();
    } catch (error) {
      setError(error.message);
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
          <h2 className="text-xl font-bold">Add New Scale</h2>
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
              Scale ID
            </label>
            <input
              type="text"
              value={scaleId}
              onChange={(e) => {
                setScaleId(e.target.value);
                setError('');
              }}
              placeholder="Enter scale ID"
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          <div className={`flex justify-end gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-blue-400"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Adding...' : 'Add Scale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScaleModal;