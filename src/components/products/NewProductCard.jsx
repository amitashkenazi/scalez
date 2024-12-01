import React from 'react';
import { Plus } from 'lucide-react';

const NewProductCard = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 
        cursor-pointer group border-2 border-dashed border-gray-300 hover:border-blue-500
        min-h-[280px] flex flex-col items-center justify-center text-gray-400 hover:text-blue-500"
    >
      <div className="transform transition-transform group-hover:scale-110">
        <Plus size={48} strokeWidth={1.5} />
      </div>
      <span className="mt-4 font-medium text-lg">Add New Product</span>
      <p className="text-sm mt-2 text-center max-w-[200px]">
        Click here to add a new product to your inventory
      </p>
    </button>
  );
};

export default NewProductCard;