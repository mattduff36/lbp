'use client';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium text-gray-300 tracking-wider uppercase font-montserrat">
          Admin Dashboard
        </h1>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        <p className="text-gray-300">All portfolio and hero images are now synced directly from Google Drive. Manual syncing is no longer required.</p>
      </div>
    </div>
  );
} 