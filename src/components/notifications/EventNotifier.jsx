import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { isBefore, addMinutes, isAfter } from 'date-fns';

export default function EventNotifier({ currentUser }) {
  useEffect(() => {
    if (!currentUser) return;

    const checkUpcomingEvents = async () => {
      try {
        const now = new Date();
        const in30Minutes = addMinutes(now, 30);

        // Get user's registered events
        const registrations = await base44.entities.EventRegistration.filter({
          user_email: currentUser.email,
          status: 'confirmed',
          reminder_sent: false
        });

        for (const reg of registrations) {
          const events = await base44.entities.RadioEvent.filter({ id: reg.event_id });
          const event = events[0];

          if (!event) continue;

          const eventDate = new Date(event.event_date);
          
          // Send notification 30 minutes before event
          if (isAfter(eventDate, now) && isBefore(eventDate, in30Minutes)) {
            // Browser notification
            if (Notification.permission === 'granted') {
              new Notification('¡Evento Próximo!', {
                body: `"${event.title}" comienza en 30 minutos`,
                icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6965d0214fc84ccf68275f1d/458fcdbcc_ChatGPTImageJan13202612_03_55PM.png',
                tag: 'event-reminder',
                requireInteraction: true
              });
            }

            // In-app notification
            await base44.entities.Notification.create({
              user_email: currentUser.email,
              type: 'new_live_stream',
              message: `El evento "${event.title}" comienza en 30 minutos`,
              related_id: event.id,
              action_url: 'RadioEvents'
            });

            // Mark reminder as sent
            await base44.entities.EventRegistration.update(reg.id, {
              reminder_sent: true
            });
          }
        }

        // Check for events going live
        const allEvents = await base44.entities.RadioEvent.filter({
          status: 'scheduled',
          notification_sent: false
        });

        for (const event of allEvents) {
          const eventDate = new Date(event.event_date);
          const eventEnd = addMinutes(eventDate, event.duration_minutes || 60);

          // If event should be live now
          if (isBefore(eventDate, now) && isAfter(eventEnd, now)) {
            await base44.entities.RadioEvent.update(event.id, {
              status: 'live',
              notification_sent: true
            });

            // Notify all registered users
            const eventRegs = await base44.entities.EventRegistration.filter({
              event_id: event.id,
              status: 'confirmed'
            });

            for (const reg of eventRegs) {
              await base44.entities.Notification.create({
                user_email: reg.user_email,
                type: 'live_stream_started',
                message: `¡"${event.title}" está en vivo ahora!`,
                related_id: event.id,
                action_url: 'RadioEvents'
              });
            }
          }

          // Mark event as completed
          if (isAfter(now, eventEnd) && event.status === 'live') {
            await base44.entities.RadioEvent.update(event.id, {
              status: 'completed'
            });
          }
        }
      } catch (error) {
        console.log('Error checking events:', error);
      }
    };

    // Check after 30 sec and then every 15 minutes
    const timer = setTimeout(checkUpcomingEvents, 30000);
    const interval = setInterval(checkUpcomingEvents, 15 * 60 * 1000);

    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [currentUser]);

  return null;
}