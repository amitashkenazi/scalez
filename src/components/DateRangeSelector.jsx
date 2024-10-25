// components/DateRangeSelector.jsx
import React from 'react';

const DateRangeSelector = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  return (
    <div className="flex gap-4 items-center mb-4">
      <div>
        <label className="block text-sm text-gray-500 mb-1">From</label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1">To</label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="border rounded p-2"
        />
      </div>
    </div>
  );
};

export default DateRangeSelector;