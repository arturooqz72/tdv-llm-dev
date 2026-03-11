import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Users,
  Eye,
  Video,
  Radio,
  TrendingUp,
  Activity,
  Clock,
  Calendar
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['#EAB308', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function AppStats() {
  const [currentUser, setCurrentUser] = useState(null);
  const [dateRange, setDateRange] = useState(7); // últimos 7 días por defecto

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        if (user.role !== 'admin') {
          window.location.href = '/';
          return;
        }
        setCurrentUser(user);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  // Visitas a páginas
  const { data: pageVisits = [] } = useQuery({
    queryKey: ['page-visits', dateRange],
    queryFn: async () => {
      const visits = await base44.entities.PageVisit.list('-created_date', 10000);
      const cutoffDate = subDays(new Date(), dateRange);
      return visits.filter((v) => new Date(v.created_date) >= cutoffDate);
    },
    enabled: !!currentUser,
    refetchInterval: 300000 // cada 5 minutos
  });

  // Videos
  const { data: videos = [] } = useQuery({
    queryKey: ['videos-stats'],
    queryFn: () => base44.entities.Video.list('-views_count', 100),
    enabled: !!currentUser
  });

  // Programas de radio
  const { data: radioPrograms = [] } = useQuery({
    queryKey: ['radio-programs-stats'],
    queryFn: () => base44.entities.RadioProgram.list('-plays_count', 100),
    enabled: !!currentUser
  });

  // Usuarios
  const { data: users = [] } = useQuery({
    queryKey: ['users-stats'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser
  });

  // Comentarios
  const { data: comments = [] } = useQuery({
    queryKey: ['comments-stats'],
    queryFn: () => base44.entities.Comment.list('-created_date', 1000),
    enabled: !!currentUser
  });

  // Likes
  const { data: likes = [] } = useQuery({
    queryKey: ['likes-stats'],
    queryFn: () => base44.entities.Like.list('-created_date', 1000),
    enabled: !!currentUser
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <Skeleton className="w-32 h-32 rounded-full" />
      </div>
    );
  }

  // Cálculos de métricas
  const totalVisits = pageVisits.length;
  const uniqueUsers = new Set(pageVisits.filter((v) => v.user_email).map((v) => v.user_email)).size;
  const uniqueSessions = new Set(pageVisits.map((v) => v.session_id)).size;
  const totalVideos = videos.length;
  const totalVideoViews = videos.reduce((sum, v) => sum + (v.views_count || 0), 0);
  const totalRadioPlays = radioPrograms.reduce((sum, p) => sum + (p.plays_count || 0), 0);
  const totalUsers = users.length;
  const totalComments = comments.length;
  const totalLikes = likes.length;

  // Páginas más visitadas
  const pageVisitCounts = {};
  pageVisits.forEach((v) => {
    pageVisitCounts[v.page_name] = (pageVisitCounts[v.page_name] || 0) + 1;
  });

  const topPages = Object.entries(pageVisitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, visitas: count }));

  // Visitas por día
  const visitsByDay = {};
  pageVisits.forEach((v) => {
    const day = format(new Date(v.created_date), 'dd MMM', { locale: es });
    visitsByDay[day] = (visitsByDay[day] || 0) + 1;
  });

  const visitsTimeline = Object.entries(visitsByDay)
    .map(([dia, visitas]) => ({ dia, visitas }))
    .reverse()
    .slice(0, 7)
    .reverse();

  // Videos más vistos
  const topVideos = videos
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 5)
    .map((v) => ({
      title: v.title.length > 30 ? v.title.substring(0, 30) + '...' : v.title,
      vistas: v.views_count || 0
    }));

  // Programas más reproducidos
  const topPrograms = radioPrograms
    .sort((a, b) => (b.plays_count || 0) - (a.plays_count || 0))
    .slice(0, 5)
    .map((p) => ({
      title: p.title.length > 30 ? p.title.substring(0, 30) + '...' : p.title,
      reproducciones: p.plays_count || 0
    }));

  // Engagement por tipo de contenido
  const contentEngagement = [
    { tipo: 'Videos', interacciones: totalVideoViews + totalLikes },
    { tipo: 'Radio', interacciones: totalRadioPlays },
    { tipo: 'Comentarios', interacciones: totalComments },
    { tipo: 'Likes', interacciones: totalLikes }
  ];

  // Usuarios registrados vs visitantes
  const userTypes = [
    { name: 'Usuarios Registrados', value: uniqueUsers },
    { name: 'Visitantes', value: uniqueSessions - uniqueUsers }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Estadísticas de la App</h1>
          <p className="text-gray-400">Panel de métricas y análisis de uso</p>

          {/* Date Range Selector */}
          <div className="flex gap-2 mt-4">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === days
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Últimos {days} días
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm">Visitas Totales</p>
                  <p className="text-3xl font-bold text-white">{totalVisits.toLocaleString()}</p>
                  <p className="text-blue-200 text-xs mt-1">{uniqueSessions} sesiones únicas</p>
                </div>
                <Eye className="w-12 h-12 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm">Usuarios Activos</p>
                  <p className="text-3xl font-bold text-white">{uniqueUsers.toLocaleString()}</p>
                  <p className="text-green-200 text-xs mt-1">{totalUsers} registrados</p>
                </div>
                <Users className="w-12 h-12 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm">Vistas de Videos</p>
                  <p className="text-3xl font-bold text-white">{totalVideoViews.toLocaleString()}</p>
                  <p className="text-purple-200 text-xs mt-1">{totalVideos} videos totales</p>
                </div>
                <Video className="w-12 h-12 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-300 text-sm">Reproducciones Radio</p>
                  <p className="text-3xl font-bold text-white">{totalRadioPlays.toLocaleString()}</p>
                  <p className="text-yellow-200 text-xs mt-1">{radioPrograms.length} programas</p>
                </div>
                <Radio className="w-12 h-12 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="visits" className="space-y-6">
          <TabsList className="bg-gray-800">
            <TabsTrigger value="visits">Visitas</TabsTrigger>
            <TabsTrigger value="content">Contenido</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="visits" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Visitas por día */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                    Visitas por Día
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={visitsTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="dia" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Line type="monotone" dataKey="visitas" stroke="#EAB308" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Páginas más visitadas */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Páginas Más Visitadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topPages}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Bar dataKey="visitas" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Usuarios registrados vs visitantes */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-500" />
                    Usuarios Registrados vs Visitantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={userTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Videos más vistos */}
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
                      <YAxis dataKey="title" type="category" stroke="#9CA3AF" width={150} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Bar dataKey="vistas" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Programas más reproducidos */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-yellow-500" />
                    Programas Más Reproducidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topPrograms} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9CA3AF" />
                      <YAxis dataKey="title" type="category" stroke="#9CA3AF" width={150} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Bar dataKey="reproducciones" fill="#EAB308" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Engagement por tipo */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Interacciones por Tipo de Contenido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={contentEngagement}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="tipo" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Bar dataKey="interacciones" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Métricas de engagement */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Métricas de Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <span className="text-gray-300">Total Comentarios</span>
                      <span className="text-2xl font-bold text-white">{totalComments}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <span className="text-gray-300">Total Likes</span>
                      <span className="text-2xl font-bold text-white">{totalLikes}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <span className="text-gray-300">Promedio Likes por Video</span>
                      <span className="text-2xl font-bold text-white">
                        {totalVideos > 0 ? (totalLikes / totalVideos).toFixed(1) : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <span className="text-gray-300">Promedio Vistas por Video</span>
                      <span className="text-2xl font-bold text-white">
                        {totalVideos > 0 ? (totalVideoViews / totalVideos).toFixed(1) : 0}
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
