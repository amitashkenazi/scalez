import React from 'react';
import { Scale } from 'lucide-react';

const ScaleBuyButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 
        text-white rounded-full hover:from-blue-600 hover:to-purple-600 
        transition-all transform hover:scale-105 duration-200 font-medium 
        shadow-lg flex items-center gap-2"
    >
      <Scale className="w-5 h-5 transform group-hover:rotate-12 transition-transform" />
      Buy Scale 🎯
    </button>
  );
};

export default ScaleBuyButton;