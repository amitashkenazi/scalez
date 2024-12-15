// src/components/integrations/IntegrationsView.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import IntegrationCard from './IntegrationCard';
import { 
  Plug, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
} from 'lucide-react';
import apiService from '../../services/api';

const IntegrationsView = () => {
  const [integrations, setIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(false);

  const { language } = useLanguage();
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';

  const fetchIntegrations = async () => {
    try {
      setError(null);
      const response = await apiService.request('integrations', {
        method: 'GET'
      });
      
      const processedIntegrations = response.integrationTypes.map(integrationType => ({
        ...integrationType,
        instances: response.instances.filter(
          instance => instance.integration_id === integrationType.integration_id
        )
      }));
      
      setIntegrations(processedIntegrations);
    } catch (err) {
      console.error('Error fetching integrations:', err);
      setError(err.message || 'Failed to fetch integrations');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchIntegrations();
  };

  const handleConnect = async (integrationId, credentials) => {
    setOperationInProgress(true);
    try {
      await apiService.request(`integrations/${integrationId}/connect`, {
        method: 'POST',
        body: JSON.stringify({ credentials })
      });
      
      await fetchIntegrations();
    } catch (error) {
      throw error;
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleDisconnect = async (instanceId) => {
    setOperationInProgress(true);
    try {
      await apiService.request(`integrations/instance/${instanceId}/disconnect`, {
        method: 'POST'
      });
      
      await fetchIntegrations();
    } finally {
      setOperationInProgress(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Plug className="h-6 w-6" />
              {t('integrationstitle')}
            </h2>
            <p className="text-gray-600 mt-1">{t('integrationsDescription')}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map(integration => (
          <IntegrationCard
            key={integration.integration_id}
            integration={integration}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            isLoading={operationInProgress}
            t={t}
          />
        ))}
      </div>

      {integrations.length === 0 && !error && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Plug className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t('integrations.noIntegrations')}</h3>
          <p className="mt-2 text-gray-500">{t('integrations.checkBack')}</p>
        </div>
      )}
    </div>
  );
};

export default IntegrationsView;
