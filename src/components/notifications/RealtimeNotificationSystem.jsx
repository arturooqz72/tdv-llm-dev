import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Lightweight realtime notification system - only shows in-app toasts.
// Push notifications and in-app notification creation are handled by backend automations.
export default function RealtimeNotificationSystem({ currentUser }) {
  useEffect(() => {
    if (!currentUser?.email) return;

    // Subscribe to Notification entity for this user to show toasts
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type !== 'create') return;
      const notif = event.data;
      if (notif.user_email !== currentUser.email) return;
      if (notif.is_read) return;

      toast.info(notif.message, { duration: 5000 });
    });

    return unsubscribe;
  }, [currentUser?.email]);

  return null;
}