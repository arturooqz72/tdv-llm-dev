import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import VideoCard from '@/components/video/VideoCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Video,
  Users,
  Heart,
  Edit,
  Save,
  X,
  MapPin,
  Globe,
  Loader2,
  Calendar,
  Music,
  Shield,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import PermissionGuard from '@/components/PermissionGuard';

const religions = [
  { value: 'lldm', label: 'LLDM' },
  { value: 'otra', label: 'Otro' },
  { value: 'prefiero_no_decir', label: 'Prefiero no decir' },
];

function getReligionLabel(religion, customReligion) {
  if (religion === 'lldm') return 'LLDM';
  if (religion === 'prefiero_no_decir') return 'Prefiero no decir';
  if (religion === 'otra') return customReligion?.trim() || 'Otro';
  return '';
}

export default function Profile() {
  const { user: currentUser, isLoadingAuth, refreshProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    location: '',
    website: '',
    religion: 'prefiero_no_decir',
    custom_religion: '',
  });

  const {
    data: profile,
    isLoading: loadingProfile,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['profile', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.id,
  });

  const {
    data: userVideos = [],
    isLoading: loadingVideos,
    refetch: refetchVideos,
  } = useQuery({
    queryKey: ['profile-videos', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('created_by', currentUser.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.email,
  });

  const {
    data: audioStats,
    isLoading: loadingAudios,
  } = useQuery({
    queryKey: ['profile-audios', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) {
        return { total: 0, active: 0 };
      }

      const [totalResult, activeResult] = await Promise.all([
        supabase
          .from('audios')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', currentUser.email),
        supabase
          .from('audios')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', currentUser.email)
          .eq('is_active', true),
      ]);

      if (totalResult.error) throw totalResult.error;
      if (activeResult.error) throw activeResult.error;

      return {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
      };
    },
    enabled: !!currentUser?.email,
  });

  useEffect(() => {
    if (!profile) return;

    setEditForm({
      full_name: profile.full_name || '',
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      religion: profile.religion || 'prefiero_no_decir',
      custom_religion: profile.custom_religion || '',
    });
  }, [profile]);

  const joinedText = useMemo(() => {
    const dateValue = profile?.created_at || currentUser?.createdAt;
    if (!dateValue) return null;

    try {
      return new Date(dateValue).toLocaleDateString();
    } catch {
      return null;
    }
  }, [profile?.created_at, currentUser?.createdAt]);

  const totalLikes = useMemo(() => {
    return userVideos.reduce((sum, v) => sum + Number(v.likes_count || 0), 0);
  }, [userVideos]);

  const religionLabel = useMemo(() => {
    return getReligionLabel(profile?.religion, profile?.custom_religion);
  }, [profile?.religion, profile?.custom_religion]);

  const handleSaveProfile = async () => {
    if (!currentUser?.id) return;

    setSaving(true);
    setMessage('');

    try {
      const normalizedReligion = editForm.religion || 'prefiero_no_decir';
      const normalizedCustomReligion =
        normalizedReligion === 'otra'
          ? editForm.custom_religion?.trim() || null
          : null;

      const payload = {
        full_name: editForm.full_name?.trim() || null,
        bio: editForm.bio?.trim() || null,
        location: editForm.location?.trim() || null,
        website: editForm.website?.trim() || null,
        religion: normalizedReligion,
        custom_religion: normalizedCustomReligion,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', currentUser.id);

      if (error) throw error;

      await refetchProfile();
      await refreshProfile();
      setIsEditing(false);
      setMessage('Perfil actualizado correctamente.');

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setMessage(`Error al actualizar perfil: ${error.message || 'Error inesperado.'}`);
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingAuth || loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <PermissionGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8">
            <div className="relative h-48 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500" />

            <div className="px-8 pb-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-20 gap-6">
                <div className="flex items-end gap-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                      {profile?.avatar_url || currentUser?.photoURL ? (
                        <img
                          src={profile?.avatar_url || currentUser?.photoURL}
                          alt="Perfil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold">
                          {(currentUser?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                      {profile?.full_name || currentUser?.name || currentUser?.email?.split('@')[0] || 'Usuario'}
                    </h1>
                    <p className="text-gray-600">{currentUser?.email}</p>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className="bg-purple-600 text-white">
                        {currentUser?.role === 'admin' ? 'Administrador' : 'Usuario'}
                      </Badge>

                      {joinedText && (
                        <Badge variant="outline" className="text-gray-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          {joinedText}
                        </Badge>
                      )}

                      {religionLabel && (
                        <Badge variant="outline" className="text-gray-600">
                          {religionLabel}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                      setEditForm({
                        full_name: profile?.full_name || '',
                        bio: profile?.bio || '',
                        location: profile?.location || '',
                        website: profile?.website || '',
                        religion: profile?.religion || 'prefiero_no_decir',
                        custom_religion: profile?.custom_religion || '',
                      });
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  variant={isEditing ? 'outline' : 'default'}
                  className={isEditing ? '' : 'bg-gradient-to-r from-purple-600 to-pink-600'}
                >
                  {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                  {isEditing ? 'Cancelar' : 'Editar Perfil'}
                </Button>
              </div>

              {message && (
                <div className="mt-6 p-4 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700">
                  {message}
                </div>
              )}

              {isEditing ? (
                <div className="mt-8 space-y-4 max-w-2xl">
                  <div>
                    <LabelText>Nombre completo</LabelText>
                    <Input
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      placeholder="Tu nombre"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <LabelText>Biografía</LabelText>
                    <Textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Comparte algo sobre ti..."
                      className="mt-2"
                      rows={4}
                    />
                  </div>

                  <div>
                    <LabelText>Religión o creencia</LabelText>
                    <select
                      value={editForm.religion}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          religion: e.target.value,
                          custom_religion:
                            e.target.value === 'otra' ? prev.custom_religion : '',
                        }))
                      }
                      className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {religions.map((religion) => (
                        <option key={religion.value} value={religion.value}>
                          {religion.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {editForm.religion === 'otra' && (
                    <div>
                      <LabelText>Escribe tu creencia</LabelText>
                      <Input
                        value={editForm.custom_religion}
                        onChange={(e) =>
                          setEditForm({ ...editForm, custom_religion: e.target.value })
                        }
                        placeholder="Escribe tu creencia"
                        className="mt-2"
                      />
                    </div>
                  )}

                  <div>
                    <LabelText>Ubicación</LabelText>
                    <Input
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="Ciudad, País"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <LabelText>Sitio web</LabelText>
                    <Input
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="https://..."
                      className="mt-2"
                    />
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {profile?.bio && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-gray-700">{profile.bio}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    {religionLabel && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Shield className="w-4 h-4" />
                        {religionLabel}
                      </div>
                    )}

                    {profile?.location && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {profile.location}
                      </div>
                    )}

                    {profile?.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-purple-600 hover:underline"
                      >
                        <Globe className="w-4 h-4" />
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mt-8">
                <StatBox
                  icon={Video}
                  label="Videos"
                  value={loadingVideos ? '...' : userVideos.length}
                />
                <StatBox
                  icon={Heart}
                  label="Me Gusta"
                  value={loadingVideos ? '...' : totalLikes}
                />
                <StatBox
                  icon={Users}
                  label="Seguidores"
                  value="0"
                />
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <MiniCard
              icon={Video}
              title="Videos subidos"
              value={loadingVideos ? '...' : userVideos.length}
            />
            <MiniCard
              icon={Music}
              title="Audios subidos"
              value={loadingAudios ? '...' : audioStats?.total ?? 0}
            />
            <MiniCard
              icon={Shield}
              title="Audios activos"
              value={loadingAudios ? '...' : audioStats?.active ?? 0}
            />
          </div>

          <div className="mb-8 bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              Actividad reciente
            </h2>

            {loadingVideos ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : userVideos.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>No hay actividad reciente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userVideos.slice(0, 6).map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-purple-200 flex items-center justify-center flex-shrink-0">
                      <Video className="w-6 h-6 text-purple-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {video.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>❤️ {video.likes_count || 0}</span>
                        <span>👁️ {video.views_count || 0}</span>
                      </div>
                    </div>

                    <Badge variant="outline">
                      {video.category || 'Video'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Todos los Videos</h2>

            {loadingVideos ? (
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
                  Comparte tu primer video con la comunidad
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    currentUser={currentUser}
                    onLikeUpdate={refetchVideos}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}

function LabelText({ children }) {
  return <label className="block text-sm font-medium text-gray-700">{children}</label>;
}

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
      <Icon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function MiniCard({ icon: Icon, title, value }) {
  return (
    <Card className="bg-white border-gray-100 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Icon className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
