import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import VideoCard from '@/components/video/VideoCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Users, Video, Radio, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RecommendationsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Fetch user activity data
  const { data: likedVideos = [] } = useQuery({
    queryKey: ['user-likes', currentUser?.email],
    queryFn: async () => {
      const likes = await base44.entities.Like.filter({ user_email: currentUser.email });
      const videoIds = likes.map(l => l.video_id);
      if (videoIds.length === 0) return [];
      const videos = await base44.entities.Video.list();
      return videos.filter(v => videoIds.includes(v.id));
    },
    enabled: !!currentUser
  });

  const { data: followedUsers = [] } = useQuery({
    queryKey: ['user-follows', currentUser?.email],
    queryFn: async () => {
      const follows = await base44.entities.Follow.filter({ follower_email: currentUser.email });
      return follows.map(f => f.following_email);
    },
    enabled: !!currentUser
  });

  const { data: userComments = [] } = useQuery({
    queryKey: ['user-comments', currentUser?.email],
    queryFn: () => base44.entities.Comment.filter({ user_email: currentUser.email }),
    enabled: !!currentUser
  });

  const { data: allVideos = [] } = useQuery({
    queryKey: ['all-videos'],
    queryFn: () => base44.entities.Video.list('-created_date', 100)
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: liveStreams = [] } = useQuery({
    queryKey: ['active-streams'],
    queryFn: () => base44.entities.LiveStream.filter({ is_live: true })
  });

  const generateRecommendations = async () => {
    if (!currentUser) return;
    
    setIsGenerating(true);
    try {
      const userProfile = {
        religion: currentUser.religion || 'No especificada',
        spiritual_interests: currentUser.spiritual_interests || [],
        bio: currentUser.bio || '',
        liked_videos: likedVideos.map(v => ({
          title: v.title,
          religion: v.religion,
          topic: v.topic
        })),
        followed_users_count: followedUsers.length,
        comments_count: userComments.length
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un sistema de recomendaciones para una plataforma de contenido religioso y espiritual.

Perfil del usuario:
- Religión: ${userProfile.religion}
- Intereses espirituales: ${userProfile.spiritual_interests.join(', ') || 'Ninguno especificado'}
- Videos que le gustaron: ${JSON.stringify(userProfile.liked_videos)}
- Usuarios seguidos: ${userProfile.followed_users_count}
- Comentarios realizados: ${userProfile.comments_count}

Videos disponibles en la plataforma (últimos 100):
${allVideos.slice(0, 20).map(v => `- ${v.title} (${v.religion}, tema: ${v.topic || 'general'})`).join('\n')}

Basándote en el perfil del usuario, selecciona 6-8 videos que probablemente le interesen y explica brevemente por qué.
También sugiere 3-4 usuarios que debería seguir (de la lista de correos disponibles).
Si hay transmisiones en vivo activas, menciona si alguna sería relevante.

Responde en español de forma concisa y útil.`,
        response_json_schema: {
          type: 'object',
          properties: {
            recommended_videos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  video_title: { type: 'string' },
                  reason: { type: 'string' }
                }
              }
            },
            recommended_users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  user_email: { type: 'string' },
                  reason: { type: 'string' }
                }
              }
            },
            live_stream_suggestion: {
              type: 'object',
              properties: {
                should_watch: { type: 'boolean' },
                reason: { type: 'string' }
              }
            },
            personalized_message: { type: 'string' }
          }
        }
      });

      // Match recommended videos with actual video objects
      const recommendedVideoObjects = result.recommended_videos
        .map(rec => {
          const video = allVideos.find(v => v.title === rec.video_title);
          return video ? { ...video, recommendation_reason: rec.reason } : null;
        })
        .filter(v => v !== null)
        .slice(0, 8);

      setRecommendations({
        videos: recommendedVideoObjects,
        users: result.recommended_users || [],
        liveStreamSuggestion: result.live_stream_suggestion || {},
        message: result.personalized_message
      });
    } catch (error) {
      console.error('Error generando recomendaciones:', error);
      alert('Error al generar recomendaciones. Por favor intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (currentUser && allVideos.length > 0 && !recommendations && !isGenerating) {
      generateRecommendations();
    }
  }, [currentUser, allVideos]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Recomendaciones Para Ti</h1>
              <p className="text-gray-600">Contenido personalizado según tus intereses</p>
            </div>
          </div>
          
          <Button
            onClick={generateRecommendations}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generando...' : 'Actualizar'}
          </Button>
        </div>

        {isGenerating && !recommendations ? (
          <div className="space-y-8">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array(8).fill(0).map((_, i) => (
                <Skeleton key={i} className="aspect-[9/16] rounded-2xl" />
              ))}
            </div>
          </div>
        ) : recommendations ? (
          <div className="space-y-8">
            {/* Personalized Message */}
            {recommendations.message && (
              <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-none">
                <CardContent className="p-6">
                  <p className="text-gray-800">{recommendations.message}</p>
                </CardContent>
              </Card>
            )}

            {/* Live Stream Suggestion */}
            {recommendations.liveStreamSuggestion?.should_watch && liveStreams.length > 0 && (
              <Card className="border-2 border-purple-600 bg-gradient-to-r from-purple-50 to-pink-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-purple-600" />
                    Transmisión en Vivo Recomendada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{recommendations.liveStreamSuggestion.reason}</p>
                  <Link to={createPageUrl('LiveStreams')}>
                    <Button className="bg-purple-600">
                      Ver Transmisiones en Vivo
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Recommended Videos */}
            {recommendations.videos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Video className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Videos Recomendados</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recommendations.videos.map((video) => (
                    <div key={video.id} className="space-y-2">
                      <VideoCard
                        video={video}
                        currentUser={currentUser}
                      />
                      <p className="text-xs text-gray-600 px-2">
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        {video.recommendation_reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Users */}
            {recommendations.users.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Users className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Usuarios Sugeridos</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.users.map((rec, idx) => {
                    const user = allUsers.find(u => u.email === rec.user_email);
                    if (!user) return null;
                    
                    return (
                      <Card key={idx} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <Link to={createPageUrl(`UserProfile?email=${user.email}`)}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-lg font-semibold">
                                {user.email?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {user.full_name || user.email?.split('@')[0]}
                                </p>
                                <p className="text-xs text-gray-600">{user.email}</p>
                              </div>
                            </div>
                          </Link>
                          <p className="text-sm text-gray-600 mb-3">
                            <Sparkles className="w-3 h-3 inline mr-1" />
                            {rec.reason}
                          </p>
                          <Link to={createPageUrl(`UserProfile?email=${user.email}`)}>
                            <Button variant="outline" size="sm" className="w-full">
                              Ver Perfil
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-500" />
            <p className="text-gray-600">Haz clic en "Actualizar" para generar recomendaciones</p>
          </div>
        )}
      </div>
    </div>
  );
}