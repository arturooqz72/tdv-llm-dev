import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, UserPlus, X, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import PermissionGuard from '@/components/PermissionGuard';

const religionOptions = [
  { value: 'lldm', label: 'LLDM' },
  { value: 'cristianismo', label: 'Cristianismo' },
  { value: 'otros', label: 'Otros' }
];

export default function GoLive() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    religion: 'lldm',
    stream_url: '',
    scheduled_start: '',
    is_scheduled: false,
    is_collaborative: false
  });
  const [guests, setGuests] = useState([]);
  const [guestEmail, setGuestEmail] = useState('');
  const [coHosts, setCoHosts] = useState([]);
  const [coHostEmail, setCoHostEmail] = useState('');
  const [loading, setLoading] = useState(false);

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

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-invite'],
    queryFn: () => base44.entities.User.list()
  });

  const addGuest = () => {
    if (!guestEmail) return;
    const user = users.find(u => u.email === guestEmail);
    if (user && !guests.find(g => g.email === guestEmail)) {
      setGuests([...guests, { email: user.email, name: user.full_name || user.email.split('@')[0] }]);
      setGuestEmail('');
    }
  };

  const removeGuest = (email) => {
    setGuests(guests.filter(g => g.email !== email));
  };

  const addCoHost = () => {
    if (!coHostEmail) return;
    const user = users.find(u => u.email === coHostEmail);
    if (user && !coHosts.find(h => h.email === coHostEmail)) {
      setCoHosts([...coHosts, { email: user.email, name: user.full_name || user.email.split('@')[0] }]);
      setCoHostEmail('');
    }
  };

  const removeCoHost = (email) => {
    setCoHosts(coHosts.filter(h => h.email !== email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const stream = await base44.entities.LiveStream.create({
        ...formData,
        is_live: !formData.is_scheduled,
        is_scheduled: formData.is_scheduled,
        is_collaborative: formData.is_collaborative,
        co_hosts: coHosts.map(h => h.email),
        viewers_count: 0,
        started_at: formData.is_scheduled ? null : new Date().toISOString()
      });

      // Add guests
      for (const guest of guests) {
        await base44.entities.LiveStreamGuest.create({
          stream_id: stream.id,
          guest_email: guest.email,
          guest_name: guest.name,
          status: 'pending'
        });
      }

      // Notificar según el tipo de transmisión
      if (!formData.is_scheduled) {
        const allPrefs = await base44.entities.NotificationPreference.filter({ live_streams: true });
        
        for (const pref of allPrefs) {
          await base44.entities.Notification.create({
            user_email: pref.user_email,
            type: 'new_stream',
            message: `🔴 ¡${currentUser.full_name || currentUser.email.split('@')[0]} está transmitiendo en vivo! ${formData.title}`,
            related_id: stream.id,
            from_user: currentUser.email,
            is_read: false
          });
        }
      }
      navigate(createPageUrl('Home'));
    } catch (error) {
      console.error('Error creating stream:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PermissionGuard permission="can_create_live_streams">
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center">
              <Video className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transmitir en Vivo</h1>
              <p className="text-gray-600">Comparte tu mensaje con la comunidad</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título de la transmisión *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Reflexión matutina, Diálogo interreligioso..."
                required
                className="h-12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe de qué tratará tu transmisión..."
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <Select
                value={formData.religion}
                onValueChange={(value) => setFormData({ ...formData, religion: value })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {religionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del Stream *
              </label>
              <Input
                value={formData.stream_url}
                onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=... o https://twitch.tv/..."
                required
                className="h-12"
              />
              <p className="text-xs text-gray-500 mt-1">
                Puedes usar YouTube Live, Twitch, o cualquier plataforma de streaming
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="is_scheduled"
                  checked={formData.is_scheduled}
                  onChange={(e) => setFormData({ ...formData, is_scheduled: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <label htmlFor="is_scheduled" className="text-sm font-medium text-gray-700">
                  Programar transmisión para más tarde
                </label>
              </div>

              {formData.is_scheduled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha y hora de inicio *
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_start}
                    onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                    required={formData.is_scheduled}
                    className="h-12"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invitar Participantes
              </label>
              <div className="flex gap-2 mb-3">
                <Select value={guestEmail} onValueChange={setGuestEmail}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(u => u.email !== currentUser?.email)
                      .map((user) => (
                        <SelectItem key={user.id} value={user.email}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={addGuest}
                  variant="outline"
                  className="h-12 px-6"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>

              {guests.length > 0 && (
                <div className="space-y-2">
                  {guests.map((guest) => (
                    <div
                      key={guest.email}
                      className="flex items-center justify-between p-3 bg-purple-50 rounded-xl"
                    >
                      <span className="text-sm font-medium text-gray-900">{guest.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGuest(guest.email)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="is_collaborative"
                  checked={formData.is_collaborative}
                  onChange={(e) => setFormData({ ...formData, is_collaborative: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_collaborative" className="text-sm font-medium text-gray-700">
                  Transmisión Colaborativa (Múltiples Co-Anfitriones)
                </label>
              </div>

              {formData.is_collaborative && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agregar Co-Anfitriones
                  </label>
                  <div className="flex gap-2 mb-3">
                    <Select value={coHostEmail} onValueChange={setCoHostEmail}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecciona un co-anfitrión" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter(u => u.email !== currentUser?.email)
                          .map((user) => (
                            <SelectItem key={user.id} value={user.email}>
                              {user.full_name || user.email}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={addCoHost}
                      variant="outline"
                      className="h-12 px-6"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>

                  {coHosts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Co-Anfitriones confirmados:</p>
                      {coHosts.map((host) => (
                        <div
                          key={host.email}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded-xl"
                        >
                          <span className="text-sm font-medium text-gray-900">{host.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCoHost(host.email)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : formData.is_scheduled ? (
                <>
                  <Video className="w-5 h-5 mr-2" />
                  Programar Transmisión
                </>
              ) : (
                <>
                  <Video className="w-5 h-5 mr-2" />
                  Iniciar Transmisión Ahora
                </>
              )}
            </Button>
          </form>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
