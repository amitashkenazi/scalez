import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange, isRTL }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const visiblePages = pages.filter(page => {
    if (totalPages <= 7) return true;
    if (page === 1 || page === totalPages) return true;
    if (Math.abs(page - currentPage) <= 1) return true;
    return false;
  });

  const renderPageButton = (page) => (
    <button
      key={page}
      onClick={() => onPageChange(page)}
      className={`px-3 py-1 rounded-md ${
        currentPage === page
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {page}
    </button>
  );

  return (
    <div className={`px-6 py-4 flex ${isRTL ? 'flex-row-reverse' : ''} items-center justify-between border-t border-gray-200`}>
      <div>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="mr-2 px-2 py-1 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        {visiblePages.map((page, index, array) => {
          if (index > 0 && array[index - 1] !== page - 1) {
            return (
              <React.Fragment key={page}>
                <span className="px-2">...</span>
                {renderPageButton(page)}
              </React.Fragment>
            );
          }
          return renderPageButton(page);
        })}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-2 px-2 py-1 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;