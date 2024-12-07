import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { AlertTriangle } from 'lucide-react';

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  message,
  selectedCount = 0,
  productNames = []
}) => {
  const { language } = useLanguage();
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">
            {title || t('deleteConfirmation')}
          </h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            {message || t('deleteConfirmationDesc')}
          </p>
          
          {selectedCount > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                {t('selectedForDeletion')}: {selectedCount} {t('products')}
              </p>
              {productNames.length > 0 && (
                <ul className="list-disc list-inside text-sm text-gray-700 max-h-32 overflow-y-auto">
                  {productNames.map((name, index) => (
                    <li key={index} className="truncate">{name}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        
        <div className={`flex justify-end gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;