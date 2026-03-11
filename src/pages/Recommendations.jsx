import React from 'react';
import { useQuery } from '@tanstack/react-query';
import VideoCard from '@/components/video/VideoCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Video } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RecommendationsPage() {

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['recommended-videos'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/videos');
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Videos Recomendados
            </h1>
            <p className="text-gray-600">
              Descubre contenido reciente de la comunidad
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="aspect-[9/16] rounded-2xl" />
            ))}
          </div>
        ) : videos.length > 0 ? (

          <div className="space-y-8">

            <div className="flex items-center gap-2">
              <Video className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Videos Recientes
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                />
              ))}
            </div>

          </div>

        ) : (

          <Card>
            <CardContent className="py-20 text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-500" />
              <p className="text-gray-600 mb-4">
                Aún no hay videos disponibles.
              </p>

              <Link to={createPageUrl("Upload")}>
                <Button className="bg-purple-600">
                  Subir Video
                </Button>
              </Link>

            </CardContent>
          </Card>

        )}

      </div>
    </div>
  );
}
