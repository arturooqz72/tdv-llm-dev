import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function AdminChatRooms() {
  const { user: currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-white">Cargando...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
        <p className="text-red-400 text-lg font-semibold">
          Debes iniciar sesión para acceder.
        </p>
      </div>
    );
  }

  if (currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
        <p className="text-red-400 text-lg font-semibold">
          Solo administradores pueden acceder.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Moderación de Salas de Chat
          </h1>
          <p className="text-gray-400">
            Esta sección quedó temporalmente fuera mientras reconectamos el sistema nuevo sin Base44.
          </p>
        </div>

        <Card className="bg-gray-800 border-red-500/30">
          <CardContent className="py-10 text-center">
            <p className="text-white text-lg font-semibold mb-2">
              Panel temporalmente en migración
            </p>
            <p className="text-gray-400">
              La autenticación ya usa <span className="text-cyan-400">useAuth()</span>, pero la administración completa de salas se está reconstruyendo sin dependencias antiguas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
