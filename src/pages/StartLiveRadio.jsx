import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Radio, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function StartLiveRadio() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stream_url: '',
    station_id: ''
  });

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

  const { data: stations = [] } = useQuery({
    queryKey: ['radio-stations'],
    queryFn: () => base44.entities.RadioStation.filter({ is_active: true })
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const liveRadio = await base44.entities.LiveRadio.create({
        ...formData,
        is_live: true,
        listeners_count: 0,
        started_at: new Date().toISOString()
      });

      // Notificar a usuarios con notificaciones activas
      const allPrefs = await base44.entities.NotificationPreference.filter({ live_streams: true });
      
      for (const pref of allPrefs) {
        await base44.entities.Notification.create({
          user_email: pref.user_email,
          type: 'live_radio',
          message: `📻 ¡${currentUser.full_name || currentUser.email.split('@')[0]} está transmitiendo radio en vivo! ${formData.title}`,
          related_id: liveRadio.id,
          from_user: currentUser.email,
          is_read: false
        });
      }

      navigate(createPageUrl(`LiveRadioPlayer?id=${liveRadio.id}`));
    } catch (error) {
      console.error('Error al iniciar transmisión:', error);
      alert('Error al iniciar la transmisión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800 rounded-3xl shadow-xl border border-yellow-600 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
              <Radio className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Transmitir Radio en Vivo</h1>
              <p className="text-gray-400">Inicia tu transmisión en tiempo real</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Título de la transmisión *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Alabanza matutina en vivo"
                required
                className="h-12 bg-gray-900 text-white border-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe tu transmisión..."
                rows={4}
                className="bg-gray-900 text-white border-gray-700"
              />
            </div>

            {stations.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estación (opcional)
                </label>
                <Select
                  value={formData.station_id}
                  onValueChange={(value) => setFormData({ ...formData, station_id: value })}
                >
                  <SelectTrigger className="h-12 bg-gray-900 text-white border-gray-700">
                    <SelectValue placeholder="Selecciona una estación" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL del Stream de Audio *
              </label>
              <Input
                value={formData.stream_url}
                onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                placeholder="https://stream.ejemplo.com/radio.mp3"
                required
                className="h-12 bg-gray-900 text-white border-gray-700"
              />
              <div className="mt-3 bg-gray-900/50 rounded-lg p-4 space-y-3">
                <p className="text-xs text-yellow-500 font-semibold">
                  ⚡ Ejemplos de URLs válidas:
                </p>
                <ul className="text-xs text-gray-400 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0">✓</span>
                    <span><strong>Icecast/Shoutcast:</strong> https://servidor.com/stream.mp3</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0">✓</span>
                    <span><strong>Mixlr:</strong> https://mixlr.com/users/tunombre</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0">✓</span>
                    <span><strong>YouTube Live:</strong> https://youtube.com/watch?v=ID</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0">✓</span>
                    <span><strong>Archivos directos:</strong> .mp3, .aac, .ogg, .m3u8</span>
                  </li>
                </ul>
                <div className="pt-2 border-t border-gray-700 space-y-2">
                  <p className="text-xs text-red-400 font-semibold">
                    ⚠️ NO soportado:
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>✗ TikTok Live (bloqueado por la plataforma)</li>
                    <li>✗ Instagram Live (bloqueado por la plataforma)</li>
                    <li>✗ Facebook Live (bloqueado por la plataforma)</li>
                  </ul>
                  <p className="text-xs text-gray-500 pt-2">
                    💡 <strong>Tip:</strong> Usa YouTube Live para transmisiones desde redes sociales.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Radio className="w-5 h-5 mr-2" />
                  Iniciar Transmisión en Vivo
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}