import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Radio, Users, Play, Pause, Volume2, VolumeX, Send, MessageCircle, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReportButton from '@/components/ReportButton';

export default function LiveRadioPlayer() {
  const [currentUser, setCurrentUser] = useState(null);
  const [radioId, setRadioId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [comment, setComment] = useState('');
  const [streamError, setStreamError] = useState(false);
  const audioRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRadioId(params.get('id'));
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

  const { data: radio, isLoading } = useQuery({
    queryKey: ['live-radio', radioId],
    queryFn: async () => {
      const radios = await base44.entities.LiveRadio.filter({ id: radioId });
      if (radios.length > 0) {
        await base44.entities.LiveRadio.update(radioId, {
          listeners_count: (radios[0].listeners_count || 0) + 1
        });
        return radios[0];
      }
      return null;
    },
    enabled: !!radioId,
    refetchInterval: 10000
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['radio-chat', radioId],
    queryFn: () => base44.entities.LiveRadioChat.filter({ radio_id: radioId }, 'created_date', 100),
    enabled: !!radioId,
    refetchInterval: 2000
  });

  useEffect(() => {
    if (!radioId) return;
    
    const unsubscribe = base44.entities.LiveRadioChat.subscribe((event) => {
      if (event.type === 'create' && event.data.radio_id === radioId) {
        queryClient.invalidateQueries({ queryKey: ['radio-chat', radioId] });
      }
    });

    return unsubscribe;
  }, [radioId, queryClient]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handlePlayPause = async () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        setStreamError(false);
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error al reproducir:', error);
        setStreamError(true);
        setIsPlaying(false);
      }
    }
  };

  // Apagar audio cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
      }
    };
  }, []);

  const sendMessageMutation = useMutation({
    mutationFn: async (message) => {
      return await base44.entities.LiveRadioChat.create({
        radio_id: radioId,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email.split('@')[0],
        message: message.trim()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio-chat', radioId] });
    }
  });

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !currentUser) return;
    
    sendMessageMutation.mutate(comment);
    setComment('');
  };

  const isCreator = currentUser?.email === radio?.created_by;
  const isAdmin = currentUser?.role === 'admin';

  const handleEndTransmission = async () => {
    if (!confirm('¿Terminar la transmisión en vivo?')) return;
    
    await base44.entities.LiveRadio.update(radioId, {
      is_live: false,
      ended_at: new Date().toISOString()
    });
    
    navigate(createPageUrl('Radio'));
  };

  const handleDeleteTransmission = async () => {
    if (!confirm('¿Eliminar permanentemente esta transmisión?')) return;
    
    try {
      await base44.entities.LiveRadio.delete(radioId);
      navigate(createPageUrl('Radio'));
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar la transmisión');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-96 rounded-3xl mb-8" />
          <Skeleton className="h-[600px] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!radio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <p className="text-white text-xl">Transmisión no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Player Section */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-2 border-yellow-600 shadow-2xl shadow-yellow-600/20">
              <CardContent className="p-8">
                {/* Live Indicator */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-4 h-4 bg-red-600 rounded-full animate-ping" />
                    </div>
                    <span className="text-red-500 font-bold text-lg">EN VIVO</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">{radio.listeners_count || 0} oyentes</span>
                  </div>
                </div>

                {/* Radio Info */}
                <div className="text-center mb-8">
                  <div className="w-48 h-48 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                    <Radio className={`w-24 h-24 text-black ${isPlaying ? 'animate-pulse' : ''}`} />
                  </div>
                  
                  <h1 className="text-3xl font-bold text-white mb-2">{radio.title}</h1>
                  {radio.description && (
                    <p className="text-gray-400 max-w-md mx-auto">{radio.description}</p>
                  )}

                  <div className="mt-4 flex items-center justify-center gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <span>Por:</span>
                      <span className="text-yellow-500">{radio.created_by?.split('@')[0]}</span>
                    </div>
                    {currentUser && currentUser.email !== radio.created_by && (
                      <ReportButton
                        contentType="live_radio"
                        contentId={radioId}
                        reportedUserEmail={radio.created_by}
                        contentPreview={`Radio en vivo: ${radio.title}`}
                        variant="ghost"
                        size="sm"
                      />
                    )}
                  </div>
                </div>

                {/* Stream Player */}
                {radio.stream_url.includes('youtube.com') || radio.stream_url.includes('youtu.be') ? (
                  <div className="aspect-video w-full max-w-2xl mx-auto mb-6 rounded-xl overflow-hidden">
                    <iframe
                      src={radio.stream_url.includes('watch?v=') 
                        ? radio.stream_url.replace('watch?v=', 'embed/')
                        : radio.stream_url.replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : radio.stream_url.includes('mixlr.com') ? (
                  <div className="w-full max-w-2xl mx-auto mb-6">
                    <iframe
                      src={radio.stream_url.includes('/embed') ? radio.stream_url : `${radio.stream_url}/embed`}
                      className="w-full h-60 rounded-xl"
                      frameBorder="0"
                    />
                  </div>
                ) : radio.stream_url.endsWith('.mp3') || radio.stream_url.endsWith('.aac') || radio.stream_url.endsWith('.ogg') || radio.stream_url.endsWith('.m3u8') || radio.stream_url.includes('/stream') ? (
                  <>
                    <audio
                      ref={audioRef}
                      src={radio.stream_url}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('Error de audio:', e);
                        setIsPlaying(false);
                        setStreamError(true);
                      }}
                      className="hidden"
                    />
                    
                    <div className="text-center mb-6">
                      <div className="flex justify-center mb-4">
                        <Button
                          onClick={handlePlayPause}
                          size="lg"
                          className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black shadow-lg shadow-yellow-500/50"
                        >
                          {isPlaying ? (
                            <Pause className="w-10 h-10" />
                          ) : (
                            <Play className="w-10 h-10 ml-1" />
                          )}
                        </Button>
                      </div>
                      
                      {streamError && (
                        <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 max-w-md mx-auto mb-4">
                          <p className="text-red-400 font-semibold mb-2">⚠️ No se pudo conectar al stream</p>
                          <p className="text-xs text-gray-300 mb-3">
                            Prueba abriendo directamente en otra pestaña:
                          </p>
                          <a 
                            href={radio.stream_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-semibold hover:bg-yellow-600"
                          >
                            <Play className="w-4 h-4" />
                            Abrir Stream
                          </a>
                        </div>
                      )}
                      
                      <div className="bg-gray-900/50 rounded-lg p-4 max-w-md mx-auto">
                        <p className="text-xs text-gray-400 mb-2">
                          Stream URL:
                        </p>
                        <p className="text-xs text-yellow-500 break-all font-mono">
                          {radio.stream_url}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full max-w-2xl mx-auto mb-6">
                    <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 text-center">
                      <p className="text-red-400 font-semibold text-lg mb-3">🚫 Plataforma no soportada</p>
                      <p className="text-gray-300 text-sm mb-4">
                        {radio.stream_url.includes('tiktok.com') ? 'TikTok no permite transmisiones embebidas' :
                         radio.stream_url.includes('instagram.com') ? 'Instagram no permite transmisiones embebidas' :
                         radio.stream_url.includes('facebook.com') || radio.stream_url.includes('fb.com') ? 'Facebook no permite transmisiones embebidas' :
                         'Esta plataforma bloquea las transmisiones embebidas'}
                      </p>
                      <p className="text-gray-400 text-xs mb-4">
                        Usa YouTube Live, Mixlr, o un servidor de streaming directo (Icecast/Shoutcast)
                      </p>
                      <a 
                        href={radio.stream_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-600"
                      >
                        <Play className="w-5 h-5" />
                        Abrir en nueva pestaña
                      </a>
                    </div>
                  </div>
                )}

                {!radio.stream_url.includes('youtube.com') && !radio.stream_url.includes('youtu.be') && !radio.stream_url.includes('tiktok.com') && !radio.stream_url.includes('instagram.com') && (
                  <div className="flex items-center gap-4 max-w-xs mx-auto mb-6">
                    <Button
                      onClick={() => setIsMuted(!isMuted)}
                      size="icon"
                      variant="ghost"
                      className="text-yellow-500"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      onValueChange={(val) => {
                        setVolume(val[0]);
                        if (val[0] > 0) setIsMuted(false);
                      }}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-400 w-12 text-right">
                      {isMuted ? 0 : volume}%
                    </span>
                  </div>
                )}

                {(isCreator || isAdmin) && (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6 border-t border-gray-700">
                    {isCreator && (
                      <Button
                        onClick={handleEndTransmission}
                        variant="outline"
                        className="border-yellow-600 text-yellow-500 hover:bg-yellow-600/20"
                      >
                        Terminar Transmisión
                      </Button>
                    )}
                    <Button
                      onClick={handleDeleteTransmission}
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar Transmisión
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-yellow-600 h-[600px] flex flex-col">
              <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-yellow-600 to-yellow-700">
                <div className="flex items-center gap-2 text-black">
                  <MessageCircle className="w-5 h-5" />
                  <h3 className="font-semibold">Chat en vivo</h3>
                  <span className="ml-auto text-sm">({chatMessages.length})</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-10">
                    Sé el primero en comentar
                  </p>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-black text-xs font-medium flex-shrink-0">
                        {msg.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-gray-300 truncate">{msg.user_name}</p>
                          {currentUser && currentUser.email !== msg.user_email && (
                            <ReportButton
                              contentType="radio_chat"
                              contentId={msg.id}
                              reportedUserEmail={msg.user_email}
                              contentPreview={`Chat radio: ${msg.message}`}
                              variant="ghost"
                              size="sm"
                            />
                          )}
                        </div>
                        <p className="text-sm text-white break-words">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSendComment} className="flex gap-2">
                  <Input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    disabled={!currentUser}
                    className="flex-1 bg-gray-900 text-white border-gray-700"
                  />
                  <Button
                    type="submit"
                    disabled={!comment.trim() || !currentUser}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

