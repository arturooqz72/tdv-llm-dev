import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users as UsersIcon, Zap, MessageCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import FollowButton from '@/components/FollowButton';
import OnlineIndicator from '@/components/OnlineIndicator';

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

export default function Users() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // Update last_seen
        await base44.auth.updateMe({
          last_seen: new Date().toISOString()
        });
      } catch (error) {
        console.log('Usuario no autenticado');
      }
    };
    loadUser();

    // Update last_seen every 2 minutes
    const interval = setInterval(async () => {
      try {
        await base44.auth.updateMe({
          last_seen: new Date().toISOString()
        });
      } catch (error) {
        console.log('Error updating last_seen');
      }
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  const { data: allUsers = [], isLoading, refetch } = useQuery({
    queryKey: ['all-public-profiles'],
    queryFn: async () => {
      console.log('🔍 Cargando perfiles públicos...');
      const profiles = await base44.entities.PublicProfile.list();
      console.log('✅ Perfiles cargados:', profiles.length);
      return profiles;
    },
    enabled: !!currentUser,
    refetchInterval: 30000,
    staleTime: 60000
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      const follows = await base44.entities.Follow.filter({
        follower_email: currentUser.email
      });
      return follows;
    },
    enabled: !!currentUser
  });

  const { data: blockedUsers = [] } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: () => base44.entities.BlockedUser.list(),
    enabled: currentUser?.role === 'admin'
  });

  const isOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now - lastSeenDate) / 1000 / 60;
    return diffMinutes < 5;
  };

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.religion?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'online') {
      return matchesSearch && isOnline(user.last_seen);
    } else if (filter === 'following') {
      const followingEmails = following.map(f => f.following_email);
      return matchesSearch && followingEmails.includes(user.user_email);
    }
    
    return matchesSearch;
  });

  console.log('📊 Debug - Total usuarios:', allUsers.length);
  console.log('📊 Debug - Usuarios filtrados:', filteredUsers.length);
  console.log('📊 Debug - Búsqueda:', searchTerm);
  console.log('📊 Debug - Filtro:', filter);

  // Si no hay usuario, mostrar pantalla de login
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
            <UsersIcon className="w-12 h-12 text-black" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Inicia sesión para ver los miembros</h2>
          <p className="text-gray-400 mb-6">Únete a la comunidad para conectar con otros miembros</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 text-lg">
            Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-6 px-4 sm:py-12 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
            <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 sm:mb-4">Miembros</h1>
          <p className="text-base sm:text-xl text-gray-400">Conecta con la comunidad</p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar miembros..."
              className="pl-10 sm:pl-12 h-12 sm:h-14 text-sm sm:text-base rounded-2xl shadow-lg border-2 border-yellow-600 bg-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 sm:mb-8 overflow-x-auto">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="bg-gray-800 p-1 text-white w-full sm:w-auto">
              <TabsTrigger value="all" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <UsersIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="online" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                En Línea
              </TabsTrigger>
              <TabsTrigger value="following" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                Siguiendo
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Users Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-2xl p-4 sm:p-6 space-y-4 border border-yellow-600">
                <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
              <UsersIcon className="w-8 h-8 sm:w-12 sm:h-12 text-black" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-3">No se encontraron miembros</h3>
            <div className="bg-gray-800 border border-yellow-600 rounded-lg p-4 max-w-md mx-auto mt-4">
              <p className="text-sm text-gray-300 mb-2">📊 Información de debug:</p>
              <p className="text-xs text-gray-400">Total en base: {allUsers.length}</p>
              <p className="text-xs text-gray-400">Después de filtros: {filteredUsers.length}</p>
              <p className="text-xs text-gray-400">Búsqueda: "{searchTerm || 'ninguna'}"</p>
              <p className="text-xs text-gray-400">Filtro: {filter}</p>
            </div>
            {searchTerm && (
              <Button 
                onClick={() => setSearchTerm('')} 
                className="mt-4 bg-cyan-500 hover:bg-cyan-600"
              >
                Limpiar búsqueda
              </Button>
            )}
          </div>
        ) : allUsers.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
              <UsersIcon className="w-8 h-8 sm:w-12 sm:h-12 text-black" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-3">Aún no hay miembros</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-yellow-600 p-4 sm:p-6"
              >
                <div className="text-center">
                  <div className="relative inline-block mb-3 sm:mb-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 overflow-hidden">
                      {user.profile_picture_url ? (
                        <img 
                          src={user.profile_picture_url} 
                          alt="Perfil" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black text-xl sm:text-2xl font-bold">
                          {user.user_email?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <OnlineIndicator 
                      lastSeen={user.last_seen} 
                      className="absolute bottom-0 right-0"
                    />
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-1 break-words">
                    {user.full_name || user.user_email?.split('@')[0]}
                  </h3>

                  {user.religion && (
                    <p className="text-xs sm:text-sm text-yellow-500 font-medium mb-2 sm:mb-3">
                      {religions.find(r => r.value === user.religion)?.label || user.religion}
                    </p>
                  )}

                  {user.bio && (
                    <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 line-clamp-2">
                      {user.bio}
                    </p>
                  )}

                  <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-400">
                    <div>
                      <span className="font-bold text-white">{user.videos_count || 0}</span> videos
                    </div>
                    <div>
                      <span className="font-bold text-white">{user.followers_count || 0}</span> seguidores
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <FollowButton
                        targetUserEmail={user.user_email}
                        currentUser={currentUser}
                        onFollowChange={refetch}
                      />
                      
                      <Link to={createPageUrl('GroupChat')}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/20"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>

                    {currentUser?.role === 'admin' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          await base44.entities.BlockedUser.create({
                            user_email: user.user_email,
                            blocked_by: currentUser.email,
                            reason: 'Bloqueado por administrador'
                          });
                          await base44.entities.PublicProfile.update(user.id, { is_blocked: true });
                          refetch();
                        }}
                      >
                        Bloquear
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}