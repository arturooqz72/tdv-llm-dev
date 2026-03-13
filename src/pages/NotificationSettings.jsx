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
        iconClass: "text-violet-600",
        iconBg: "bg-violet-100",
      },
      {
        key: "live_streams",
        icon: Radio,
        title: "Transmisiones en Vivo",
        description: "Alerta cuando inicie una transmisión en vivo.",
        iconClass: "text-rose-600",
        iconBg: "bg-rose-100",
      },
      {
        key: "new_comments",
        icon: MessageCircle,
        title: "Nuevos Comentarios",
        description: "Notifica cuando alguien comente en tus contenidos.",
        iconClass: "text-blue-600",
        iconBg: "bg-blue-100",
      },
      {
        key: "new_messages",
        icon: MessageCircle,
        title: "Mensajes Directos",
        description: "Recibe alertas de nuevos mensajes en el chat.",
        iconClass: "text-emerald-600",
        iconBg: "bg-emerald-100",
      },
      {
        key: "upcoming_birthdays",
        icon: Cake,
        title: "Cumpleaños",
        description: "Recordatorios de cumpleaños de miembros de la comunidad.",
        iconClass: "text-amber-600",
        iconBg: "bg-amber-100",
      },
      {
        key: "new_chat_rooms",
        icon: Hash,
        title: "Nuevas Salas de Chat",
        description: "Recibe notificaciones cuando se cree una nueva sala de chat.",
        iconClass: "text-cyan-600",
        iconBg: "bg-cyan-100",
      },
      ...(currentUser?.role === "admin"
        ? [
            {
              key: "new_users",
              icon: Users,
              title: "Nuevos Usuarios (Admin)",
              description: "Alerta cuando un nuevo usuario se registre en la app.",
              iconClass: "text-orange-600",
              iconBg: "bg-orange-100",
            },
          ]
        : []),
    ],
    [currentUser?.role]
  );

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-sky-50 to-blue-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <PermissionGuard>
      <div className="min-h-screen bg-gradient-to-b from-white via-sky-50 to-blue-100 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center shadow-sm">
              <Bell className="w-7 h-7 text-sky-600" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Preferencias de Notificaciones
              </h1>

              <p className="text-gray-600">
                Personaliza cómo y cuándo recibir notificaciones
              </p>
            </div>
          </div>

          {saved && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Preferencias guardadas correctamente</span>
            </div>
          )}

          <div className="space-y-4">
            {notificationOptions.map((option) => {
              const Icon = option.icon;

              return (
                <Card
                  key={option.key}
                  className="bg-white border border-sky-100 shadow-sm rounded-2xl"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${option.iconBg}`}
                        >
                          <Icon className={`w-6 h-6 ${option.iconClass}`} />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {option.title}
                          </h3>

                          <p className="text-sm text-gray-600">
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

          <Card className="mt-8 bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-sky-600 mt-0.5" />

                <div>
                  <h4 className="text-gray-900 font-semibold mb-1">
                    Sistema de notificaciones
                  </h4>

                  <p className="text-sm text-gray-600">
                    Estas preferencias ya funcionan de forma local para el usuario actual.
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
