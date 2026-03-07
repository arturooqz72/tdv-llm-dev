import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Bell, MessageSquare, Video, Heart, Users, Radio } from 'lucide-react';

const notificationIcons = {
  new_message: MessageSquare,
  new_video: Video,
  new_comment: Heart,
  new_follow: Users,
  new_live_stream: Radio,
  live_stream_started: Radio,
  video_approved: Video,
  video_rejected: Video,
  mention: Bell
};

export default function NotificationToast({ currentUser }) {
  useEffect(() => {
    if (!currentUser?.email) return;

    // Suscribirse a nuevas notificaciones
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create') {
        const notification = event.data;
        
        // Solo mostrar si es para el usuario actual y no ha sido leída
        if (notification.user_email === currentUser.email && !notification.is_read) {
          const Icon = notificationIcons[notification.type] || Bell;
          
          toast(notification.message, {
            description: `${notification.from_user_name || 'Sistema'}`,
            icon: <Icon className="w-5 h-5" />,
            duration: 5000
          });
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser?.email]);

  return null;
}