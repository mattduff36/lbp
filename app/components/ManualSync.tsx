'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Client {
  id: string;
  username: string;
  password: string;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SyncStatus {
  type: 'success' | 'error' | 'loading';
  message: string;
}

interface ManualSyncProps {
  onLogout: () => void;
}

export default function ManualSync({ onLogout }: ManualSyncProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [syncStatus, setSyncStatus] = useState<Record<string, SyncStatus>>({});
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoadingClients(true);
    try {
      const response = await fetch('/api/admin/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      } else {
        console.error('Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const handleSync = async (type: 'hero' | 'portfolio' | 'client', identifier?: string) => {
    const syncKey = identifier ? `${type}-${identifier}` : type;
    
    setSyncStatus(prev => ({
      ...prev,
      [syncKey]: { type: 'loading', message: 'Syncing...' }
    }));

    try {
      let url = '';
      let method = 'GET';
      
      switch (type) {
        case 'hero':
          url = '/api/hero-images?refresh=true';
          break;
        case 'portfolio':
          url = '/api/admin/sync';
          method = 'POST';
          break;
        case 'client':
          if (!identifier) throw new Error('Client identifier required');
          url = `/api/client-gallery?username=${identifier}&refresh=true`;
          break;
      }

      let response;
      if (method === 'POST' && type === 'portfolio') {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'portfolio' })
        });
      } else {
        response = await fetch(url, { method });
      }
      
      if (response.ok) {
        const data = await response.json();
        let message = '';
        
        switch (type) {
          case 'hero':
            message = `Hero images synced successfully (${data.images?.length || 0} images)`;
            break;
          case 'portfolio':
            message = data.message || 'Portfolio galleries cache cleared successfully';
            break;
          case 'client':
            message = `Client gallery synced (${data.images?.length || 0} images)`;
            break;
        }
        
        setSyncStatus(prev => ({
          ...prev,
          [syncKey]: { type: 'success', message }
        }));
      } else {
        throw new Error(`Sync failed with status ${response.status}`);
      }
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        [syncKey]: { 
          type: 'error', 
          message: error instanceof Error ? error.message : 'Sync failed' 
        }
      }));
    }

    // Clear status after 5 seconds
    setTimeout(() => {
      setSyncStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[syncKey];
        return newStatus;
      });
    }, 5000);
  };

  const getSyncButtonClass = (syncKey: string) => {
    const status = syncStatus[syncKey];
    const baseClass = "px-3 py-1 font-medium text-sm rounded-md shadow-lg border-2 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 disabled:opacity-50";
    
    if (status?.type === 'loading') {
      return `${baseClass} bg-yellow-600/20 text-yellow-400 border-yellow-600/70 cursor-not-allowed`;
    } else if (status?.type === 'success') {
      return `${baseClass} bg-green-600/20 text-green-400 border-green-600/70`;
    } else if (status?.type === 'error') {
      return `${baseClass} bg-red-600/20 text-red-400 border-red-600/70`;
    }
    
    return `${baseClass} bg-transparent text-white border-white/70 hover:bg-white/10 hover:border-white hover:shadow-xl focus:ring-white`;
  };

  const getSyncButtonText = (syncKey: string, defaultText: string) => {
    const status = syncStatus[syncKey];
    if (status?.type === 'loading') return 'Syncing...';
    if (status?.type === 'success') return 'Synced!';
    if (status?.type === 'error') return 'Failed';
    return defaultText;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium text-gray-300 tracking-wider uppercase font-montserrat">
          Manual Syncing
        </h1>
      </div>

      {/* Hero Images Section */}
      <h2 className="text-xl font-medium mb-6 text-gray-300 font-montserrat tracking-wider uppercase">Hero Images</h2>
      <div className="mb-12 bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">Force refresh hero images from Google Drive</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <button
              onClick={() => handleSync('hero')}
              disabled={syncStatus['hero']?.type === 'loading'}
              className={getSyncButtonClass('hero')}
            >
              {getSyncButtonText('hero', 'Sync Hero Images')}
            </button>
            {syncStatus['hero'] && (
              <p className={`text-xs ${
                syncStatus['hero'].type === 'success' ? 'text-green-400' : 
                syncStatus['hero'].type === 'error' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {syncStatus['hero'].message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio Galleries Section */}
      <h2 className="text-xl font-medium mb-6 text-gray-300 font-montserrat tracking-wider uppercase">Portfolio Galleries</h2>
      <div className="mb-12 bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">Clear cache for all portfolio categories</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <button
              onClick={() => handleSync('portfolio')}
              disabled={syncStatus['portfolio']?.type === 'loading'}
              className={getSyncButtonClass('portfolio')}
            >
              {getSyncButtonText('portfolio', 'Clear Portfolio Cache')}
            </button>
            {syncStatus['portfolio'] && (
              <p className={`text-xs ${
                syncStatus['portfolio'].type === 'success' ? 'text-green-400' : 
                syncStatus['portfolio'].type === 'error' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {syncStatus['portfolio'].message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Client Galleries Section */}
      <div className="overflow-x-auto">
        <h2 className="text-xl font-medium mb-6 text-gray-300 font-montserrat tracking-wider uppercase">Client Galleries</h2>
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-400 text-sm">Force refresh individual client galleries</p>
          </div>
          <button
            onClick={fetchClients}
            disabled={isLoadingClients}
            className="px-3 py-1 bg-transparent text-white border-2 border-white/70 font-medium text-sm rounded-md shadow-lg hover:bg-white/10 hover:border-white hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-700 transition-all duration-150 ease-in-out disabled:opacity-50"
          >
            {isLoadingClients ? 'Refreshing...' : 'Refresh List'}
          </button>
        </div>

        {isLoadingClients ? (
          <div className="flex justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-LBPBlue border-t-transparent rounded-full"
            />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No clients found. Add clients in the Client Management tab.
          </div>
        ) : (
          <table className="w-full text-left border-collapse bg-gray-800 rounded-lg shadow">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-3 px-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Username</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Folder Status</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-300 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const syncKey = `client-${client.username}`;
                return (
                  <tr key={client.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                    <td className="py-3 px-4 text-gray-300">{client.username}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        client.folderId 
                          ? 'bg-green-900/30 text-green-400 border border-green-700/50' 
                          : 'bg-red-900/30 text-red-400 border border-red-700/50'
                      }`}>
                        {client.folderId ? 'Configured' : 'No Folder'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleSync('client', client.username)}
                          disabled={!client.folderId || syncStatus[syncKey]?.type === 'loading'}
                          className={`${getSyncButtonClass(syncKey)} ${
                            !client.folderId ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title={!client.folderId ? 'Client needs folder configuration' : ''}
                        >
                          {getSyncButtonText(syncKey, 'Sync Gallery')}
                        </button>
                      </div>
                      {syncStatus[syncKey] && (
                        <p className={`text-xs mt-1 text-center ${
                          syncStatus[syncKey].type === 'success' ? 'text-green-400' : 
                          syncStatus[syncKey].type === 'error' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {syncStatus[syncKey].message}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}