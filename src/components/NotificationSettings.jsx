import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Save, Loader2 } from 'lucide-react';

export default function NotificationSettings({ currentUser }) {
  const [preferences, setPreferences] = useState({
    new_videos: true,
    new_comments: true,
    upcoming_birthdays: true,
    new_messages: true,
    live_streams: true
  });
  const [saving, setSaving] = useState(false);

  const queryClient = useQueryClient();

  const { data: existingPrefs, isLoading } = useQuery({
    queryKey: ['notificationPrefs', currentUser?.email],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreference.filter({
        user_email: currentUser.email
      });
      return prefs[0];
    },
    enabled: !!currentUser?.email
  });

  useEffect(() => {
    if (existingPrefs) {
      setPreferences({
        new_videos: existingPrefs.new_videos ?? true,
        new_comments: existingPrefs.new_comments ?? true,
        upcoming_birthdays: existingPrefs.upcoming_birthdays ?? true,
        new_messages: existingPrefs.new_messages ?? true,
        live_streams: existingPrefs.live_streams ?? true
      });
    }
  }, [existingPrefs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (existingPrefs) {
        await base44.entities.NotificationPreference.update(existingPrefs.id, preferences);
      } else {
        await base44.entities.NotificationPreference.create({
          ...preferences,
          user_email: currentUser.email
        });
      }
      queryClient.invalidateQueries({ queryKey: ['notificationPrefs'] });
      alert('Preferencias guardadas exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Preferencias de Notificaciones</h3>
            <p className="text-sm text-gray-600">Configura qué notificaciones deseas recibir</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <Label className="text-base font-medium">Nuevos Videos</Label>
              <p className="text-sm text-gray-600">Cuando alguien que sigues sube un video</p>
            </div>
            <Switch
              checked={preferences.new_videos}
              onCheckedChange={(checked) => setPreferences({ ...preferences, new_videos: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <Label className="text-base font-medium">Comentarios</Label>
              <p className="text-sm text-gray-600">Cuando alguien comenta en tus videos</p>
            </div>
            <Switch
              checked={preferences.new_comments}
              onCheckedChange={(checked) => setPreferences({ ...preferences, new_comments: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <Label className="text-base font-medium">Cumpleaños Próximos</Label>
              <p className="text-sm text-gray-600">Recordatorios de cumpleaños de miembros</p>
            </div>
            <Switch
              checked={preferences.upcoming_birthdays}
              onCheckedChange={(checked) => setPreferences({ ...preferences, upcoming_birthdays: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <Label className="text-base font-medium">Mensajes de Chat</Label>
              <p className="text-sm text-gray-600">Nuevos mensajes en el chat comunitario</p>
            </div>
            <Switch
              checked={preferences.new_messages}
              onCheckedChange={(checked) => setPreferences({ ...preferences, new_messages: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <Label className="text-base font-medium">Transmisiones en Vivo</Label>
              <p className="text-sm text-gray-600">Cuando comienza una transmisión en vivo</p>
            </div>
            <Switch
              checked={preferences.live_streams}
              onCheckedChange={(checked) => setPreferences({ ...preferences, live_streams: checked })}
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Preferencias
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}