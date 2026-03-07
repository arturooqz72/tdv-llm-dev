import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, isToday, isTomorrow, addDays } from 'date-fns';

export default function BirthdayNotifier({ currentUser }) {
  useEffect(() => {
    if (!currentUser) return;

    const checkBirthdays = async () => {
      try {
        // Verificar preferencias
        const prefs = await base44.entities.NotificationPreference.filter({
          user_email: currentUser.email
        });

        if (prefs.length > 0 && prefs[0].upcoming_birthdays === false) {
          return;
        }

        // Obtener todos los cumpleaños
        const birthdays = await base44.entities.Birthday.list();
        const today = new Date();

        for (const birthday of birthdays) {
          const birthDate = new Date(birthday.birth_date);
          const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

          // Notificar el día del cumpleaños
          if (isToday(thisYearBirthday)) {
            const existing = await base44.entities.Notification.filter({
              user_email: currentUser.email,
              related_id: birthday.id,
              type: 'birthday_today'
            });

            if (existing.length === 0) {
              await base44.entities.Notification.create({
                user_email: currentUser.email,
                type: 'birthday_today',
                message: `🎂 ¡Hoy es el cumpleaños de ${birthday.member_name}! Envíale tus felicitaciones`,
                related_id: birthday.id,
                is_read: false
              });
            }
          }

          // Notificar un día antes
          if (isTomorrow(thisYearBirthday)) {
            const existing = await base44.entities.Notification.filter({
              user_email: currentUser.email,
              related_id: birthday.id,
              type: 'birthday_tomorrow'
            });

            if (existing.length === 0) {
              await base44.entities.Notification.create({
                user_email: currentUser.email,
                type: 'birthday_tomorrow',
                message: `🎈 Mañana es el cumpleaños de ${birthday.member_name}`,
                related_id: birthday.id,
                is_read: false
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking birthdays:', error);
      }
    };

    // Verificar después de 5 segundos y cada 4 horas
    const timer = setTimeout(checkBirthdays, 5000);
    const interval = setInterval(checkBirthdays, 4 * 60 * 60 * 1000);

    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [currentUser]);

  return null;
}