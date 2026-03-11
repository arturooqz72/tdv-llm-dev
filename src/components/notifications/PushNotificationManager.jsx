import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export default function PushNotificationManager({ currentUser }) {

  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch (error) {
      console.error('Error solicitando permiso de notificaciones:', error);
    }
  };

  return (
    <Card className="bg-gray-800 border-yellow-600">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notificaciones del Navegador
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        {permission === 'default' && (
          <div className="p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
            <p className="text-white mb-3">
              Activa las notificaciones para recibir alertas de la aplicación.
            </p>

            <Button
              onClick={requestPermission}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"
            >
              <Bell className="w-4 h-4 mr-2" />
              Activar Notificaciones
            </Button>
          </div>
        )}

        {permission === 'granted' && (
          <div className="p-4 bg-green-900/30 border border-green-600 rounded-lg">
            <p className="text-white">
              Notificaciones activadas ✅
            </p>

            <p className="text-gray-400 text-sm mt-1">
              Recibirás alertas del sistema cuando la aplicación envíe notificaciones.
            </p>
          </div>
        )}

        {permission === 'denied' && (
          <div className="p-4 bg-red-900/30 border border-red-600 rounded-lg">
            <p className="text-red-400 font-medium">
              Notificaciones bloqueadas
            </p>

            <p className="text-gray-400 text-sm mt-1">
              Debes habilitar las notificaciones en la configuración del navegador.
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
