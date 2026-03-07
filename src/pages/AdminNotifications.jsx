import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Send, Users, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        if (user.role !== 'admin') {
          navigate(createPageUrl('Home'));
          return;
        }
        setCurrentUser(user);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, [navigate]);

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser
  });

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Por favor escribe un mensaje');
      return;
    }

    setSending(true);
    try {
      let recipients = users;

      // Filtrar por audiencia
      if (targetAudience === 'admins') {
        recipients = users.filter(u => u.role === 'admin');
      } else if (targetAudience === 'users') {
        recipients = users.filter(u => u.role !== 'admin');
      }

      // Crear notificación para cada usuario
      for (const user of recipients) {
        await base44.entities.Notification.create({
          user_email: user.email,
          type: 'admin_message',
          message: `📢 Administración: ${message.trim()}`,
          from_user: currentUser.email,
          is_read: false
        });
      }

      alert(`✓ Notificación enviada a ${recipients.length} usuarios`);
      setMessage('');
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      alert('Error al enviar la notificación. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
            <Bell className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Notificaciones de Administración
          </h1>
          <p className="text-gray-400 text-lg">
            Envía mensajes importantes a los usuarios de la plataforma
          </p>
        </div>

        <Card className="bg-gray-800 border-yellow-600">
          <CardHeader>
            <CardTitle className="text-white">Enviar Notificación Push</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendNotification} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Audiencia
                </label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger className="h-12 bg-gray-900 text-white border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Todos los usuarios ({users.length})
                      </div>
                    </SelectItem>
                    <SelectItem value="users">
                      Usuarios regulares ({users.filter(u => u.role !== 'admin').length})
                    </SelectItem>
                    <SelectItem value="admins">
                      Administradores ({users.filter(u => u.role === 'admin').length})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mensaje *
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu mensaje importante..."
                  rows={6}
                  required
                  className="bg-gray-900 text-white border-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este mensaje aparecerá en el campanario de notificaciones de cada usuario
                </p>
              </div>

              <Button
                type="submit"
                disabled={sending || !message.trim()}
                className="w-full h-14 text-lg bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Enviar Notificación
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Estadísticas de Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total de Usuarios</p>
                <p className="text-3xl font-bold text-white mt-1">{users.length}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Administradores</p>
                <p className="text-3xl font-bold text-yellow-500 mt-1">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Usuarios Regulares</p>
                <p className="text-3xl font-bold text-blue-500 mt-1">
                  {users.filter(u => u.role !== 'admin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}