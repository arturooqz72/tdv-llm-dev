import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User as UserIcon,
  Edit,
  Save,
  X,
  MapPin,
  Globe,
  Calendar,
  Music,
  Video,
  Loader2,
  Shield,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PermissionGuard from '@/components/PermissionGuard';

export default function UserProfile() {
  const { user: currentUser, isLoadingAuth, refreshProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    location: '',
    website: '',
  });

  const {
    data: profile,
    isLoading: loadingProfile,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['profile-page', currentUser?.id],
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

  const { data: userStats, isLoading: loadingStats } = useQuery({
    queryKey: ['profile-stats', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) {
        return {
          totalVideos: 0,
          totalAudios: 0,
          activeAudios: 0,
        };
      }

      const [
        totalVideosResult,
        totalAudiosResult,
        activeAudiosResult,
      ] = await Promise.all([
        supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', currentUser.email),
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

      if (totalVideosResult.error) throw totalVideosResult.error;
      if (totalAudiosResult.error) throw totalAudiosResult.error;
      if (activeAudiosResult.error) throw activeAudiosResult.error;

      return {
        totalVideos: totalVideosResult.count || 0,
        totalAudios: totalAudiosResult.count || 0,
        activeAudios: activeAudiosResult.count || 0,
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
    });
  }, [profile]);

  const joinedDate = useMemo(() => {
    const rawDate = profile?.created_at || currentUser?.createdAt;
    if (!rawDate) return null;

    try {
      return format(new Date(rawDate), "d 'de' MMMM yyyy", { locale: es });
    } catch {
      return null;
    }
  }, [profile?.created_at, currentUser?.createdAt]);

  const handleSaveProfile = async () => {
    if (!currentUser?.id) return;

    setSaving(true);
    setSaveMessage('');

    try {
      const payload = {
        full_name: editForm.full_name?.trim() || null,
        bio: editForm.bio?.trim() || null,
        location: editForm.location?.trim() || null,
        website: editForm.website?.trim() || null,
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
      setSaveMessage('Perfil actualizado correctamente.');

      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setSaveMessage(`Error al guardar: ${error.message || 'Error inesperado.'}`);
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingAuth || loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-800 rounded-3xl border-2 border-yellow-600 overflow-hidden mb-8">
            <div className="relative h-40 md:h-48 bg-gradient-to-r from-yellow-600 to-yellow-500">
              <div className="absolute inset-0 bg-black/10" />
            </div>

            <div className="px-8 pb-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 gap-6">
                <div className="flex items-end gap-6">
                  <div className="w-32 h-32 rounded-2xl border-4 border-gray-800 bg-gradient-to-br from-yellow-500 to-yellow-600 overflow-hidden flex items-center justify-center">
                    {profile?.avatar_url || currentUser?.photoURL ? (
                      <img
                        src={profile?.avatar_url || currentUser?.photoURL}
                        alt="Perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black text-5xl font-bold">
                        {(profile?.email || currentUser?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <h1 className="text-3xl font-bold text-white mb-1">
                      {profile?.full_name || currentUser?.name || currentUser?.email?.split('@')[0] || 'Usuario'}
                    </h1>
                    <p className="text-gray-400">{profile?.email || currentUser?.email}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className="bg-yellow-600 text-black">
                        {currentUser?.role === 'admin' ? 'Administrador' : 'Usuario'}
                      </Badge>

                      {joinedDate && (
                        <Badge variant="outline" className="text-gray-300 border-gray-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          {joinedDate}
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
                      });
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  variant={isEditing ? 'outline' : 'default'}
                  className={isEditing ? '' : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'}
                >
                  {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                  {isEditing ? 'Cancelar' : 'Editar Perfil'}
                </Button>
              </div>

              {saveMessage && (
                <div className="mt-6 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-300">
                  {saveMessage}
                </div>
              )}

              {isEditing ? (
                <div className="mt-8 space-y-4 max-w-2xl">
                  <Input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    placeholder="Nombre completo"
                    className="bg-gray-900 text-white border-gray-700"
                  />

                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Biografía"
                    className="bg-gray-900 text-white border-gray-700"
                    rows={4}
                  />

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

                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {profile?.bio && <p className="text-gray-300">{profile.bio}</p>}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    {profile?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {profile.location}
                      </div>
                    )}

                    {profile?.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-yellow-500 hover:underline"
                      >
                        <Globe className="w-4 h-4" />
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Videos subidos"
              value={loadingStats ? '...' : userStats?.totalVideos ?? 0}
              icon={Video}
            />
            <StatCard
              title="Audios subidos"
              value={loadingStats ? '...' : userStats?.totalAudios ?? 0}
              icon={Music}
            />
            <StatCard
              title="Audios activos"
              value={loadingStats ? '...' : userStats?.activeAudios ?? 0}
              icon={Shield}
            />
          </div>

          <Tabs defaultValue="resumen" className="w-full">
            <TabsList className="bg-gray-800 mb-6">
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="actividad">Actividad</TabsTrigger>
              <TabsTrigger value="cuenta">Cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="resumen">
              <Card className="bg-gray-800 border-yellow-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-yellow-500" />
                    Resumen del Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-gray-300">
                  <p>
                    Aquí ya quedó limpio el perfil principal del usuario y conectado a Supabase.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoBox label="Correo" value={profile?.email || currentUser?.email || '—'} />
                    <InfoBox label="Rol" value={currentUser?.role || 'user'} />
                    <InfoBox label="Nombre" value={profile?.full_name || currentUser?.name || '—'} />
                    <InfoBox label="Ubicación" value={profile?.location || '—'} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actividad">
              <Card className="bg-gray-800 border-yellow-600">
                <CardHeader>
                  <CardTitle className="text-white">Actividad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-gray-300">
                  <p>Esta sección ya no depende de Base44.</p>
                  <p>
                    Más adelante aquí podemos conectar historial real, favoritos, eventos o estadísticas más avanzadas desde Supabase.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cuenta">
              <Card className="bg-gray-800 border-yellow-600">
                <CardHeader>
                  <CardTitle className="text-white">Cuenta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-gray-300">
                  <p>Estado de autenticación: activo</p>
                  <p>ID de usuario: {currentUser?.id || '—'}</p>
                  <p>Correo: {currentUser?.email || '—'}</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PermissionGuard>
  );
}

function StatCard({ title, value, icon: Icon }) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-white font-medium break-words">{value}</p>
    </div>
  );
}
