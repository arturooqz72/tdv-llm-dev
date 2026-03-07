import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function NotificationBell({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    if (!currentUser?.email) return;

    try {
      const notifs = await base44.entities.Notification.filter(
        { user_email: currentUser.email },
        '-created_date',
        30
      );

      setNotifications(notifs || []);
      setUnreadCount((notifs || []).filter(n => !n.is_read).length);
      setLoaded(true);
    } catch (error) {
      console.log('Error loading notifications:', error);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    if (!currentUser || loaded) return;

    const timer = setTimeout(() => {
      loadNotifications();
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentUser, loaded, loadNotifications]);

  useEffect(() => {
    if (open && loaded) {
      loadNotifications();
    }
  }, [open, loaded, loadNotifications]);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email === currentUser.email) {
        if (event.type === 'create') {
          setNotifications(prev => [event.data, ...prev.slice(0, 29)]);
          setUnreadCount(prev => prev + 1);
        } else if (event.type === 'update') {
          setNotifications(prev =>
            prev.map(n => (n.id === event.id ? event.data : n))
          );

          if (event.data?.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser]);

  const markAsRead = async (notification) => {
    if (!notification?.id || notification.is_read) return;

    try {
      await base44.entities.Notification.update(notification.id, { is_read: true });
    } catch (error) {
      console.log('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification);
    setOpen(false);

    if (notification.type === 'new_video' || notification.type === 'new_comment') {
      navigate(createPageUrl(`VideoDetail?id=${notification.related_id}`));
    } else if (notification.type === 'new_stream' && notification.related_id) {
      navigate(createPageUrl(`LiveStream?id=${notification.related_id}`));
    } else if (notification.type === 'live_radio' && notification.related_id) {
      navigate(createPageUrl(`LiveRadioPlayer?id=${notification.related_id}`));
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.is_read);

    for (const notif of unreadNotifs) {
      try {
        await base44.entities.Notification.update(notif.id, { is_read: true });
      } catch (error) {
        console.log('Error marking all notifications as read:', error);
      }
    }
  };

  if (!currentUser) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-gray-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 text-black text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 bg-gray-900 border-cyan-500" align="end">
        <div className="p-4 border-b border-cyan-500 flex items-center justify-between">
          <h3 className="font-semibold text-white">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tienes notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full p-4 text-left hover:bg-gray-800 transition-colors ${
                    !notif.is_read ? 'bg-gray-800/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.is_read ? 'text-white font-medium' : 'text-gray-300'}`}>
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          {moment(notif.created_date).fromNow()}
                        </p>

                        {notif.type === 'admin_message' && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
