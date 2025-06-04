'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Client {
  id: string;
  username: string;
  password: string;
}

interface ClientManagementProps {
  onLogout: () => void;
}

export default function ClientManagement({ onLogout }: ClientManagementProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({ username: '', password: '' });
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      const data = await response.json();
      setClients(data.clients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });
      if (!response.ok) throw new Error('Failed to add client');
      await fetchClients();
      setNewClient({ username: '', password: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add client');
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      const response = await fetch(`/api/admin/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClient),
      });
      if (!response.ok) throw new Error('Failed to update client');
      await fetchClients();
      setEditingClient(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update client');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete client');
      await fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="text-white">Loading...</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-medium text-gray-300 tracking-wider uppercase font-montserrat">
            Client Management
          </h1>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-md text-red-200">
            {error}
          </div>
        )}

        {/* Add New Client Form */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-medium mb-4 text-gray-300">Add New Client</h2>
          <form onSubmit={handleAddClient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={newClient.username}
                  onChange={(e) => setNewClient({ ...newClient, username: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-LBPBlue"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="text"
                  id="password"
                  value={newClient.password}
                  onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-LBPBlue"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2 bg-LBPBlue hover:bg-LBPBlue/90 text-white rounded-md transition-colors"
            >
              Add Client
            </button>
          </form>
        </div>

        {/* Clients List */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium mb-4 text-gray-300">Existing Clients</h2>
          {clients.map((client) => (
            <div
              key={client.id}
              className="p-4 bg-gray-800 rounded-lg flex items-center justify-between"
            >
              {editingClient?.id === client.id ? (
                <form onSubmit={handleUpdateClient} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={editingClient.username}
                    onChange={(e) => setEditingClient({ ...editingClient, username: e.target.value })}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-LBPBlue"
                    required
                  />
                  <input
                    type="text"
                    value={editingClient.password}
                    onChange={(e) => setEditingClient({ ...editingClient, password: e.target.value })}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-LBPBlue"
                    required
                  />
                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-LBPBlue hover:bg-LBPBlue/90 text-white rounded-md transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingClient(null)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="text-gray-300">
                      <span className="font-medium">Username:</span> {client.username}
                    </div>
                    <div className="text-gray-400">
                      <span className="font-medium">Password:</span> {client.password}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingClient(client)}
                      className="px-4 py-2 bg-LBPBlue hover:bg-LBPBlue/90 text-white rounded-md transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 