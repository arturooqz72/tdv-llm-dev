import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import VideoCard from '@/components/video/VideoCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Users, Heart, Edit, Save, X, MapPin, Globe, Lock, Eye, Upload as UploadIcon, Loader2, Radio, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import NotificationSettings from '@/components/NotificationSettings';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import BannerEditor from '@/components/BannerEditor';

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

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [showBannerEditor, setShowBannerEditor] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    banner_url: '',
    profile_picture_url: '',
    religion: '',
    spiritual_interests: [],
    location: '',
    website: ''
  });
  const [privacyForm, setPrivacyForm] = useState({
    profile_visibility: 'public',
    show_videos: true,
    show_followers: true
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setEditForm({
          bio: user.bio || '',
          banner_url: user.banner_url || '',
          profile_picture_url: user.profile_picture_url || '',
          religion: user.religion || '',
          spiritual_interests: user.spiritual_interests || [],
          location: user.location || '',
          website: user.website || ''
        });
        setPrivacyForm({
          profile_visibility: user.profile_visibility || 'public',
          show_videos: user.show_videos !== false,
          show_followers: user.show_followers !== false
        });
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: userVideos = [], isLoading, refetch } = useQuery({
    queryKey: ['user-videos', currentUser?.email],
    queryFn: () => base44.entities.Video.filter({ created_by: currentUser.email }, '-created_date'),
    enabled: !!currentUser
  });

  const { data: userStreams = [] } = useQuery({
    queryKey: ['user-streams', currentUser?.email],
    queryFn: () => base44.entities.LiveStream.filter({ created_by: currentUser.email }, '-created_date', 10),
    enabled: !!currentUser
  });

  const { data: guestStreams = [] } = useQuery({
    queryKey: ['guest-streams', currentUser?.email],
    queryFn: async () => {
      const guests = await base44.entities.LiveStreamGuest.filter({ 
        guest_email: currentUser.email,
        status: 'accepted'
      });
      return guests;
    },
    enabled: !!currentUser
  });

  const handleBannerSave = async (file) => {
    setUploadingBanner(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditForm({ ...editForm, banner_url: file_url });
      await base44.auth.updateMe({ banner_url: file_url });
      const updatedUser = await base44.auth.me();
      setCurrentUser(updatedUser);
    } catch (error) {
      console.error('Error al subir banner:', error);
      alert('Error al subir el banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProfile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditForm({ ...editForm, profile_picture_url: file_url });
      await base44.auth.updateMe({ profile_picture_url: file_url });
      const updatedUser = await base44.auth.me();
      setCurrentUser(updatedUser);
    } catch (error) {
      console.error('Error al subir foto de perfil:', error);
      alert('Error al subir la foto de perfil');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await base44.auth.updateMe(editForm);
      const updatedUser = await base44.auth.me();
      setCurrentUser(updatedUser);
      
      // Sincronizar con PublicProfile
      const profiles = await base44.entities.PublicProfile.filter({ user_email: currentUser.email });
      if (profiles.length > 0) {
        await base44.entities.PublicProfile.update(profiles[0].id, {
          full_name: updatedUser.full_name,
          profile_picture_url: updatedUser.profile_picture_url,
          banner_url: updatedUser.banner_url,
          bio: updatedUser.bio,
          religion: updatedUser.religion,
          location: updatedUser.location,
          website: updatedUser.website,
          spiritual_interests: updatedUser.spiritual_interests,
          videos_count: userVideos?.length || 0,
          followers_count: updatedUser.followers_count || 0,
          last_seen: new Date().toISOString()
        });
      } else {
        await base44.entities.PublicProfile.create({
          user_email: currentUser.email,
          full_name: updatedUser.full_name,
          profile_picture_url: updatedUser.profile_picture_url,
          banner_url: updatedUser.banner_url,
          bio: updatedUser.bio,
          religion: updatedUser.religion,
          location: updatedUser.location,
          website: updatedUser.website,
          spiritual_interests: updatedUser.spiritual_interests,
          videos_count: userVideos?.length || 0,
          followers_count: updatedUser.followers_count || 0,
          last_seen: new Date().toISOString()
        });
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      await base44.auth.updateMe(privacyForm);
      const updatedUser = await base44.auth.me();
      setCurrentUser(updatedUser);
      setShowPrivacySettings(false);
      alert('Configuración de privacidad actualizada');
    } catch (error) {
      console.error('Error al actualizar privacidad:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  const stats = [
    { label: 'Videos', value: userVideos.length, icon: Video },
    { label: 'Seguidores', value: currentUser.followers_count || 0, icon: Users },
    { label: 'Me Gusta', value: userVideos.reduce((sum, v) => sum + (v.likes_count || 0), 0), icon: Heart }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-6">
      <BannerEditor
        isOpen={showBannerEditor}
        onClose={() => setShowBannerEditor(false)}
        onSave={handleBannerSave}
      />
      
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8">
          <div className="relative h-48 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500">
            {currentUser.banner_url && (
              <img 
                src={currentUser.banner_url} 
                alt="Banner" 
                className="w-full h-full object-cover"
              />
            )}
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Button
                  onClick={() => setShowBannerEditor(true)}
                  disabled={uploadingBanner}
                  className="bg-white/90 hover:bg-white text-black"
                >
                  {uploadingBanner ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Cambiar Banner
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-20 gap-6">
              <div className="flex items-end gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                    {currentUser.profile_picture_url ? (
                      <img 
                        src={currentUser.profile_picture_url} 
                        alt="Perfil" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold">
                        {currentUser.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 w-10 h-10 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center justify-center cursor-pointer shadow-lg transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePictureUpload}
                        disabled={uploadingProfile}
                      />
                      {uploadingProfile ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <UploadIcon className="w-5 h-5 text-white" />
                      )}
                    </label>
                  )}
                </div>
                
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    {currentUser.full_name || currentUser.email?.split('@')[0]}
                  </h1>
                  <p className="text-gray-600">{currentUser.email}</p>
                  {currentUser.religion && (
                    <p className="text-sm text-purple-600 font-medium mt-1">
                      {religions.find(r => r.value === currentUser.religion)?.label}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowPrivacySettings(!showPrivacySettings)}
                  variant="outline"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Privacidad
                </Button>
                <Button
                  onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                  variant={isEditing ? "outline" : "default"}
                  className={isEditing ? "" : "bg-gradient-to-r from-purple-600 to-pink-600"}
                >
                  {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                  {isEditing ? 'Cancelar' : 'Editar Perfil'}
                </Button>
              </div>
            </div>

            {/* Privacy Settings */}
            {showPrivacySettings && (
              <div className="mt-8 max-w-2xl bg-gray-50 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold mb-4">Configuración de Privacidad</h3>
                
                <div>
                  <Label>Visibilidad del Perfil</Label>
                  <Select 
                    value={privacyForm.profile_visibility} 
                    onValueChange={(value) => setPrivacyForm({ ...privacyForm, profile_visibility: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Público - Todos pueden ver</SelectItem>
                      <SelectItem value="followers">Seguidores - Solo quienes me siguen</SelectItem>
                      <SelectItem value="private">Privado - Solo yo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Mostrar mis videos</Label>
                  <Switch
                    checked={privacyForm.show_videos}
                    onCheckedChange={(checked) => setPrivacyForm({ ...privacyForm, show_videos: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Mostrar seguidores</Label>
                  <Switch
                    checked={privacyForm.show_followers}
                    onCheckedChange={(checked) => setPrivacyForm({ ...privacyForm, show_followers: checked })}
                  />
                </div>

                <Button onClick={handleSavePrivacy} className="w-full bg-purple-600">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Configuración
                </Button>
              </div>
            )}

            {/* Edit Form */}
            {isEditing ? (
              <div className="mt-8 space-y-4 max-w-2xl">
                <div>
                  <Label>Biografía</Label>
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Comparte algo sobre ti..."
                    className="mt-2"
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label>Religión/Creencia</Label>
                  <Select 
                    value={editForm.religion} 
                    onValueChange={(value) => setEditForm({ ...editForm, religion: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecciona tu religión" />
                    </SelectTrigger>
                    <SelectContent>
                      {religions.map((religion) => (
                        <SelectItem key={religion.value} value={religion.value}>
                          {religion.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Intereses Espirituales</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Ej: Meditación, Oración..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addInterest(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editForm.spiritual_interests.map((interest, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {interest}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeInterest(interest)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Ubicación</Label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="Ciudad, País"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Sitio Web</Label>
                  <Input
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="https://..."
                    className="mt-2"
                  />
                </div>

                <Button 
                  onClick={handleSaveProfile}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {currentUser.bio && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-700">{currentUser.bio}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm">
                  {currentUser.location && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {currentUser.location}
                    </div>
                  )}
                  {currentUser.website && (
                    <a 
                      href={currentUser.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-purple-600 hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      {currentUser.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>

                {currentUser.spiritual_interests?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Intereses Espirituales</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.spiritual_interests.map((interest, idx) => (
                        <Badge key={idx} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="mb-8">
          <NotificationSettings currentUser={currentUser} />
        </div>

        {/* Recent Activity */}
        <div className="mb-8 bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            Actividad Reciente
          </h2>
          
          <div className="space-y-4">
            {/* Recent Streams */}
            {userStreams.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-red-500" />
                  Transmisiones Creadas
                </h3>
                <div className="space-y-2">
                  {userStreams.slice(0, 5).map((stream) => (
                    <div key={stream.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className={`w-2 h-2 rounded-full ${stream.is_live ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{stream.title}</p>
                        <p className="text-xs text-gray-500">
                          {stream.is_live ? '🔴 En vivo ahora' : `${stream.viewers_count || 0} espectadores`}
                        </p>
                      </div>
                      {stream.is_live && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                          LIVE
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guest Streams */}
            {guestStreams.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Participado como Invitado
                </h3>
                <div className="space-y-2">
                  {guestStreams.slice(0, 3).map((guest) => (
                    <div key={guest.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Users className="w-4 h-4 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">
                          Invitado en transmisión - {guest.created_date && new Date(guest.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Videos */}
            {userVideos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Video className="w-5 h-5 text-purple-500" />
                  Videos Recientes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {userVideos.slice(0, 6).map((video) => (
                    <div key={video.id} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-purple-200 flex items-center justify-center flex-shrink-0">
                        <Video className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{video.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>❤️ {video.likes_count || 0}</span>
                          <span>👁️ {video.views_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userVideos.length === 0 && userStreams.length === 0 && guestStreams.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>No hay actividad reciente</p>
              </div>
            )}
          </div>
        </div>

        {/* User Videos */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Todos los Videos</h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="aspect-[9/16] rounded-2xl" />
              ))}
            </div>
          ) : userVideos.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <Video className="w-12 h-12 text-purple-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                No has subido videos aún
              </h3>
              <p className="text-gray-600">
                Comparte tu primera reflexión con la comunidad
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  currentUser={currentUser}
                  onLikeUpdate={refetch}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}