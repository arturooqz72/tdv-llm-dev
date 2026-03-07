import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, MapPin, Radio, Mic, Heart, Sparkles, Plus, Bell, BellOff, ExternalLink } from 'lucide-react';
import { format, isFuture, isPast, isToday, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

const eventTypes = {
  live_broadcast: { label: 'Transmisión en Vivo', icon: Radio, color: 'bg-red-500' },
  interview: { label: 'Entrevista', icon: Mic, color: 'bg-blue-500' },
  community_event: { label: 'Evento Comunitario', icon: Users, color: 'bg-green-500' },
  worship: { label: 'Alabanza', icon: Heart, color: 'bg-purple-500' },
  special: { label: 'Especial', icon: Sparkles, color: 'bg-yellow-500' }
};

export default function RadioEvents() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'live_broadcast',
    event_date: '',
    duration_minutes: 60,
    location: 'Virtual - Radio Online',
    requires_registration: false,
    max_participants: null
  });

  const queryClient = useQueryClient();

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

  const { data: events = [] } = useQuery({
    queryKey: ['radio-events'],
    queryFn: () => base44.entities.RadioEvent.list('-event_date', 100),
    refetchInterval: 30000
  });

  const { data: myRegistrations = [] } = useQuery({
    queryKey: ['my-event-registrations', currentUser?.email],
    queryFn: () => base44.entities.EventRegistration.filter({ 
      user_email: currentUser.email,
      status: 'confirmed'
    }),
    enabled: !!currentUser
  });

  const createEventMutation = useMutation({
    mutationFn: (eventData) => base44.entities.RadioEvent.create(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries(['radio-events']);
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        description: '',
        type: 'live_broadcast',
        event_date: '',
        duration_minutes: 60,
        location: 'Virtual - Radio Online',
        requires_registration: false,
        max_participants: null
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async ({ event, action }) => {
      if (action === 'register') {
        await base44.entities.EventRegistration.create({
          event_id: event.id,
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email.split('@')[0]
        });
        await base44.entities.RadioEvent.update(event.id, {
          current_participants: (event.current_participants || 0) + 1
        });
      } else {
        const registrations = await base44.entities.EventRegistration.filter({
          event_id: event.id,
          user_email: currentUser.email
        });
        if (registrations[0]) {
          await base44.entities.EventRegistration.update(registrations[0].id, {
            status: 'cancelled'
          });
          await base44.entities.RadioEvent.update(event.id, {
            current_participants: Math.max((event.current_participants || 1) - 1, 0)
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['radio-events']);
      queryClient.invalidateQueries(['my-event-registrations']);
    }
  });

  const handleCreateEvent = (e) => {
    e.preventDefault();
    createEventMutation.mutate({
      ...newEvent,
      hosts: [currentUser.email]
    });
  };

  const isRegistered = (eventId) => {
    return myRegistrations.some(r => r.event_id === eventId);
  };

  const upcomingEvents = events.filter(e => isFuture(new Date(e.event_date)) && e.status !== 'cancelled');
  const liveEvents = events.filter(e => e.status === 'live');
  const pastEvents = events.filter(e => isPast(new Date(e.event_date)) || e.status === 'completed');
  const myEvents = events.filter(e => myRegistrations.some(r => r.event_id === e.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
            <Calendar className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Eventos en Vivo</h1>
          <p className="text-xl text-gray-400">Transmisiones especiales y eventos comunitarios</p>
        </div>

        {/* Create Event Button */}
        {currentUser?.role === 'admin' && (
          <div className="mb-8 flex justify-center">
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"
            >
              <Plus className="w-5 h-5 mr-2" />
              Crear Evento
            </Button>
          </div>
        )}

        {/* Live Events Banner */}
        {liveEvents.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-6 border-2 border-red-500 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  <h2 className="text-2xl font-bold text-white">¡EN VIVO AHORA!</h2>
                </div>
                <Badge className="bg-white text-red-600">
                  {liveEvents.length} {liveEvents.length === 1 ? 'evento' : 'eventos'}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveEvents.map(event => (
                  <EventCard 
                    key={event.id}
                    event={event}
                    currentUser={currentUser}
                    isRegistered={isRegistered(event.id)}
                    onRegister={registerMutation.mutate}
                    onSelect={setSelectedEvent}
                    isLive
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="bg-gray-800 mb-6">
            <TabsTrigger value="upcoming">
              Próximos ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="my-events">
              Mis Eventos ({myEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Pasados ({pastEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map(event => (
                <EventCard 
                  key={event.id}
                  event={event}
                  currentUser={currentUser}
                  isRegistered={isRegistered(event.id)}
                  onRegister={registerMutation.mutate}
                  onSelect={setSelectedEvent}
                />
              ))}
            </div>
            {upcomingEvents.length === 0 && (
              <div className="text-center py-20">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No hay eventos próximos programados</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-events">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map(event => (
                <EventCard 
                  key={event.id}
                  event={event}
                  currentUser={currentUser}
                  isRegistered={true}
                  onRegister={registerMutation.mutate}
                  onSelect={setSelectedEvent}
                />
              ))}
            </div>
            {myEvents.length === 0 && (
              <div className="text-center py-20">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No estás registrado en ningún evento</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map(event => (
                <EventCard 
                  key={event.id}
                  event={event}
                  currentUser={currentUser}
                  isRegistered={isRegistered(event.id)}
                  onSelect={setSelectedEvent}
                  isPast
                />
              ))}
            </div>
            {pastEvents.length === 0 && (
              <div className="text-center py-20">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No hay eventos pasados</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Event Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="bg-gray-800 text-white border-yellow-600 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Evento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <Input
                placeholder="Título del evento"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                required
                className="bg-gray-900 border-gray-700"
              />
              <Textarea
                placeholder="Descripción"
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                className="bg-gray-900 border-gray-700"
                rows={4}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Tipo</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md"
                  >
                    {Object.entries(eventTypes).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Duración (min)</label>
                  <Input
                    type="number"
                    value={newEvent.duration_minutes}
                    onChange={(e) => setNewEvent({...newEvent, duration_minutes: parseInt(e.target.value)})}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
              </div>
              <Input
                type="datetime-local"
                value={newEvent.event_date}
                onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
                required
                className="bg-gray-900 border-gray-700"
              />
              <Input
                placeholder="Ubicación"
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                className="bg-gray-900 border-gray-700"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newEvent.requires_registration}
                  onChange={(e) => setNewEvent({...newEvent, requires_registration: e.target.checked})}
                  className="w-4 h-4"
                />
                <label className="text-sm">Requiere registro</label>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black">
                Crear Evento
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <EventDetailModal 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)}
            currentUser={currentUser}
            isRegistered={isRegistered(selectedEvent.id)}
            onRegister={registerMutation.mutate}
          />
        )}
      </div>
    </div>
  );
}

function EventCard({ event, currentUser, isRegistered, onRegister, onSelect, isPast, isLive }) {
  const EventIcon = eventTypes[event.type]?.icon || Radio;
  const isFull = event.max_participants && event.current_participants >= event.max_participants;

  return (
    <Card className={`bg-gray-800 border-gray-700 hover:border-yellow-600 transition-all cursor-pointer ${isLive ? 'border-red-500' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge className={`${eventTypes[event.type]?.color} text-white`}>
            <EventIcon className="w-3 h-3 mr-1" />
            {eventTypes[event.type]?.label}
          </Badge>
          {isLive && <Badge className="bg-red-500 text-white animate-pulse">EN VIVO</Badge>}
        </div>
        <CardTitle className="text-white line-clamp-2">{event.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {event.description && (
          <p className="text-gray-400 text-sm mb-4 line-clamp-3">{event.description}</p>
        )}
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            {format(new Date(event.event_date), "EEEE, d 'de' MMMM", { locale: es })}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            {format(new Date(event.event_date), 'HH:mm', { locale: es })} ({event.duration_minutes} min)
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="w-4 h-4" />
              {event.location}
            </div>
          )}
          {event.requires_registration && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              {event.current_participants || 0} 
              {event.max_participants ? ` / ${event.max_participants}` : ''} registrados
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => onSelect(event)}
            variant="outline"
            size="sm"
            className="flex-1 border-yellow-600 text-yellow-500"
          >
            Ver Detalles
          </Button>
          {!isPast && currentUser && event.requires_registration && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onRegister({ event, action: isRegistered ? 'unregister' : 'register' });
              }}
              size="sm"
              disabled={!isRegistered && isFull}
              className={isRegistered 
                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'
              }
            >
              {isRegistered ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EventDetailModal({ event, onClose, currentUser, isRegistered, onRegister }) {
  const EventIcon = eventTypes[event.type]?.icon || Radio;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-yellow-600 max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-3">
            <Badge className={`${eventTypes[event.type]?.color} text-white`}>
              <EventIcon className="w-4 h-4 mr-1" />
              {eventTypes[event.type]?.label}
            </Badge>
            {event.status === 'live' && (
              <Badge className="bg-red-500 text-white animate-pulse">EN VIVO</Badge>
            )}
          </div>
          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {event.description && (
            <p className="text-gray-300">{event.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 bg-gray-900 rounded-xl p-4">
            <div>
              <div className="flex items-center gap-2 text-yellow-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-semibold">Fecha</span>
              </div>
              <p className="text-white">{format(new Date(event.event_date), "EEEE, d 'de' MMMM", { locale: es })}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-yellow-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">Hora</span>
              </div>
              <p className="text-white">{format(new Date(event.event_date), 'HH:mm', { locale: es })}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-yellow-500 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-semibold">Ubicación</span>
              </div>
              <p className="text-white">{event.location || 'Virtual'}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-yellow-500 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm font-semibold">Participantes</span>
              </div>
              <p className="text-white">
                {event.current_participants || 0} 
                {event.max_participants ? ` / ${event.max_participants}` : ''}
              </p>
            </div>
          </div>

          {event.stream_url && (
            <Button
              onClick={() => window.open(event.stream_url, '_blank')}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Unirse a la Transmisión
            </Button>
          )}

          {currentUser && event.requires_registration && isFuture(new Date(event.event_date)) && (
            <Button
              onClick={() => {
                onRegister({ event, action: isRegistered ? 'unregister' : 'register' });
                onClose();
              }}
              className={`w-full ${
                isRegistered 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'
              }`}
            >
              {isRegistered ? (
                <>
                  <BellOff className="w-4 h-4 mr-2" />
                  Cancelar Registro
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Registrarse al Evento
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}