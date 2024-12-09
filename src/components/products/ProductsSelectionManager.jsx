import React from 'react';
import { Trash2, X } from 'lucide-react';

const ProductsSelectionManager = ({ 
  selectedProducts, 
  onSelect, 
  onSelectAll, 
  onClearSelection, 
  onDelete, 
  totalProducts,
  isRTL,
  isDeleting
}) => {
  const selectionCount = selectedProducts.length;
  const allSelected = selectionCount === totalProducts && totalProducts > 0;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg 
      transform transition-transform duration-200 ${selectionCount > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectionCount} items selected
              </span>
            </div>
            <button
              onClick={onClearSelection}
              className="text-gray-500 hover:text-gray-700"
              disabled={isDeleting}
            >
              <X size={20} />
            </button>
          </div>
          
          <button
            onClick={onDelete}
            className={`flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg 
              hover:bg-red-700 transition-colors ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isDeleting}
          >
            <Trash2 size={20} />
            <span>Delete Selected</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductsSelectionManager;