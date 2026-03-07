import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Radio, Users, Globe, Smartphone, TrendingUp, AlertTriangle, Edit, Power, MessageSquare, Trash2, Search, X } from 'lucide-react';
import ProgramEditor from '@/components/radio/ProgramEditor';
import PollManager from '@/components/radio/PollManager';
import QAManager from '@/components/radio/QAManager';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export default function RadioDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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

  const { data: myPrograms = [] } = useQuery({
    queryKey: ['my-programs'],
    queryFn: () => base44.entities.RadioProgram.filter({ created_by: currentUser?.email }),
    enabled: !!currentUser
  });

  const { data: listenerStats = [] } = useQuery({
    queryKey: ['listener-stats', selectedProgram?.id],
    queryFn: () => base44.entities.RadioListenerStats.filter({ 
      program_id: selectedProgram.id 
    }),
    enabled: !!selectedProgram
  });

  const { data: conflicts = [] } = useQuery({
    queryKey: ['my-conflicts'],
    queryFn: async () => {
      const allConflicts = await base44.entities.ScheduleConflict.filter({ resolved: false });
      return allConflicts.filter(c => 
        myPrograms.some(p => p.id === c.program1_id || p.id === c.program2_id)
      );
    },
    enabled: myPrograms.length > 0
  });

  const toggleProgramMutation = useMutation({
    mutationFn: async ({ programId, isActive }) => {
      await base44.entities.RadioProgram.update(programId, { is_active: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-programs'] });
    }
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (programId) => {
      await base44.entities.RadioProgram.delete(programId);
    },
    onSuccess: () => {
      if (selectedProgram?.id === deleteProgramMutation.variables) {
        setSelectedProgram(null);
      }
      queryClient.invalidateQueries({ queryKey: ['my-programs'] });
    }
  });

  // Calculate statistics
  const totalListeners = listenerStats.length;
  const avgListenTime = listenerStats.length > 0
    ? (listenerStats.reduce((acc, stat) => acc + (stat.listen_duration_minutes || 0), 0) / listenerStats.length).toFixed(1)
    : 0;

  // Location data
  const locationData = listenerStats.reduce((acc, stat) => {
    const country = stat.location_country || 'Desconocido';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});
  const locationChartData = Object.entries(locationData).map(([name, value]) => ({ name, value }));

  // Age range data
  const ageData = listenerStats.reduce((acc, stat) => {
    const age = stat.age_range || 'unknown';
    acc[age] = (acc[age] || 0) + 1;
    return acc;
  }, {});
  const ageChartData = Object.entries(ageData).map(([name, value]) => ({ name, value }));

  // Device type data
  const deviceData = listenerStats.reduce((acc, stat) => {
    const device = stat.device_type || 'unknown';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});
  const deviceChartData = Object.entries(deviceData).map(([name, value]) => ({ 
    name: name === 'mobile' ? 'Móvil' : name === 'desktop' ? 'Escritorio' : 'Tablet', 
    value 
  }));

  // Filtrar programas por búsqueda
  const filteredPrograms = myPrograms.filter(program =>
    program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="container mx-auto px-6 py-12">
          <Card className="bg-gray-800 border-yellow-600">
            <CardContent className="p-12 text-center">
              <Radio className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Inicia sesión para ver tu dashboard
              </h3>
              <p className="text-gray-400 mb-6">
                Necesitas una cuenta para gestionar tus programas de radio
              </p>
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                className="bg-yellow-500 text-black hover:bg-yellow-600"
              >
                Iniciar Sesión
              </Button>
            </CardContent>
          </Card>
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
            <Radio className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-white">Dashboard de Creador</h1>
          </div>
          <p className="text-gray-400">Gestiona tus programas y analiza el rendimiento</p>
        </div>

        {/* Conflicts Alert */}
        {conflicts.length > 0 && (
          <Card className="bg-red-900/20 border-red-600 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-white font-medium">Tienes {conflicts.length} conflicto(s) de programación</p>
                  <p className="text-sm text-red-400">Revisa tus programas para evitar superposiciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Program Selector */}
        <div className="grid gap-6 mb-8">
          <Card className="bg-gray-800 border-yellow-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Mis Programas</CardTitle>
                <div className="text-sm text-gray-400">
                  {filteredPrograms.length} de {myPrograms.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-8 bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Programs Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPrograms.length > 0 ? (
                  filteredPrograms.map(program => (
                  <div
                    key={program.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedProgram?.id === program.id
                        ? 'bg-yellow-600 border-yellow-500'
                        : 'bg-gray-900 border-gray-700 hover:border-yellow-600'
                    }`}
                    onClick={() => setSelectedProgram(program)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-medium">{program.title}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProgram(program);
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProgramMutation.mutate({ programId: program.id, isActive: program.is_active });
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Power className={`w-3 h-3 ${program.is_active ? 'text-green-500' : 'text-red-500'}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`¿Seguro que deseas eliminar "${program.title}"?`)) {
                              deleteProgramMutation.mutate(program.id);
                            }
                          }}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-gray-400">Reproducciones: {program.plays_count || 0}</p>
                      <p className="text-gray-400">
                        Estado: {program.is_active ? '✓ Activo' : '✗ Inactivo'}
                      </p>
                      {program.auto_broadcast && (
                        <p className="text-yellow-400">🤖 Transmisión automática</p>
                      )}
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-400">
                      {searchTerm ? 'No se encontraron programas con ese término' : 'No tienes programas todavía'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedProgram ? (
          <Tabs defaultValue="stats" className="space-y-6">
            <TabsList className="bg-gray-800 border border-yellow-600">
              <TabsTrigger value="stats" className="data-[state=active]:bg-yellow-600">
                <TrendingUp className="w-4 h-4 mr-2" />
                Estadísticas
              </TabsTrigger>
              <TabsTrigger value="polls" className="data-[state=active]:bg-yellow-600">
                <MessageSquare className="w-4 h-4 mr-2" />
                Encuestas
              </TabsTrigger>
              <TabsTrigger value="qa" className="data-[state=active]:bg-yellow-600">
                <Users className="w-4 h-4 mr-2" />
                Preguntas y Respuestas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="space-y-6">
              {/* Overview Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-gray-800 border-yellow-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-yellow-500" />
                      Total Oyentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-yellow-500">{totalListeners}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-yellow-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Radio className="w-5 h-5 text-yellow-500" />
                      Tiempo Promedio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-yellow-500">{avgListenTime} min</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-yellow-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-yellow-500" />
                      Reproducciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-yellow-500">{selectedProgram.plays_count || 0}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-yellow-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-yellow-500" />
                      Ubicación de Oyentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {locationChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={locationChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {locationChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-400 text-center py-12">No hay datos disponibles</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-yellow-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-yellow-500" />
                      Rango de Edad
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ageChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ageChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="name" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip />
                          <Bar dataKey="value" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-400 text-center py-12">No hay datos disponibles</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-yellow-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-yellow-500" />
                      Tipo de Dispositivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {deviceChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={deviceChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {deviceChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-400 text-center py-12">No hay datos disponibles</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="polls">
              <PollManager programId={selectedProgram.id} />
            </TabsContent>

            <TabsContent value="qa">
              <QAManager programId={selectedProgram.id} currentUser={currentUser} />
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="bg-gray-800 border-yellow-600">
            <CardContent className="p-12 text-center">
              <Radio className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Selecciona un programa
              </h3>
              <p className="text-gray-400">
                Elige uno de tus programas para ver estadísticas detalladas
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {editingProgram && (
        <ProgramEditor
          program={editingProgram}
          onClose={() => setEditingProgram(null)}
          onSave={() => {
            setEditingProgram(null);
            queryClient.invalidateQueries({ queryKey: ['my-programs'] });
          }}
        />
      )}
    </div>
  );
}