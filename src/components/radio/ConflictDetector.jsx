import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function ConflictDetector({ currentUser }) {
  const { data: programs = [] } = useQuery({
    queryKey: ['radio-programs-all'],
    queryFn: () => base44.entities.RadioProgram.filter({ is_active: true }),
    enabled: !!currentUser,
    refetchInterval: 1800000, // 30 minutos
    staleTime: 1500000, // 25 minutos
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    const detectConflicts = async () => {
      if (!currentUser || programs.length < 2) return;

      const conflicts = [];
      const now = new Date();

      // Check for scheduling conflicts
      for (let i = 0; i < programs.length; i++) {
        for (let j = i + 1; j < programs.length; j++) {
          const prog1 = programs[i];
          const prog2 = programs[j];

          // Skip if different stations
          if (prog1.station_id !== prog2.station_id) continue;

          // Check if they have overlapping times
          const overlap = checkTimeOverlap(prog1, prog2);
          
          if (overlap) {
            conflicts.push({
              program1_id: prog1.id,
              program2_id: prog2.id,
              conflict_time: overlap.time,
              station_id: prog1.station_id,
              severity: overlap.severity
            });
          }
        }
      }

      // Save new conflicts and notify creators
      for (const conflict of conflicts) {
        const existing = await base44.entities.ScheduleConflict.filter({
          program1_id: conflict.program1_id,
          program2_id: conflict.program2_id,
          resolved: false
        });

        if (existing.length === 0) {
          const newConflict = await base44.entities.ScheduleConflict.create({
            ...conflict,
            notified: false,
            resolved: false
          });

          // Notify program creators
          const prog1 = programs.find(p => p.id === conflict.program1_id);
          const prog2 = programs.find(p => p.id === conflict.program2_id);

          if (prog1?.created_by) {
            await base44.entities.Notification.create({
              user_email: prog1.created_by,
              type: 'schedule_conflict',
              message: `Conflicto de programación detectado para "${prog1.title}"`,
              related_id: newConflict.id,
              is_read: false
            });
          }

          if (prog2?.created_by && prog2.created_by !== prog1?.created_by) {
            await base44.entities.Notification.create({
              user_email: prog2.created_by,
              type: 'schedule_conflict',
              message: `Conflicto de programación detectado para "${prog2.title}"`,
              related_id: newConflict.id,
              is_read: false
            });
          }
        }
      }

      // Check upcoming broadcasts (within 2 hours)
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      for (const program of programs) {
        if (program.created_by === currentUser.email && program.next_broadcast) {
          const broadcastTime = new Date(program.next_broadcast);
          
          if (broadcastTime >= now && broadcastTime <= twoHoursFromNow && !program.notification_sent) {
            await base44.entities.Notification.create({
              user_email: program.created_by,
              type: 'broadcast_reminder',
              message: `Tu programa "${program.title}" se transmitirá en ${Math.round((broadcastTime - now) / 60000)} minutos`,
              related_id: program.id,
              is_read: false
            });

            await base44.entities.RadioProgram.update(program.id, {
              notification_sent: true
            });
          }
        }
      }
    };

    detectConflicts();
  }, [programs, currentUser]);

  return null;
}

function checkTimeOverlap(prog1, prog2) {
  // Simple overlap detection for same time slots
  if (!prog1.schedule_time || !prog2.schedule_time) return null;

  const isSameTime = prog1.schedule_time === prog2.schedule_time;
  
  if (!isSameTime) return null;

  // Check if recurring patterns overlap
  if (prog1.is_recurring && prog2.is_recurring) {
    const daysOverlap = prog1.days?.some(day => prog2.days?.includes(day));
    
    if (daysOverlap) {
      return {
        time: new Date().toISOString(),
        severity: 'high'
      };
    }
  }

  if (prog1.scheduled_date && prog2.scheduled_date) {
    const date1 = new Date(prog1.scheduled_date);
    const date2 = new Date(prog2.scheduled_date);
    
    if (Math.abs(date1 - date2) < 60000) { // Within 1 minute
      return {
        time: prog1.scheduled_date,
        severity: 'high'
      };
    }
  }

  return null;
}