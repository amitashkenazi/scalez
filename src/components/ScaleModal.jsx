// ScaleModal.jsx - Updated with proper imports and formatDate function
import React, { useState } from 'react';
import { X, Loader2, Trash2, Scale } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

// Utility function to format date
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleString();
};

const ScaleModal = ({ isOpen, onClose, onSubmit }) => {
  const { language } = useLanguage();
  const isRTL = language === 'he';

  const [formData, setFormData] = useState({
    scaleId: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.scaleId.trim() || !formData.name.trim()) {
      setError('Both Scale ID and Name are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: formData.scaleId.trim(),
        name: formData.name.trim()
      });
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
              value={formData.scaleId}
              onChange={(e) => {
                setFormData({ ...formData, scaleId: e.target.value });
                setError('');
              }}
              placeholder="Enter scale ID"
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scale Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setError('');
              }}
              placeholder="Enter scale name"
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500
                ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}

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

// Scales Table Component
const ScalesTable = ({ scales, onDelete }) => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Scale ID
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Name
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
        {scales.map((scale) => (
          <tr key={scale.scale_id} className="hover:bg-gray-50">
            <td className="px-6 py-4 text-sm">{scale.scale_id}</td>
            <td className="px-6 py-4 text-sm">{scale.name || 'Unnamed Scale'}</td>
            <td className="px-6 py-4 text-sm">{formatDate(scale.lastMeasurement)}</td>
            <td className="px-6 py-4">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
                ${scale.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {scale.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-6 py-4">
              <button
                onClick={() => onDelete(scale)}
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
  );
};

// Scale Info Component
const ScaleInfo = ({ scale }) => {
  return (
    <div className="flex items-center gap-1 text-gray-400">
      <Scale size={14} />
      <span className="text-gray-500">
        {scale?.name || `Scale ${scale?.scale_id}` || 'Unknown Scale'}
      </span>
    </div>
  );
};

export { ScaleModal as default, ScalesTable, ScaleInfo };