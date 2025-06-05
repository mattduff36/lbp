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
      const response = await fetch(`/api/admin/clientOps/${editingClient.id}`, {
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
      const response = await fetch(`/api/admin/clientOps/${clientId}`, {
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
            className="px-4 py-1.5 bg-red-600 text-white font-medium rounded-md shadow-lg border-2 border-red-600/70 hover:bg-red-700 hover:border-red-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-150 ease-in-out disabled:opacity-50"
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
              className="w-full md:w-auto px-6 py-2.5 bg-LBPBlue text-white font-medium rounded-md shadow-lg border-2 border-LBPBlue/70 hover:bg-LBPBlue/80 hover:border-LBPBlue hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-LBPBlue focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-150 ease-in-out disabled:opacity-50"
            >
              Add Client
            </button>
          </form>
        </div>

        {/* Clients List */}
        <div className="mt-8 overflow-x-auto">
          <h2 className="text-xl font-medium mb-6 text-gray-300">Existing Clients</h2>
          {clients.length > 0 ? (
            <table className="w-full text-left border-collapse bg-gray-800 rounded-lg shadow">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Username</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Password</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-300 uppercase tracking-wider text-right hidden md:table-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50 transition-colors duration-150">
                    {editingClient?.id === client.id ? (
                      <>
                        {/* Editing State */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editingClient.username}
                            onChange={(e) => setEditingClient({ ...editingClient, username: e.target.value })}
                            className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-LBPBlue"
                            required
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text" // Consider type="password" if you want to obscure it during edit, though it's already visible
                            value={editingClient.password}
                            onChange={(e) => setEditingClient({ ...editingClient, password: e.target.value })}
                            className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-LBPBlue"
                            required
                          />
                        </td>
                        <td className="py-3 px-4 text-right hidden md:table-cell">
                          <form onSubmit={handleUpdateClient} className="inline-flex gap-2">
                            <button
                              type="submit"
                              className="px-3 py-1 bg-LBPBlue text-white font-medium text-sm rounded-md shadow-lg border-2 border-LBPBlue/70 hover:bg-LBPBlue/80 hover:border-LBPBlue hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-LBPBlue focus:ring-offset-2 focus:ring-offset-gray-700 transition-all duration-150 ease-in-out disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingClient(null)}
                              className="px-3 py-1 bg-gray-500 text-white font-medium text-sm rounded-md shadow-lg border-2 border-gray-500/70 hover:bg-gray-600 hover:border-gray-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-700 transition-all duration-150 ease-in-out disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </form>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Display State */}
                        <td className="py-3 px-4 text-gray-300">{client.username}</td>
                        <td className="py-3 px-4 text-gray-400">{client.password}</td>
                        <td className="py-3 px-4 text-right hidden md:table-cell">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => setEditingClient(client)}
                              className="px-3 py-1 bg-LBPBlue text-white font-medium text-sm rounded-md shadow-lg border-2 border-LBPBlue/70 hover:bg-LBPBlue/80 hover:border-LBPBlue hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-LBPBlue focus:ring-offset-2 focus:ring-offset-gray-700 transition-all duration-150 ease-in-out disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              className="px-3 py-1 bg-red-600 text-white font-medium text-sm rounded-md shadow-lg border-2 border-red-600/70 hover:bg-red-700 hover:border-red-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-700 transition-all duration-150 ease-in-out disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400 text-center py-4">No clients found.</p>
          )}
        </div>
      </div>
    </div>
  );
} 