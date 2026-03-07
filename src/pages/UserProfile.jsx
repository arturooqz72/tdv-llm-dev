import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User as UserIcon, Edit, Save, X, MapPin, Globe, Star, Music, Clock, Heart, Calendar, Radio, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BannerEditor from '@/components/BannerEditor';
import NotificationSettings from '@/components/NotificationSettings';

const religions = [
  { value: 'lldm', label: 'LLDM' },
  { value: 'cristianismo', label: 'Cristianismo' },
  { value: 'islam', label: 'Islam' },
  { value: 'judaismo', label: 'Judaísmo' },
  { value: 'budismo', label: 'Budismo' },
  { value: 'hinduismo', label: 'Hinduismo' },
  { value: 'espiritualidad', label: 'Espiritualidad' },
  { value: 'ateismo', label: 'Ateísmo' },
  { value: 'agnosticismo', label: 'Agnosticismo' },
  { value: 'otra', label: 'Otra' },
  { value: 'prefiero_no_decir', label: 'Prefiero no decir' }
];

export default function UserProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showBannerEditor, setShowBannerEditor] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    religion: '',
    location: '',
    website: '',
    spiritual_interests: []
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setEditForm({
          bio: user.bio || '',
          religion: user.religion || '',
          location: user.location || '',
          website: user.website || '',
          spiritual_interests: user.spiritual_interests || []
        });
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: favoriteStations = [] } = useQuery({
    queryKey: ['favorite-stations', currentUser?.email],
    queryFn: async () => {
      const favorites = await base44.entities.FavoriteStation.filter({
        user_email: currentUser.email
      });
      const stationIds = favorites.map(f => f.station_id);
      if (stationIds.length === 0) return [];
      const stations = await base44.entities.RadioStation.list();
      return stations.filter(s => stationIds.includes(s.id));
    },
    enabled: !!currentUser
  });

  const { data: listeningHistory = [] } = useQuery({
    queryKey: ['listening-history', currentUser?.email],
    queryFn: async () => {
      const stats = await base44.entities.RadioListenerStats.filter(
        { user_email: currentUser.email },
        '-created_date',
        20
      );
      const programIds = stats.map(s => s.program_id);
      if (programIds.length === 0) return [];
      const programs = await base44.entities.RadioProgram.list();
      return stats.map(stat => ({
        ...stat,
        program: programs.find(p => p.id === stat.program_id)
      })).filter(s => s.program);
    },
    enabled: !!currentUser
  });

  const { data: registeredEvents = [] } = useQuery({
    queryKey: ['registered-events', currentUser?.email],
    queryFn: async () => {
      const registrations = await base44.entities.EventRegistration.filter({
        user_email: currentUser.email,
        status: 'confirmed'
      });
      const eventIds = registrations.map(r => r.event_id);
      if (eventIds.length === 0) return [];
      const events = await base44.entities.RadioEvent.list();
      return events.filter(e => eventIds.includes(e.id));
    },
    enabled: !!currentUser
  });

  const handleSaveProfile = async () => {
    try {
      await base44.auth.updateMe(editForm);
      const updatedUser = await base44.auth.me();
      setCurrentUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
    }
  };

  const handleBannerSave = async (file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ banner_url: file_url });
      const updatedUser = await base44.auth.me();
      setCurrentUser(updatedUser);
    } catch (error) {
      console.error('Error al subir banner:', error);
    }
  };

  const addInterest = (interest) => {
    if (interest && !editForm.spiritual_interests.includes(interest)) {
      setEditForm({
        ...editForm,
        spiritual_interests: [...editForm.spiritual_interests, interest]
      });
    }
  };

  const removeInterest = (interest) => {
    setEditForm({
      ...editForm,
      spiritual_interests: editForm.spiritual_interests.filter(i => i !== interest)
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-6">
      <BannerEditor
        isOpen={showBannerEditor}
        onClose={() => setShowBannerEditor(false)}
        onSave={handleBannerSave}
      />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-3xl border-2 border-yellow-600 overflow-hidden mb-8">
          <div className="relative h-48 bg-gradient-to-r from-yellow-600 to-yellow-500">
            {currentUser.banner_url && (
              <img src={currentUser.banner_url} alt="Banner" className="w-full h-full object-cover" />
            )}
            {isEditing && (
              <Button
                onClick={() => setShowBannerEditor(true)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70"
              >
                Cambiar Banner
              </Button>
            )}
          </div>

          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 gap-6">
              <div className="flex items-end gap-6">
                <div className="w-32 h-32 rounded-2xl border-4 border-gray-800 bg-gradient-to-br from-yellow-500 to-yellow-600 overflow-hidden">
                  {currentUser.profile_picture_url ? (
                    <img src={currentUser.profile_picture_url} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black text-5xl font-bold">
                      {currentUser.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-white mb-1">
                    {currentUser.full_name || currentUser.email?.split('@')[0]}
                  </h1>
                  <p className="text-gray-400">{currentUser.email}</p>
                </div>
              </div>

              <Button
                onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                variant={isEditing ? "outline" : "default"}
                className={isEditing ? "" : "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"}
              >
                {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                {isEditing ? 'Cancelar' : 'Editar Perfil'}
              </Button>
            </div>

            {isEditing ? (
              <div className="mt-8 space-y-4 max-w-2xl">
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Biografía"
                  className="bg-gray-900 text-white border-gray-700"
                />
                <Select value={editForm.religion} onValueChange={(value) => setEditForm({ ...editForm, religion: value })}>
                  <SelectTrigger className="bg-gray-900 text-white border-gray-700">
                    <SelectValue placeholder="Religión" />
                  </SelectTrigger>
                  <SelectContent>
                    {religions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Ubicación"
                  className="bg-gray-900 text-white border-gray-700"
                />
                <Input
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="Sitio web"
                  className="bg-gray-900 text-white border-gray-700"
                />
                <div>
                  <Input
                    placeholder="Intereses (Enter para agregar)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addInterest(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="bg-gray-900 text-white border-gray-700"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editForm.spiritual_interests.map((interest, idx) => (
                      <Badge key={idx} className="bg-yellow-600 text-black">
                        {interest}
                        <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeInterest(interest)} />
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button onClick={handleSaveProfile} className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {currentUser.bio && <p className="text-gray-300">{currentUser.bio}</p>}
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  {currentUser.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {currentUser.location}
                    </div>
                  )}
                  {currentUser.website && (
                    <a href={currentUser.website} target="_blank" className="flex items-center gap-1 text-yellow-500 hover:underline">
                      <Globe className="w-4 h-4" />
                      {currentUser.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
                {currentUser.spiritual_interests?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentUser.spiritual_interests.map((interest, idx) => (
                      <Badge key={idx} className="bg-yellow-600 text-black">{interest}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="mb-8">
          <NotificationSettings currentUser={currentUser} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stations" className="w-full">
          <TabsList className="bg-gray-800 mb-6">
            <TabsTrigger value="stations">Estaciones ({favoriteStations.length})</TabsTrigger>
            <TabsTrigger value="history">Historial ({listeningHistory.length})</TabsTrigger>
            <TabsTrigger value="events">Eventos ({registeredEvents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="stations">
            <Card className="bg-gray-800 border-yellow-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Estaciones Favoritas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favoriteStations.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No tienes estaciones favoritas</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {favoriteStations.map(station => (
                      <Card key={station.id} className="bg-gray-900 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Music className="w-10 h-10 text-yellow-500" />
                            <div>
                              <h4 className="text-white font-semibold">{station.name}</h4>
                              <p className="text-sm text-gray-400">{station.genre}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-gray-800 border-yellow-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  Historial de Escucha
                </CardTitle>
              </CardHeader>
              <CardContent>
                {listeningHistory.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No has escuchado programas aún</p>
                ) : (
                  <div className="space-y-3">
                    {listeningHistory.map((stat, idx) => (
                      <div key={idx} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">{stat.program?.title || 'Programa'}</h4>
                            <p className="text-sm text-gray-400 line-clamp-1">{stat.program?.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span>{Math.floor(stat.listen_duration_seconds / 60)} min</span>
                              {stat.completed && <Badge className="bg-green-600 text-white text-xs">Completado</Badge>}
                              {stat.liked && <Heart className="w-4 h-4 fill-red-500 text-red-500" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card className="bg-gray-800 border-yellow-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-yellow-500" />
                  Eventos Registrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {registeredEvents.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No estás registrado en eventos</p>
                ) : (
                  <div className="space-y-4">
                    {registeredEvents.map(event => {
                      const eventDate = new Date(event.event_date);
                      const isPast = eventDate < new Date();
                      
                      return (
                        <Card key={event.id} className="bg-gray-900 border-gray-700 hover:border-yellow-600 transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-white font-semibold">{event.title}</h4>
                                  {event.status === 'live' && (
                                    <Badge className="bg-red-500 text-white animate-pulse">EN VIVO</Badge>
                                  )}
                                  {isPast && <Badge className="bg-gray-600 text-white">Finalizado</Badge>}
                                </div>
                                <p className="text-sm text-gray-400 mb-2">{event.description}</p>
                                <div className="text-xs text-gray-500 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    {format(eventDate, "EEEE, d 'de' MMMM", { locale: es })}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    {format(eventDate, 'HH:mm', { locale: es })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}