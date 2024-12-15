import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWorkspaces = async () => {
    try {
      setError(null);
      const response = await apiService.request('vendors/workspaces', {
        method: 'GET'
      });
      setWorkspaces(response);
      
      // Set first workspace as default if none is selected
      if (!currentWorkspace && response.length > 0) {
        setCurrentWorkspace(response[0]);
        localStorage.setItem('lastWorkspace', JSON.stringify(response[0]));
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load last selected workspace from localStorage
  useEffect(() => {
    const lastWorkspace = localStorage.getItem('lastWorkspace');
    if (lastWorkspace) {
      setCurrentWorkspace(JSON.parse(lastWorkspace));
    }
    fetchWorkspaces();
  }, []);

  const switchWorkspace = async (workspace) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem('lastWorkspace', JSON.stringify(workspace));
  };

  const value = {
    workspaces,
    currentWorkspace,
    switchWorkspace,
    isLoading,
    error,
    refreshWorkspaces: fetchWorkspaces
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}