import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

// VAPID public key generada para Web Push nativo
const VAPID_PUBLIC_KEY = 'BF_dOOxfFrEb7dkFsPi-reBqUihbvOp68bb0jKm3w32BH75KAag7ZQEd_hhL3g4eDWK07-yk77B86fyqm33P_N4';

function getPlatform() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  return isIOS ? 'ios' : isAndroid ? 'android' : 'web';
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64Url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function subscribeToWebPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[PUSH] PushManager no disponible');
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  
  // Always unsubscribe old and create fresh subscription with current VAPID key
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await existing.unsubscribe();
    console.log('[PUSH] Suscripción anterior eliminada');
  }
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  console.log('[PUSH] Nueva suscripción Web Push creada ✅');

  return subscription;
}

export default function PushNotificationManager({ currentUser }) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const platform = useMemo(() => getPlatform(), []);
  const [tokenStatus, setTokenStatus] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    if (currentUser && permission === 'granted') {
      ensureSubscriptionSaved();
    }
  }, [currentUser, permission]);

  const ensureSubscriptionSaved = async () => {
    if (!currentUser?.email) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      setTokenStatus('error');
      setDebugInfo('Permiso no concedido');
      return;
    }

    setTokenStatus('loading');
    setDebugInfo('Suscribiendo a Web Push...');

    try {
      const subscription = await subscribeToWebPush();
      if (!subscription) {
        setTokenStatus('error');
        setDebugInfo('No se pudo crear la suscripción. Plataforma: ' + platform);
        return;
      }

      const subJson = subscription.toJSON();
      const endpoint = subJson.endpoint;
      const p256dh = subJson.keys.p256dh;
      const auth = subJson.keys.auth;

      setDebugInfo('Guardando suscripción...');

      // Check if subscription already exists
      const existing = await base44.entities.UserPushToken.filter({
        user_email: currentUser.email,
        endpoint
      });

      const payload = {
        user_email: currentUser.email,
        endpoint,
        p256dh,
        auth,
        platform,
        updated_at: new Date().toISOString()
      };

      if (existing.length > 0) {
        await base44.entities.UserPushToken.update(existing[0].id, payload);
      } else {
        await base44.entities.UserPushToken.create(payload);
      }

      // Cleanup: keep max 5 per user
      const allForUser = await base44.entities.UserPushToken.filter({
        user_email: currentUser.email
      });
      if (allForUser.length > 5) {
        const sorted = [...allForUser].sort((a, b) => 
          (b.updated_at || '').localeCompare(a.updated_at || '')
        );
        for (const old of sorted.slice(5)) {
          try { await base44.entities.UserPushToken.delete(old.id); } catch (e) {}
        }
      }

      setTokenStatus('success');
      setDebugInfo('Suscripción registrada (' + platform + ') ✅');
      console.log('[PUSH] Suscripción Web Push guardada ✅');
    } catch (error) {
      console.error('[PUSH] Error:', error);
      setTokenStatus('error');
      setDebugInfo('Error: ' + error.message);
    }
  };

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        await ensureSubscriptionSaved();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const sendTestPush = async () => {
    setDebugInfo('Enviando push de prueba...');
    try {
      const res = await base44.functions.invoke('sendWebPush', {
        title: '🔔 TEST - Team Desvelados',
        message: '¡Si ves esto, las notificaciones Web Push funcionan! ✅',
        link: '/',
        targetEmails: [currentUser.email]
      });
      setDebugInfo('Push de prueba enviado: ' + JSON.stringify(res.data));
    } catch (e) {
      setDebugInfo('Error enviando prueba: ' + e.message);
    }
  };

  return (
    <Card className="bg-gray-800 border-yellow-600">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notificaciones Push (Web Push Nativo)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === 'default' && (
          <div className="p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
            <p className="text-white mb-3">Activa las notificaciones para recibir alertas.</p>
            {platform === 'ios' && (
              <p className="text-yellow-400 text-sm mb-3">
                📱 iOS: Asegúrate de haber instalado la app desde "Agregar a pantalla de inicio" en Safari.
              </p>
            )}
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
            <p className="text-white">Notificaciones activadas ✅</p>
            <p className="text-gray-400 text-xs mt-1">Plataforma: {platform} | Protocolo: Web Push API</p>
            <div className="mt-3 flex gap-2 flex-wrap">
              <Button
                onClick={ensureSubscriptionSaved}
                variant="outline"
                className="border-yellow-600 text-yellow-500"
                disabled={tokenStatus === 'loading'}
              >
                {tokenStatus === 'loading' ? 'Registrando...' : 'Re-registrar'}
              </Button>
              <Button
                onClick={sendTestPush}
                variant="outline"
                className="border-cyan-600 text-cyan-500"
              >
                Enviar Push de Prueba
              </Button>
            </div>
            {debugInfo && (
              <div className={`mt-3 p-2 rounded text-xs ${
                tokenStatus === 'success' ? 'bg-green-900/50 text-green-400' :
                tokenStatus === 'error' ? 'bg-red-900/50 text-red-400' :
                'bg-blue-900/50 text-blue-400'
              }`}>
                {debugInfo}
              </div>
            )}
          </div>
        )}

        {permission === 'denied' && (
          <div className="p-4 bg-red-900/30 border border-red-600 rounded-lg">
            <p className="text-red-400 font-medium">Notificaciones bloqueadas</p>
            <p className="text-gray-400 text-sm mt-1">
              Debes habilitar las notificaciones en la configuración de tu dispositivo/navegador.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}