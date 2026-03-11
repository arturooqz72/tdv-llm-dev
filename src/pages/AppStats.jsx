import React, { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Users,
  Video,
  TrendingUp,
  Activity,
  MessageCircle,
  Music
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#EAB308', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function AppStats() {
  const { user: currentUser, isLoadingAuth } = useAuth();
  const [limit] = useState(1000);

  const { data: videos = [], isLoading: loadingVideos } = useQuery({
    queryKey: ['stats-videos', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['stats-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['stats-comments', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser
  });

  const { data: audios = [], isLoading: loadingAudios } = useQuery({
    queryKey: ['stats-audios', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audios')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser
  });

  const isLoading =
    isLoadingAuth || loadingVideos || loadingUsers || loadingComments || loadingAudios;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <Skeleton className="w-40 h-40 rounded-3xl" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-6">
        <Card className="bg-gray-800 border-gray-700 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-white text-xl font-semibold mb-2">Acceso restringido</p>
            <p className="text-gray-400">
              Esta sección es solo para administradores.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalUsers = users.length;
  const totalVideos = videos.length;
  const totalComments = comments.length;
  const totalAudios = audios.length;

  const totalVideoViews = videos.reduce(
    (sum, v) => sum + Number(v.views_count || 0),
    0
  );

  const totalVideoLikes = videos.reduce(
    (sum, v) => sum + Number(v.likes_count || 0),
    0
  );

  const totalActiveAudios = audios.filter((a) => a.is_active).length;

  const usersByRole = useMemo(() => {
    const counts = {};
    users.forEach((user) => {
      const role = user.role || 'user';
      counts[role] = (counts[role] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [users]);

  const videosByReligion = useMemo(() => {
    const counts = {};
    videos.forEach((video) => {
      const religion = video.religion || 'sin_categoria';
      counts[religion] = (counts[religion] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);
  }, [videos]);

  const topVideos = useMemo(() => {
    return [...videos]
      .sort((a, b) => Number(b.views_count || 0) - Number(a.views_count || 0))
      .slice(0, 5)
      .map((video) => ({
        title:
          video.title && video.title.length > 30
            ? `${video.title.substring(0, 30)}...`
            : video.title || 'Sin título',
        vistas: Number(video.views_count || 0)
      }));
  }, [videos]);

  const contentTotals = [
    { tipo: 'Usuarios', total: totalUsers },
    { tipo: 'Videos', total: totalVideos },
    { tipo: 'Comentarios', total: totalComments },
    { tipo: 'Audios', total: totalAudios }
  ];

  const engagementTotals = [
    { tipo: 'Vistas', total: totalVideoViews },
    { tipo: 'Likes', total: totalVideoLikes },
    { tipo: 'Comentarios', total: totalComments },
    { tipo: 'Audios Activos', total: totalActiveAudios }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Estadísticas de la App</h1>
          <p className="text-gray-400">
            Panel general con métricas actuales de usuarios, videos, comentarios y audios
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm">Usuarios Registrados</p>
                  <p className="text-3xl font-bold text-white">{totalUsers.toLocaleString()}</p>
                  <p className="text-blue-200 text-xs mt-1">Perfiles en Supabase</p>
                </div>
                <Users className="w-12 h-12 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm">Videos</p>
                  <p className="text-3xl font-bold text-white">{totalVideos.toLocaleString()}</p>
                  <p className="text-purple-200 text-xs mt-1">
                    {totalVideoViews.toLocaleString()} vistas totales
                  </p>
                </div>
                <Video className="w-12 h-12 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm">Comentarios</p>
                  <p className="text-3xl font-bold text-white">{totalComments.toLocaleString()}</p>
                  <p className="text-green-200 text-xs mt-1">Tabla comments</p>
                </div>
                <MessageCircle className="w-12 h-12 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-300 text-sm">Audios</p>
                  <p className="text-3xl font-bold text-white">{totalAudios.toLocaleString()}</p>
                  <p className="text-yellow-200 text-xs mt-1">
                    {totalActiveAudios.toLocaleString()} activos
                  </p>
                </div>
                <Music className="w-12 h-12 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="bg-gray-800">
            <TabsTrigger value="content">Contenido</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-500" />
                    Totales por Tipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={contentTotals}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="tipo" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151'
                        }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Bar dataKey="total" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Engagement General
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={engagementTotals}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="tipo" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151'
                        }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Bar dataKey="total" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Video className="w-5 h-5 text-purple-500" />
                    Videos Más Vistos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topVideos} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9CA3AF" />
                      <YAxis
                        dataKey="title"
                        type="category"
                        stroke="#9CA3AF"
                        width={150}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151'
                        }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Bar dataKey="vistas" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                    Videos por Religión
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={videosByReligion}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151'
                        }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Bar dataKey="cantidad" fill="#EAB308" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-500" />
                    Usuarios por Rol
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={usersByRole}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        dataKey="value"
                      >
                        {usersByRole.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Resumen General</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <span className="text-gray-300">Usuarios registrados</span>
                      <span className="text-2xl font-bold text-white">{totalUsers}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <span className="text-gray-300">Likes totales en videos</span>
                      <span className="text-2xl font-bold text-white">{totalVideoLikes}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <span className="text-gray-300">Promedio vistas por video</span>
                      <span className="text-2xl font-bold text-white">
                        {totalVideos > 0 ? (totalVideoViews / totalVideos).toFixed(1) : 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <span className="text-gray-300">Promedio comentarios por video</span>
                      <span className="text-2xl font-bold text-white">
                        {totalVideos > 0 ? (totalComments / totalVideos).toFixed(1) : 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
