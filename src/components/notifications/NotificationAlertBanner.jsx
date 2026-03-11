import React, { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Bell, X, ExternalLink } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function NotificationAlertBanner({ currentUser }) {
  const [queue, setQueue] = useState([]);
  const [soundMuted, setSoundMuted] = useState(() => {
    try { return localStorage.getItem("notify_sound_muted") === "1"; } catch { return false; }
  });
  const isMounted = useRef(false);

  const playBeep = () => {
    if (soundMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880; // A5
      gain.gain.value = 0.05; // soft volume
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      setTimeout(() => { try { osc.stop(); ctx.close(); } catch {} }, 220);
    } catch {}
  };

  const toggleMute = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    try { localStorage.setItem("notify_sound_muted", next ? "1" : "0"); } catch {}
  };

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!currentUser?.email) return;

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event?.type === "create" && event?.data?.user_email === currentUser.email) {
        // Mostrar solo no leídas (o si el backend aún no marca is_read en create, igual avisamos)
        const noti = event.data || {};
        setQueue((prev) => [...prev, noti]);
        playBeep();
      }
    });

    return unsubscribe;
  }, [currentUser?.email, soundMuted]);

  if (!currentUser) return null;

  const current = queue[0];
  const onClose = () => setQueue((prev) => prev.slice(1));
  const onView = () => {
    try {
      const url = current?.action_url || createPageUrl("NotificationCenter");
      if (/^https?:\/\//i.test(url)) {
        window.location.href = url;
      } else {
        // Internal route
        window.location.href = url;
      }
    } finally {
      onClose();
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[100] flex justify-center px-2 sm:px-4">
      {current && (
        <div className="pointer-events-auto w-full max-w-2xl rounded-xl border border-cyan-400/60 bg-cyan-500/95 text-black shadow-xl backdrop-blur supports-[backdrop-filter]:bg-cyan-500/80">
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-black/20 text-cyan-100">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{current?.type?.replace(/_/g, " ") || "Nueva notificación"}</p>
              {current?.message && (
                <p className="text-sm text-black/80 line-clamp-2">{current.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Button size="sm" onClick={onView} className="bg-black text-cyan-300 hover:bg-black/90">
                <ExternalLink className="h-4 w-4 mr-1" /> Ver
              </Button>
              <Button size="icon" variant="ghost" onClick={toggleMute} className="text-black/70 hover:text-black" title={soundMuted ? "Sonido desactivado" : "Sonido activado"}>
                {soundMuted ? (
                  <span className="text-xs font-bold">🔇</span>
                ) : (
                  <span className="text-xs font-bold">🔊</span>
                )}
              </Button>
              <Button size="icon" variant="ghost" onClick={onClose} className="text-black/70 hover:text-black" title="Cerrar">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
