import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Eye, Radio } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

export default function FeaturedStreams() {
  const { data: liveStreams = [], isLoading: loadingLive } = useQuery({
    queryKey: ['featured-live-streams'],
    queryFn: () => base44.entities.LiveStream.filter({ is_live: true }, '-viewers_count', 5),
    refetchInterval: 15000
  });

  const { data: liveRadios = [], isLoading: loadingRadio } = useQuery({
    queryKey: ['featured-live-radios'],
    queryFn: () => base44.entities.LiveRadio.filter({ is_live: true }, '-listeners_count', 5),
    refetchInterval: 15000
  });

  const { data: popularPrograms = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ['popular-programs'],
    queryFn: () => base44.entities.RadioProgram.filter({ is_active: true }, '-plays_count', 6),
    staleTime: 300000
  });

  const featuredItems = [
    ...liveStreams.map(s => ({ ...s, type: 'live_stream', url: createPageUrl(`LiveStream?id=${s.id}`) })),
    ...liveRadios.map(r => ({ ...r, type: 'live_radio', url: createPageUrl(`LiveRadioPlayer?id=${r.id}`) })),
    ...popularPrograms.slice(0, 3).map(p => ({ ...p, type: 'program', url: createPageUrl(`RadioProgramDetail?id=${p.id}`) }))
  ];

  if (loadingLive && loadingRadio && loadingPrograms) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (featuredItems.length === 0) return null;

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Radio className="w-6 h-6 text-yellow-500" />
        Transmisiones Destacadas
      </h2>

      <Carousel className="w-full">
        <CarouselContent>
          {featuredItems.map((item, index) => (
            <CarouselItem key={`${item.type}-${item.id}-${index}`} className="md:basis-1/2 lg:basis-1/3">
              <Link to={item.url}>
                <Card className="bg-gray-800 border-yellow-600/30 hover:border-yellow-600 transition-all duration-300 overflow-hidden group">
                  <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                    {item.type === 'live_stream' || item.type === 'live_radio' ? (
                      <>
                        <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-full z-10">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          <span className="text-white text-xs font-bold">EN VIVO</span>
                        </div>
                        <Radio className="w-16 h-16 text-yellow-500 group-hover:scale-110 transition-transform" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2 group-hover:text-yellow-500 transition-colors">
                      {item.title}
                    </h3>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {item.type === 'live_stream' && (
                        <>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{item.viewers_count || 0}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 rounded">
                            {item.religion}
                          </span>
                        </>
                      )}
                      {item.type === 'live_radio' && (
                        <>
                          <div className="flex items-center gap-1">
                            <Radio className="w-3 h-3" />
                            <span>{item.listeners_count || 0} oyentes</span>
                          </div>
                        </>
                      )}
                      {item.type === 'program' && (
                        <>
                          <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 rounded">
                            {item.plays_count || 0} reproducciones
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    </div>
  );
}