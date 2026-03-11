import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  Video,
  Radio,
  MessageCircle,
  Cake,
  Sparkles,
  CheckCircle2,
  Users,
  Hash,
  Loader2,
} from "lucide-react";

import PushNotificationManager from "@/components/notifications/PushNotificationManager";
import PermissionGuard from "@/components/PermissionGuard";

const DEFAULT_PREFERENCES = {
  new_videos: true,
  new_comments: true,
  upcoming_birthdays: true,
  new_messages: true,
  live_streams: true,
  new_chat_rooms: true,
  new_users: true,
};

function getStorageKey(email) {
  return `tdv_notification_preferences_${email || "guest"}`;
}

function loadPreferences(email) {
  try {
    if (!email) return { ...DEFAULT_PREFERENCES };

    const raw = localStorage.getItem(getStorageKey(email));
    if (!raw) return { ...DEFAULT_PREFERENCES };

    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_PREFERENCES,
      ...(parsed || {}),
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function savePreferences(email, prefs) {
  if (!email) return;

  localStorage.setItem(getStorageKey(email), JSON.stringify(prefs));
}

export default function NotificationSettings() {
  const { user: currentUser, isLoadingAuth } = useAuth();

  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentUser?.email) return;

    const stored = loadPreferences(currentUser.email);
    setPreferences(stored);
  }, [currentUser?.email]);

  const handleToggle = (key, value) => {
    if (!currentUser?.email) return;

    const updated = {
      ...preferences,
      [key]: value,
    };

    setPreferences(updated);

    savePreferences(currentUser.email, updated);

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const notificationOptions = useMemo(
    () => [
      {
        key: "new_videos",
        icon: Video,
        title: "Nuevos Videos",
        description: "Recibe notificaciones cuando haya nuevos videos disponibles.",
        color: "text-purple-500",
      },
      {
        key: "live_streams",
        icon: Radio,
        title: "Transmisiones en Vivo",
        description: "Alerta cuando inicie una transmisión en vivo.",
        color: "text-red-500",
      },
      {
        key: "new_comments",
        icon: MessageCircle,
        title: "Nuevos Comentarios",
        description: "Notifica cuando alguien comente en tus contenidos.",
        color: "text-blue-500",
      },
      {
        key: "new_messages",
        icon: MessageCircle,
        title: "Mensajes Directos",
        description: "Recibe alertas de nuevos mensajes en el chat.",
        color: "text-green-500",
      },
      {
        key: "upcoming_birthdays",
        icon: Cake,
        title: "Cumpleaños",
        description: "Recordatorios de cumpleaños de miembros de la comunidad.",
        color: "text-yellow-500",
      },
      {
        key: "new_chat_rooms",
        icon: Hash,
        title: "Nuevas Salas de Chat",
        description: "Recibe notificaciones cuando se cree una nueva sala de chat.",
        color: "text-cyan-500",
      },
      ...(currentUser?.role === "admin"
        ? [
            {
              key: "new_users",
              icon: Users,
              title: "Nuevos Usuarios (Admin)",
              description: "Alerta cuando un nuevo usuario se registre en la app.",
              color: "text-orange-500",
            },
          ]
        : []),
    ],
    [currentUser?.role]
  );

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <PermissionGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-6">
        <div className="max-w-4xl mx-auto">

          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center">
              <Bell className="w-7 h-7 text-black" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white">
                Preferencias de Notificaciones
              </h1>

              <p className="text-gray-400">
                Personaliza cómo y cuándo recibir notificaciones
              </p>
            </div>
          </div>

          {saved && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-xl flex items-center gap-3 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span>Preferencias guardadas correctamente</span>
            </div>
          )}

          <div className="space-y-4">
            {notificationOptions.map((option) => {
              const Icon = option.icon;

              return (
                <Card key={option.key} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex items-start gap-4 flex-1">

                        <div
                          className={`w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center ${option.color}`}
                        >
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
                        onCheckedChange={(checked) =>
                          handleToggle(option.key, checked)
                        }
                        className="mt-1"
                      />

                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8">
            <PushNotificationManager currentUser={currentUser} />
          </div>

          <Card className="mt-8 bg-gradient-to-r from-cyan-500/10 to-cyan-400/10 border-cyan-500">
            <CardContent className="p-6">

              <div className="flex items-start gap-3">

                <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5" />

                <div>
                  <h4 className="text-white font-semibold mb-1">
                    Notificaciones en Tiempo Real
                  </h4>

                  <p className="text-sm text-gray-400">
                    Las preferencias de esta pantalla ya no dependen de Base44.
                    Más adelante se pueden sincronizar directamente con Supabase.
                  </p>
                </div>

              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </PermissionGuard>
  );
}
