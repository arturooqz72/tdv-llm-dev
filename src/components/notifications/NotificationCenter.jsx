import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Check, Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const notificationTypeColors = {
  new_message: 'bg-blue-100 text-blue-800',
  new_video: 'bg-purple-100 text-purple-800',
  new_comment: 'bg-pink-100 text-pink-800',
  new_follow: 'bg-green-100 text-green-800',
  video_approved: 'bg-emerald-100 text-emerald-800',
  video_rejected: 'bg-red-100 text-red-800',
  new_live_stream: 'bg-orange-100 text-orange-800',
  live_stream_started: 'bg-red-100 text-red-800',
  mention: 'bg-yellow-100 text-yellow-800'
};

export default function NotificationCenter({ currentUser }) {
  const [filter, setFilter] = useState('unread');
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const allNotifications = await base44.entities.Notification.filter(
        { user_email: currentUser.email },
        '-created_date',
        100
      );
      return allNotifications;
    },
    enabled: !!currentUser?.email
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.delete(notificationId),
    onSuccess: () => refetch()
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => refetch()
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(
        unread.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
      );
    },
    onSuccess: () => refetch()
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(notifications.map(n => base44.entities.Notification.delete(n.id)));
    },
    onSuccess: () => refetch()
  });

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getTypeLabel = (type) => {
    const labels = {
      new_message: 'Nuevo Mensaje',
      new_video: 'Nuevo Video',
      new_comment: 'Nuevo Comentario',
      new_follow: 'Nuevo Seguidor',
      video_approved: 'Video Aprobado',
      video_rejected: 'Video Rechazado',
      new_live_stream: 'En Vivo Nuevo',
      live_stream_started: 'En Vivo Iniciado',
      mention: 'Mencionado'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Centro de Notificaciones</h2>
            <p className="text-sm text-gray-600">
              {unreadCount > 0 ? `${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer` : 'Sin notificaciones nuevas'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            className="gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todo como leído
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unread" className="gap-2">
            <Bell className="w-4 h-4" />
            Sin leer ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todas ({notifications.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando notificaciones...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">
            {filter === 'unread' ? 'Sin notificaciones nuevas' : 'Sin notificaciones'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition-all ${
                notification.is_read
                  ? 'bg-white border-gray-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={notificationTypeColors[notification.type]}>
                      {getTypeLabel(notification.type)}
                    </Badge>
                    {!notification.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="text-gray-900 font-medium">{notification.message}</p>
                  {notification.from_user_name && (
                    <p className="text-sm text-gray-600 mt-1">
                      De: <span className="font-semibold">{notification.from_user_name}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notification.created_date).toLocaleString('es-ES')}
                  </p>
                </div>

                <div className="flex gap-2">
                  {!notification.is_read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                      className="gap-1"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteNotificationMutation.mutate(notification.id)}
                    className="gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clear All Button */}
      {notifications.length > 0 && (
        <Button
          variant="outline"
          onClick={() => {
            if (confirm('¿Eliminar todas las notificaciones?')) {
              deleteAllMutation.mutate();
            }
          }}
          className="w-full text-red-600 hover:text-red-700"
        >
          Eliminar todas
        </Button>
      )}
    </div>
  );
}