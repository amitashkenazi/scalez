import React from 'react';
import { useWorkspace } from './contexts/workspaceContext.jsx';
import { ChevronDown, Loader2, Building2 } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';

const WorkspaceSelector = () => {
  const { workspaces, currentWorkspace, switchWorkspace, isLoading } = useWorkspace();
  const { language } = useLanguage();
  const isRTL = language === 'he';

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading workspaces...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={currentWorkspace?.vendor_id || ''}
        onChange={(e) => {
          const workspace = workspaces.find(w => w.vendor_id === e.target.value);
          if (workspace) {
            switchWorkspace(workspace);
          }
        }}
        className={`w-full appearance-none px-4 py-2 bg-gray-800 text-white rounded-lg 
          cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10
          ${isRTL ? 'text-right' : 'text-left'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {workspaces.map((workspace) => (
          <option key={workspace.vendor_id} value={workspace.vendor_id}>
            {workspace.name}
          </option>
        ))}
      </select>
      <div className="absolute top-1/2 transform -translate-y-1/2 right-3 pointer-events-none text-gray-400">
        <ChevronDown size={16} />
      </div>
    </div>
  );
};

export default WorkspaceSelector;