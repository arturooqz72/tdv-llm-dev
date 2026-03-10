import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import NotificationCenterComponent from '@/components/notifications/NotificationCenter.jsx';
import PermissionGuard from '@/components/PermissionGuard';
import { Loader2 } from 'lucide-react';

export default function NotificationCenterPage() {
  const { user: currentUser, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <NotificationCenterComponent currentUser={currentUser} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
