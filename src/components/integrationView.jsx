import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { 
  Plug, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Key,
  Lock
} from 'lucide-react';
import apiService from '../services/api';

const defaultTranslations = {
  title: 'Integrations',
  description: 'Connect your external services and tools',
  refresh: 'Refresh',
  noIntegrations: 'No integrations available',
  checkBack: 'Check back later for available integrations.',
  connect: 'Connect',
  connecting: 'Connecting...',
  disconnect: 'Disconnect',
  connected: 'Connected',
  notConnected: 'Not Connected',
  username: 'Username',
  password: 'Password',
  addAnother: 'Add Another Connection',
  connectedInstance: 'Connected Instance'
};

const IntegrationCard = ({ integration, onConnect, onDisconnect, isLoading }) => {
    const [credentials, setCredentials] = useState({
      username: '',
      password: ''
    });
    const [error, setError] = useState(null);
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setError(null);
      
      try {
        await onConnect(integration.integration_id, credentials);
        setCredentials({ username: '', password: '' });
      } catch (err) {
        setError(err.message);
      }
    };
  
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plug className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{integration.name}</h3>
              <p className="text-sm text-gray-600">{integration.description}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${integration.instances?.length > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {integration.instances?.length > 0 ? 'Connected' : 'Not Connected'}
          </span>
        </div>
  
        {integration.instances?.length > 0 ? (
          <div className="mt-4">
            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <div className="flex flex-col">
                  <span className="font-medium">Connected Instance</span>
                  <span className="text-sm text-gray-500">ID: {integration.instances[0].id}</span>
                </div>
              </div>
              <button
                onClick={() => onDisconnect(integration.instances[0].id)}
                className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Disconnect'
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
  
            {error && (
              <div className="bg-red-50 border border-red-400 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}
  
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                disabled:bg-blue-400 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </button>
          </form>
        )}
      </div>
    );
  };

const IntegrationsView = () => {
  const [integrations, setIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(false);

  const { language } = useLanguage();
  const t = {
    integrations: translations?.[language]?.integrations || defaultTranslations
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
              {t('title')}
            </h2>
            <p className="text-gray-600 mt-1">{t('description')}</p>
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
          />
        ))}
      </div>

      {integrations.length === 0 && !error && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Plug className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t('noIntegrations')}</h3>
          <p className="mt-2 text-gray-500">{t('checkBack')}</p>
        </div>
      )}
    </div>
  );
};

export default IntegrationsView;