import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, isBefore, isAfter, addMinutes, parseISO } from 'date-fns';

export default function StreamNotifier({ currentUser }) {
  useEffect(() => {
    if (!currentUser) return;

    const checkScheduledStreams = async () => {
      try {
        // Verificar preferencias
        const prefs = await base44.entities.NotificationPreference.filter({
          user_email: currentUser.email
        });

        if (prefs.length > 0 && prefs[0].live_streams === false) {
          return;
        }

        // Obtener transmisiones programadas
        const scheduledStreams = await base44.entities.LiveStream.filter({
          is_scheduled: true,
          is_live: false
        });

        const now = new Date();
        const in15Minutes = addMinutes(now, 15);

        for (const stream of scheduledStreams) {
          if (!stream.scheduled_start) continue;

          const startTime = parseISO(stream.scheduled_start);

          // Notificar 15 minutos antes
          if (isAfter(startTime, now) && isBefore(startTime, in15Minutes)) {
            const existing = await base44.entities.Notification.filter({
              user_email: currentUser.email,
              related_id: stream.id,
              type: 'stream_starting_soon'
            });

            if (existing.length === 0) {
              await base44.entities.Notification.create({
                user_email: currentUser.email,
                type: 'stream_starting_soon',
                message: `🔴 La transmisión "${stream.title}" comenzará en 15 minutos`,
                related_id: stream.id,
                from_user: stream.created_by,
                is_read: false
              });
            }
          }
        }

        // Notificar programas de radio próximos
        const radioPrograms = await base44.entities.RadioProgram.filter({
          is_active: true,
          auto_broadcast: true
        });

        for (const program of radioPrograms) {
          if (!program.next_broadcast) continue;

          const broadcastTime = parseISO(program.next_broadcast);

          // Notificar 30 minutos antes
          const in30Minutes = addMinutes(now, 30);

          if (isAfter(broadcastTime, now) && isBefore(broadcastTime, in30Minutes)) {
            const existing = await base44.entities.Notification.filter({
              user_email: currentUser.email,
              related_id: program.id,
              type: 'radio_starting_soon'
            });

            if (existing.length === 0) {
              await base44.entities.Notification.create({
                user_email: currentUser.email,
                type: 'radio_starting_soon',
                message: `📻 "${program.title}" se transmitirá en 30 minutos`,
                related_id: program.id,
                from_user: program.created_by,
                is_read: false
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking scheduled streams:', error);
      }
    };

    // Verificar después de 8 seg y cada 15 minutos
    const timer = setTimeout(checkScheduledStreams, 8000);
    const interval = setInterval(checkScheduledStreams, 15 * 60 * 1000);

    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [currentUser]);

  return null;
}