import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { parseISO, isBefore, isAfter, addMinutes } from 'date-fns';

export default function StreamReminderChecker({ currentUser }) {
  useEffect(() => {
    if (!currentUser) return;

    const checkReminders = async () => {
      try {
        // Obtener recordatorios del usuario que no han sido enviados
        const reminders = await base44.entities.StreamReminder.filter({
          user_email: currentUser.email,
          reminder_sent: false
        });

        const now = new Date();

        for (const reminder of reminders) {
          // Obtener información de la transmisión
          const streams = await base44.entities.LiveStream.filter({
            id: reminder.stream_id
          });

          if (streams.length === 0 || !streams[0].scheduled_start) continue;

          const stream = streams[0];
          const startTime = parseISO(stream.scheduled_start);
          const reminderTime = addMinutes(startTime, -(reminder.minutes_before || 15));

          // Si es momento de enviar el recordatorio
          if (isAfter(now, reminderTime) && isBefore(now, startTime)) {
            // Verificar si ya existe una notificación para este recordatorio
            const existingNotifs = await base44.entities.Notification.filter({
              user_email: currentUser.email,
              related_id: stream.id,
              type: 'stream_reminder'
            });

            if (existingNotifs.length === 0) {
              // Crear notificación
              await base44.entities.Notification.create({
                user_email: currentUser.email,
                type: 'stream_reminder',
                message: `🔔 Recordatorio: "${stream.title}" comenzará en ${reminder.minutes_before} minutos`,
                related_id: stream.id,
                from_user: stream.created_by,
                is_read: false
              });

              // Marcar recordatorio como enviado
              await base44.entities.StreamReminder.update(reminder.id, {
                reminder_sent: true
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking stream reminders:', error);
      }
    };

    // Verificar después de 12 seg y cada 10 minutos
    const timer = setTimeout(checkReminders, 12000);
    const interval = setInterval(checkReminders, 10 * 60 * 1000);

    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [currentUser]);

  return null;
}