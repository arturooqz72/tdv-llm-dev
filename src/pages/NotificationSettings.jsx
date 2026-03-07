import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Video, Radio, MessageCircle, Cake, Sparkles, CheckCircle2, Users, Hash } from 'lucide-react';
import PushNotificationManager from '@/components/notifications/PushNotificationManager';

export default function NotificationSettings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      const prefs = await base44.entities.NotificationPreference.filter({
        user_email: currentUser.email
      });
      return prefs[0] || {
        new_videos: true,
        new_comments: true,
        upcoming_birthdays: true,
        new_messages: true,
        live_streams: true
      };
    },
    enabled: !!currentUser
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPrefs) => {
      const existing = await base44.entities.NotificationPreference.filter({
        user_email: currentUser.email
      });

      if (existing.length > 0) {
        return await base44.entities.NotificationPreference.update(existing[0].id, newPrefs);
      } else {
        return await base44.entities.NotificationPreference.create({
          user_email: currentUser.email,
          ...newPrefs
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  });

  const handleToggle = (key, value) => {
    const updated = { ...preferences, [key]: value };
    updatePreferencesMutation.mutate(updated);
  };

  if (!currentUser || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  const notificationOptions = [
    {
      key: 'new_videos',
      icon: Video,
      title: 'Nuevos Videos',
      description: 'Recibe notificaciones cuando los creadores que sigues suban nuevos videos',
      color: 'text-purple-500'
    },
    {
      key: 'live_streams',
      icon: Radio,
      title: 'Transmisiones en Vivo',
      description: 'Alerta cuando inicie una transmisión en vivo',
      color: 'text-red-500'
    },
    {
      key: 'new_comments',
      icon: MessageCircle,
      title: 'Nuevos Comentarios',
      description: 'Notifica cuando alguien comente en tus videos',
      color: 'text-blue-500'
    },
    {
      key: 'new_messages',
      icon: MessageCircle,
      title: 'Mensajes Directos',
      description: 'Recibe alertas de nuevos mensajes en el chat',
      color: 'text-green-500'
    },
    {
      key: 'upcoming_birthdays',
      icon: Cake,
      title: 'Cumpleaños',
      description: 'Recordatorios de cumpleaños de miembros de la comunidad',
      color: 'text-yellow-500'
    },
    {
      key: 'new_chat_rooms',
      icon: Hash,
      title: 'Nuevas Salas de Chat',
      description: 'Recibe notificaciones cuando se cree una nueva sala de chat',
      color: 'text-cyan-500'
    },
    ...(currentUser?.role === 'admin' ? [{
      key: 'new_users',
      icon: Users,
      title: 'Nuevos Usuarios (Admin)',
      description: 'Alerta cuando un nuevo usuario se registre en la app',
      color: 'text-orange-500'
    }] : [])
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center">
            <Bell className="w-7 h-7 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Preferencias de Notificaciones</h1>
            <p className="text-gray-400">Personaliza cómo y cuándo recibir notificaciones</p>
          </div>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-xl flex items-center gap-3 text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <span>Preferencias guardadas correctamente</span>
          </div>
        )}

        {/* Notification Options */}
        <div className="space-y-4">
          {notificationOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card key={option.key} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center ${option.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {option.title}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences?.[option.key] !== false}
                      onCheckedChange={(checked) => handleToggle(option.key, checked)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Push Notifications */}
        <div className="mt-8">
          <PushNotificationManager currentUser={currentUser} />
        </div>

        {/* Info Card */}
        <Card className="mt-8 bg-gradient-to-r from-cyan-500/10 to-cyan-400/10 border-cyan-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">Notificaciones en Tiempo Real</h4>
                <p className="text-sm text-gray-400">
                  Las notificaciones se actualizan automáticamente sin necesidad de recargar la página. 
                  Recibirás alertas instantáneas en la campana de notificaciones y notificaciones push del navegador.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}