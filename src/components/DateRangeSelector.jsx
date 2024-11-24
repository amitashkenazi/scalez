
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';


/**
 * DateRangeSelector component allows users to select a date range with start and end dates.
 */
const DateRangeSelector = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  return (
    <div 
      className={`flex gap-4 items-center mb-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div>
        <label className="block text-sm text-gray-500 mb-1">{t.from}</label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1">{t.to}</label>
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