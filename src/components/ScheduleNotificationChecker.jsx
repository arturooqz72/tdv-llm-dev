import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function ScheduleNotificationChecker({ currentUser }) {
  const { data: pendingNotifications = [] } = useQuery({
    queryKey: ['pending-notifications', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      const notifications = await base44.entities.ScheduleNotification.filter({
        creator_email: currentUser.email,
        sent: false
      });
      return notifications;
    },
    enabled: !!currentUser,
    refetchInterval: 300000, // Check every 5 minutes
    staleTime: 300000,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  useEffect(() => {
    const checkNotifications = async () => {
      const now = new Date();
      
      for (const notification of pendingNotifications) {
        const notificationTime = new Date(notification.notification_time);
        
        if (now >= notificationTime && !notification.sent) {
          // Create user notification
          await base44.entities.Notification.create({
            user_email: notification.creator_email,
            type: 'broadcast_reminder',
            message: notification.message,
            related_id: notification.program_id,
            is_read: false
          });

          // Mark as sent
          await base44.entities.ScheduleNotification.update(notification.id, {
            sent: true
          });
        }
      }
    };

    if (pendingNotifications.length > 0) {
      checkNotifications();
    }
  }, [pendingNotifications]);

  return null;
}