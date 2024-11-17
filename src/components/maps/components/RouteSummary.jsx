import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { translations } from '../../../translations/translations';
import { Route, Navigation, Clock, Milestone, CalendarClock } from 'lucide-react';

const RouteSummaryCard = ({ icon: Icon, label, value, subValue }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="flex items-center gap-2 text-gray-600 mb-2">
      <Icon className="h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    {subValue && <div className="text-sm text-gray-500 mt-1">{subValue}</div>}
  </div>
);

const RouteSummary = ({ totalStats, selectedCustomers, startTime }) => {
  const { language } = useLanguage();
  const t = translations[language];

  const estimatedEndTime = new Date(startTime.getTime() + totalStats.duration * 1000);

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Route className="h-6 w-6 text-blue-600" />
        Route Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RouteSummaryCard
          icon={Navigation}
          label="Total Distance"
          value={`${(totalStats.distance / 1000).toFixed(1)} km`}
        />

        <RouteSummaryCard
          icon={Clock}
          label="Total Duration"
          value={`${Math.round(totalStats.duration / 60)} mins`}
        />

        <RouteSummaryCard
          icon={Milestone}
          label="Stops"
          value={selectedCustomers.length}
          subValue="customers"
        />

        <RouteSummaryCard
          icon={CalendarClock}
          label="Time Window"
          value={startTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}
          subValue={`Until ${estimatedEndTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}`}
        />
      </div>
    </div>
  );
};

export default RouteSummary;