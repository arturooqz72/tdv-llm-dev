import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, Eye, MessageCircle, Send, Radio, Users, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import EnhancedChat from '@/components/live/EnhancedChat';
import ReportButton from '@/components/ReportButton';

export default function LiveStream() {
  const [currentUser, setCurrentUser] = useState(null);
  const [streamId, setStreamId] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setStreamId(urlParams.get('id'));
  }, []);

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

  const { data: stream, isLoading } = useQuery({
    queryKey: ['stream', streamId],
    queryFn: async () => {
      const streams = await base44.entities.LiveStream.filter({ id: streamId });
      if (streams.length > 0) {
        // Increment viewers
        const updatedStream = await base44.entities.LiveStream.update(streams[0].id, {
          viewers_count: (streams[0].viewers_count || 0) + 1
        });
        return updatedStream;
      }
      return null;
    },
    enabled: !!streamId,
    refetchInterval: 10000
  });

  const { data: guests = [] } = useQuery({
    queryKey: ['stream-guests', streamId],
    queryFn: () => base44.entities.LiveStreamGuest.filter({ stream_id: streamId }),
    enabled: !!streamId
  });

  const isCreator = currentUser?.email === stream?.created_by;

  const getEmbedUrl = (url) => {
    if (!url) return '';
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    
    // Twitch
    if (url.includes('twitch.tv')) {
      const channel = url.split('twitch.tv/')[1]?.split('?')[0];
      return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`;
    }
    
    return url;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="aspect-video rounded-3xl mb-6" />
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transmisión no encontrada</h2>
          <p className="text-gray-600">Esta transmisión no existe o ha finalizado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-black rounded-3xl overflow-hidden shadow-2xl">
              <div className="aspect-video">
                <iframe
                  src={getEmbedUrl(stream.stream_url)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              </div>
            </div>

            {/* Stream Info */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-white text-xs font-bold">EN VIVO</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">{stream.viewers_count || 0} espectadores</span>
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{stream.title}</h1>
                  {stream.description && (
                    <p className="text-gray-600">{stream.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium">
                    {stream.created_by?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{stream.created_by?.split('@')[0]}</p>
                    <p className="text-xs text-gray-500">{stream.religion}</p>
                  </div>
                </div>
                {currentUser && currentUser.email !== stream.created_by && (
                  <ReportButton
                    contentType="live_stream"
                    contentId={streamId}
                    reportedUserEmail={stream.created_by}
                    contentPreview={`Transmisión: ${stream.title}`}
                  />
                )}
              </div>

              {/* Co-hosts for collaborative streams */}
              {stream.is_collaborative && stream.co_hosts?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Co-Anfitriones</span>
                  </div>
                  <div className="space-y-2">
                    {stream.co_hosts.map((hostEmail, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                          {hostEmail.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{hostEmail.split('@')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guests */}
              {guests.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Invitados</span>
                  </div>
                  <div className="space-y-2">
                    {guests.map((guest) => (
                      <div key={guest.id} className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-medium">
                          {guest.guest_name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{guest.guest_name}</span>
                        <span className="ml-auto text-xs text-gray-500">{guest.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Chat */}
          <div className="lg:col-span-1">
            <EnhancedChat 
              streamId={streamId} 
              currentUser={currentUser} 
              isCreator={isCreator}
            />
          </div>
        </div>
      </div>
    </div>
  );
}