import { useEffect } from 'react';

// This component silently ensures the Web Push subscription stays active.
// Push display is handled by the platform's service worker via the 'push' event.
export default function PushNotificationService({ currentUser }) {
  useEffect(() => {
    if (!currentUser || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    // Ensure SW is ready and subscription is active
    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          console.log('[PushService] Suscripción Web Push activa ✅');
        } else {
          console.log('[PushService] No hay suscripción activa, se creará desde NotificationSettings');
        }
      } catch (e) {
        console.warn('[PushService] Error verificando suscripción:', e);
      }
    };

    const timer = setTimeout(checkSubscription, 3000);
    return () => clearTimeout(timer);
  }, [currentUser]);

  return null;
}