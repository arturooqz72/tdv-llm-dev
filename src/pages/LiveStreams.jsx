import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Video, Eye, Calendar, Clock, Radio, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const religionColors = {
  cristianismo: 'from-blue-500 to-blue-600',
  lldm: 'from-yellow-500 to-yellow-600',
  islam: 'from-green-500 to-green-600',
  judaismo: 'from-indigo-500 to-indigo-600',
  budismo: 'from-orange-500 to-orange-600',
  hinduismo: 'from-purple-500 to-purple-600',
  otros: 'from-gray-500 to-gray-600'
};

export default function LiveStreams() {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      }
    };
    loadUser();
  }, []);

  const handleDelete = async (e, streamId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Eliminar esta transmisión?')) return;
    
    try {
      await base44.entities.LiveStream.delete(streamId);
      queryClient.invalidateQueries(['live-streams']);
      queryClient.invalidateQueries(['scheduled-streams']);
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar la transmisión');
    }
  };

  const { data: liveStreams = [], isLoading: loadingLive } = useQuery({
    queryKey: ['live-streams'],
    queryFn: async () => {
      try {
        const result = await base44.entities.LiveStream.filter({ is_live: true }, '-started_at', 50);
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    refetchInterval: 10000,
    retry: 1
  });

  const { data: scheduledStreams = [], isLoading: loadingScheduled } = useQuery({
    queryKey: ['scheduled-streams'],
    queryFn: async () => {
      try {
        const result = await base44.entities.LiveStream.filter({ is_scheduled: true, is_live: false }, 'scheduled_start', 50);
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    retry: 1
  });

  const isLoading = loadingLive || loadingScheduled;
  const streams = [...liveStreams, ...scheduledStreams];

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Próximamente';
      return format(parseISO(dateString), 'd MMM HH:mm', { locale: es });
    } catch {
      return 'Próximamente';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-6 sm:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center">
            <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
            Transmisiones en Vivo
          </h1>
          <p className="text-base sm:text-xl text-gray-600 mb-4 sm:mb-6 px-4">
            Únete a las conversaciones en tiempo real
          </p>
          
          <Link to={createPageUrl('GoLive')}>
            <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 h-10 sm:h-12 px-6 sm:px-8 text-sm sm:text-base">
              <Video className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Transmitir en Vivo
            </Button>
          </Link>
        </div>

        {/* Live Streams Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : streams.length === 0 ? (
          <div className="text-center py-12 sm:py-20 px-4">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
              <Video className="w-8 h-8 sm:w-12 sm:h-12 text-red-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">
              No hay transmisiones en vivo
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Sé el primero en iniciar una transmisión
            </p>
            <Link to={createPageUrl('GoLive')}>
              <Button className="bg-gradient-to-r from-red-600 to-pink-600 text-sm sm:text-base">
                Iniciar Transmisión
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {streams.map((stream) => {
              if (!stream || !stream.id) return null;
              
              const isLive = stream.is_live === true;
              const isScheduled = stream.is_scheduled === true && !isLive;
              const religion = stream.religion || 'otros';
              const title = stream.title || 'Sin título';
              const description = stream.description || '';
              const creator = stream.created_by || '';
              const creatorInitial = creator ? creator.charAt(0).toUpperCase() : 'U';
              const creatorName = creator ? creator.split('@')[0] : 'Usuario';
              
              return (
                <div key={stream.id} className="relative">
                  <Link to={isLive ? createPageUrl(`LiveStream?id=${stream.id}`) : '#'}>
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                      <Video className="w-12 h-12 sm:w-16 sm:h-16 text-white/30" />
                      
                      {/* Live/Scheduled Badge */}
                      <div className={`absolute top-2 sm:top-4 left-2 sm:left-4 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${
                        isLive ? 'bg-red-600' : 'bg-blue-600'
                      }`}>
                        {isLive && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />}
                        {isScheduled && <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />}
                        <span className="text-white text-[10px] sm:text-xs font-bold">
                          {isLive ? 'EN VIVO' : 'PROGRAMADO'}
                        </span>
                      </div>

                      {/* Religion Badge */}
                      <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                        <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium text-white bg-gradient-to-r ${religionColors[religion] || 'from-gray-400 to-gray-500'}`}>
                          {religion}
                        </span>
                      </div>

                      {/* Viewers Count or Scheduled Time */}
                      {isLive && (
                        <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black/70 rounded-lg backdrop-blur-sm">
                          <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                          <span className="text-white text-[10px] sm:text-xs font-medium">
                            {stream.viewers_count || 0}
                          </span>
                        </div>
                      )}
                      {isScheduled && (
                        <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-600 rounded-lg">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                          <span className="text-white text-[10px] sm:text-xs font-medium">
                            {formatDate(stream.scheduled_start)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5">
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                        {title}
                      </h3>
                      
                      {description && (
                        <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mb-3 sm:mb-4">
                          {description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-[10px] sm:text-xs font-medium">
                          {creatorInitial}
                        </div>
                        <span className="text-xs sm:text-sm text-gray-700 font-medium truncate">
                          {creatorName}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                {currentUser && (currentUser.email === stream.created_by || currentUser.role === 'admin') && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => handleDelete(e, stream.id)}
                    className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-red-500 hover:text-white text-red-500 shadow-lg h-8 w-8"
                    title="Eliminar transmisión"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}