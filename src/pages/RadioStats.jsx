import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Radio, Music, Users, PlayCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function RadioStats() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: myPrograms = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ['my-radio-programs', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      const programs = await base44.entities.RadioProgram.filter({ 
        created_by: currentUser.email 
      }, '-plays_count');
      return programs;
    },
    enabled: !!currentUser
  });

  const { data: allPrograms = [], isLoading: loadingAll } = useQuery({
    queryKey: ['all-radio-programs'],
    queryFn: () => base44.entities.RadioProgram.filter({ is_active: true })
  });

  const { data: stations = [] } = useQuery({
    queryKey: ['radio-stations'],
    queryFn: () => base44.entities.RadioStation.filter({ is_active: true })
  });

  // Calculate statistics
  const totalPlays = myPrograms.reduce((sum, p) => sum + (p.plays_count || 0), 0);
  const totalPlaylistAdds = myPrograms.reduce((sum, p) => sum + (p.playlist_adds_count || 0), 0);
  const avgPlaysPerProgram = myPrograms.length > 0 ? (totalPlays / myPrograms.length).toFixed(1) : 0;

  // Station statistics
  const stationStats = stations.map(station => {
    const stationPrograms = allPrograms.filter(p => p.station_id === station.id);
    const totalPlays = stationPrograms.reduce((sum, p) => sum + (p.plays_count || 0), 0);
    return {
      ...station,
      programCount: stationPrograms.length,
      totalPlays
    };
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

  if (!currentUser || loadingPrograms) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
        <div className="container mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-white">Estadísticas de Radio</h1>
          </div>
          <p className="text-gray-400">Análisis de rendimiento de tus programas</p>
        </div>

        <Tabs defaultValue="my-stats" className="space-y-6">
          <TabsList className="bg-gray-800 border border-yellow-600">
            <TabsTrigger value="my-stats">Mis Programas</TabsTrigger>
            <TabsTrigger value="stations">Por Estación</TabsTrigger>
            <TabsTrigger value="all">Global</TabsTrigger>
          </TabsList>

          {/* My Programs Stats */}
          <TabsContent value="my-stats" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <Radio className="w-4 h-4" />
                    Programas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{myPrograms.length}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" />
                    Reproducciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-500">{totalPlays}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    En Playlists
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-500">{totalPlaylistAdds}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Promedio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-500">{avgPlaysPerProgram}</p>
                  <p className="text-xs text-gray-500 mt-1">plays/programa</p>
                </CardContent>
              </Card>
            </div>

            {/* Programs List */}
            <Card className="bg-gray-800 border-yellow-600">
              <CardHeader>
                <CardTitle className="text-white">Rendimiento por Programa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myPrograms.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      No has creado programas aún
                    </p>
                  ) : (
                    myPrograms.map(program => (
                      <div
                        key={program.id}
                        className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-yellow-600 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-white font-semibold mb-1">{program.title}</h3>
                            {program.description && (
                              <p className="text-sm text-gray-400">{program.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <PlayCircle className="w-4 h-4 text-yellow-500" />
                            <span className="text-white font-semibold">{program.plays_count || 0}</span>
                            <span className="text-gray-400">reproducciones</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-green-500" />
                            <span className="text-white font-semibold">{program.playlist_adds_count || 0}</span>
                            <span className="text-gray-400">en playlists</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stations Stats */}
          <TabsContent value="stations" className="space-y-6">
            <Card className="bg-gray-800 border-yellow-600">
              <CardHeader>
                <CardTitle className="text-white">Estadísticas por Estación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stationStats.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      No hay estaciones disponibles
                    </p>
                  ) : (
                    stationStats.map(station => (
                      <div
                        key={station.id}
                        className="bg-gray-900 rounded-lg p-6 border border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">{station.name}</h3>
                            <Badge className="bg-yellow-600 text-black">
                              {genreLabels[station.genre]}
                            </Badge>
                          </div>
                          <Radio className="w-8 h-8 text-yellow-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Programas</p>
                            <p className="text-2xl font-bold text-white">{station.programCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Total Reproducciones</p>
                            <p className="text-2xl font-bold text-yellow-500">{station.totalPlays}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Global Stats */}
          <TabsContent value="all" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <Radio className="w-4 h-4" />
                    Total Programas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{allPrograms.length}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" />
                    Total Reproducciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-500">
                    {allPrograms.reduce((sum, p) => sum + (p.plays_count || 0), 0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Estaciones Activas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-500">{stations.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-800 border-yellow-600">
              <CardHeader>
                <CardTitle className="text-white">Top 10 Programas Más Escuchados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allPrograms
                    .sort((a, b) => (b.plays_count || 0) - (a.plays_count || 0))
                    .slice(0, 10)
                    .map((program, index) => (
                      <div
                        key={program.id}
                        className="flex items-center gap-4 bg-gray-900 rounded-lg p-4 border border-gray-700"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-600 text-black font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{program.title}</h4>
                          <p className="text-sm text-gray-400">
                            Por {program.created_by?.split('@')[0]}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-yellow-500">
                            {program.plays_count || 0}
                          </p>
                          <p className="text-xs text-gray-400">reproducciones</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}