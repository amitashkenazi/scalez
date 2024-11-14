import React from 'react';
import { Scale, Package } from 'lucide-react';

const FunOutOfStockMessage = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-bounce-in">
        {/* Fun Icon */}
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 bg-blue-100 rounded-full flex items-center justify-center">
            <Scale className="w-10 h-10 text-blue-500" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-100 rounded-full 
            flex items-center justify-center animate-bounce">
            <span className="text-xl">🏃‍♂️</span>
          </div>
        </div>
        
        {/* Simple Message */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2">
            Our Scales Took a Break! 🌴
          </h3>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg 
            text-blue-700 font-medium">
            Be back in stock soon! 
          </div>
        </div>
        
        {/* Fun Animation */}
        <div className="flex justify-center gap-2 text-2xl mb-6 animate-pulse">
          🔍 📦 🎯
        </div>
        
        {/* Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 
            text-white rounded-full hover:from-blue-600 hover:to-purple-600 
            transition-all transform hover:scale-105 duration-200 font-medium 
            shadow-lg flex items-center justify-center gap-2"
        >
          Got it! 👋
        </button>
      </div>
    </div>
  );
};

export default FunOutOfStockMessage;