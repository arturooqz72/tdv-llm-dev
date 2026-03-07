import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Radio, Music } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function RadioSchedule() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.log('Usuario no autenticado');
      }
    };
    loadUser();
  }, []);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['radio-programs-schedule'],
    queryFn: () => base44.entities.RadioProgram.filter({ is_active: true }, '-scheduled_date')
  });

  const { data: stations = [] } = useQuery({
    queryKey: ['radio-stations'],
    queryFn: () => base44.entities.RadioStation.filter({ is_active: true })
  });

  const genreLabels = {
    worship: 'Alabanza',
    sermon: 'Sermones',
    prayer: 'Oración',
    meditation: 'Meditación',
    music: 'Música',
    podcast: 'Podcast',
    youth: 'Jóvenes'
  };

  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  // Get programs for a specific date
  const getProgramsForDate = (date) => {
    const dayName = dayNames[date.getDay()];
    return programs.filter(program => {
      // Check specific scheduled date
      if (program.scheduled_date) {
        const scheduledDate = parseISO(program.scheduled_date);
        if (isSameDay(scheduledDate, date)) return true;
      }
      // Check recurring programs
      if (program.is_recurring && program.days?.includes(dayName)) {
        return true;
      }
      return false;
    });
  };

  // Generate week view
  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const weekDays = getWeekDays();

  const statusColors = {
    scheduled: 'bg-blue-500',
    live: 'bg-red-500 animate-pulse',
    completed: 'bg-gray-500',
    cancelled: 'bg-gray-700'
  };

  const statusLabels = {
    scheduled: 'Programado',
    live: 'En Vivo',
    completed: 'Completado',
    cancelled: 'Cancelado'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Programación de Radio</h1>
          <p className="text-gray-400">Horarios y transmisiones programadas</p>
        </div>

        <Tabs defaultValue="week" className="space-y-6">
          <TabsList className="bg-gray-800 border border-yellow-600">
            <TabsTrigger value="week">Vista Semanal</TabsTrigger>
            <TabsTrigger value="list">Lista Completa</TabsTrigger>
          </TabsList>

          {/* Week View */}
          <TabsContent value="week" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDays.map((day, index) => {
                const dayPrograms = getProgramsForDate(day);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <Card 
                    key={index}
                    className={`bg-gray-800 border-2 ${
                      isToday ? 'border-yellow-500' : 'border-gray-700'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-center">
                        <div className={`font-bold mb-1 ${isToday ? 'text-yellow-500' : 'text-white'}`}>
                          {format(day, 'EEEE', { locale: es })}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {format(day, 'd MMM', { locale: es })}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {dayPrograms.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-4">
                          Sin programas
                        </p>
                      ) : (
                        dayPrograms.map(program => {
                          const station = stations.find(s => s.id === program.station_id);
                          return (
                            <div
                              key={program.id}
                              className="bg-gray-900 rounded-lg p-2 border border-gray-700 hover:border-yellow-600 transition-all cursor-pointer"
                            >
                              <div className="flex items-start gap-2 mb-1">
                                <Clock className="w-3 h-3 text-yellow-500 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-yellow-500 font-semibold">
                                    {program.schedule_time || 'Sin hora'}
                                  </p>
                                  <p className="text-xs text-white font-medium truncate">
                                    {program.title}
                                  </p>
                                  {station && (
                                    <p className="text-xs text-gray-400 truncate">
                                      {station.name}
                                    </p>
                                  )}
                                  <Badge 
                                    className={`mt-1 text-xs ${statusColors[program.broadcast_status || 'scheduled']} text-white`}
                                  >
                                    {statusLabels[program.broadcast_status || 'scheduled']}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-yellow-600 hover:bg-gray-700"
              >
                ← Semana Anterior
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-4 py-2 bg-yellow-600 text-black rounded-lg font-semibold hover:bg-yellow-700"
              >
                Hoy
              </button>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-yellow-600 hover:bg-gray-700"
              >
                Semana Siguiente →
              </button>
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="space-y-4">
            <Card className="bg-gray-800 border-yellow-600">
              <CardHeader>
                <CardTitle className="text-white">Todos los Programas Programados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {programs
                    .filter(p => p.scheduled_date || p.is_recurring)
                    .map(program => {
                      const station = stations.find(s => s.id === program.station_id);
                      return (
                        <div
                          key={program.id}
                          className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-yellow-600 transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-white font-semibold mb-1">{program.title}</h3>
                              {program.description && (
                                <p className="text-sm text-gray-400">{program.description}</p>
                              )}
                            </div>
                            <Badge 
                              className={`${statusColors[program.broadcast_status || 'scheduled']} text-white`}
                            >
                              {statusLabels[program.broadcast_status || 'scheduled']}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm">
                            {program.scheduled_date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-yellow-500" />
                                <span className="text-white">
                                  {format(parseISO(program.scheduled_date), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                                </span>
                              </div>
                            )}
                            {program.is_recurring && (
                              <div className="flex items-center gap-2">
                                <Radio className="w-4 h-4 text-green-500" />
                                <span className="text-white">
                                  Recurrente: {program.days?.join(', ') || 'Todos los días'}
                                </span>
                                {program.schedule_time && (
                                  <span className="text-gray-400">
                                    a las {program.schedule_time}
                                  </span>
                                )}
                              </div>
                            )}
                            {station && (
                              <div className="flex items-center gap-2">
                                <Music className="w-4 h-4 text-blue-500" />
                                <span className="text-white">{station.name}</span>
                                <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-500">
                                  {genreLabels[station.genre]}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}