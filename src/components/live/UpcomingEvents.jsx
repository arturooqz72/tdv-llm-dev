import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Radio, Users } from 'lucide-react';
import { format, parseISO, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import StreamReminderButton from './StreamReminderButton';

export default function UpcomingEvents({ currentUser }) {
  const { data: scheduledStreams = [] } = useQuery({
    queryKey: ['upcoming-streams'],
    queryFn: async () => {
      try {
        const streams = await base44.entities.LiveStream.filter({ 
          is_scheduled: true, 
          is_live: false 
        }, 'scheduled_start');
        return streams;
      } catch (error) {
        return [];
      }
    },
    refetchInterval: 600000, // 10 minutos
    staleTime: 480000, // 8 minutos
    refetchOnWindowFocus: false,
    retry: false
  });

  const { data: scheduledPrograms = [] } = useQuery({
    queryKey: ['upcoming-programs'],
    queryFn: async () => {
      try {
        const programs = await base44.entities.RadioProgram.filter({ 
          is_active: true,
          auto_broadcast: true
        });
        return programs;
      } catch (error) {
        return [];
      }
    },
    refetchInterval: 600000, // 10 minutos
    staleTime: 480000, // 8 minutos
    refetchOnWindowFocus: false,
    retry: false
  });

  const validStreams = scheduledStreams.filter(s => {
    if (!s || !s.scheduled_start) return false;
    try {
      return isFuture(parseISO(s.scheduled_start));
    } catch {
      return false;
    }
  });

  const validPrograms = scheduledPrograms.filter(p => {
    if (!p || !p.scheduled_date) return false;
    try {
      return isFuture(parseISO(p.scheduled_date));
    } catch {
      return false;
    }
  });

  const allEvents = [
    ...validStreams.map(s => ({ ...s, type: 'live', time: s.scheduled_start })),
    ...validPrograms.map(p => ({ ...p, type: 'radio', time: p.scheduled_date }))
  ].sort((a, b) => {
    try {
      return new Date(a.time) - new Date(b.time);
    } catch {
      return 0;
    }
  }).slice(0, 5);

  if (allEvents.length === 0) return null;

  return (
    <Card className="bg-gray-800 border-yellow-600">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-yellow-500" />
          Próximos Eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allEvents.map((event) => {
            let displayTime = 'Próximamente';
            try {
              displayTime = format(parseISO(event.time), "d MMM, HH:mm", { locale: es });
            } catch {}

            return (
              <div
                key={`${event.type}-${event.id}`}
                className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-all"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  event.type === 'live' ? 'bg-red-600' : 'bg-yellow-600'
                }`}>
                  {event.type === 'live' ? (
                    <Radio className="w-5 h-5 text-white" />
                  ) : (
                    <Radio className="w-5 h-5 text-black" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-white font-medium text-sm">{event.title}</h4>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {event.type === 'live' ? 'En Vivo' : 'Radio'}
                    </Badge>
                  </div>
                  {event.description && (
                    <p className="text-gray-400 text-xs mb-2 line-clamp-1">{event.description}</p>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {displayTime}
                      </span>
                      {event.is_collaborative && (
                        <span className="flex items-center gap-1 text-yellow-500">
                          <Users className="w-3 h-3" />
                          Colaborativa
                        </span>
                      )}
                    </div>
                    {event.type === 'live' && currentUser && (
                      <StreamReminderButton stream={event} currentUser={currentUser} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}