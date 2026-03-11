import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import VideoCard from '@/components/video/VideoCard';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft, Video, Loader2 } from 'lucide-react';

const categories = [
  {
    value: 'predicaciones',
    label: 'Predicaciones',
    emoji: '🎙️',
    color: 'from-yellow-500 to-yellow-600',
    bg: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  },
  {
    value: 'cantos',
    label: 'Cantos',
    emoji: '🎵',
    color: 'from-pink-500 to-pink-600',
    bg: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
  },
  {
    value: 'testimonios',
    label: 'Testimonios',
    emoji: '✨',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  },
  {
    value: 'platicas',
    label: 'Platicas',
    emoji: '🗣️',
    color: 'from-green-500 to-green-600',
    bg: 'bg-green-50 border-green-200 hover:bg-green-100',
  },
  {
    value: 'debates',
    label: 'Debates',
    emoji: '⚖️',
    color: 'from-red-500 to-red-600',
    bg: 'bg-red-50 border-red-200 hover:bg-red-100',
  },
  {
    value: 'temas',
    label: 'Temas',
    emoji: '📚',
    color: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
  },
  {
    value: 'podcast',
    label: 'Podcast',
    emoji: '🎧',
    color: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
  },
  {
    value: 'otros',
    label: 'Otros',
    emoji: '🌟',
    color: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  },
];

export default function Videos() {
  const [currentUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: videos = [], isLoading, refetch, error } = useQuery({
    queryKey: ['videos-page', selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('category', selectedCategory)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCategory,
  });

  const filtered = videos.filter(
    (v) =>
      v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!selectedCategory) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center">
            <Video className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Videos</h1>
            <p className="text-gray-600 text-sm">Elige una categoría para ver los videos</p>
          </div>
        </div>

        <div className="space-y-4">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`w-full flex items-center gap-5 p-6 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm ${cat.bg}`}
            >
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-3xl shadow-lg`}
              >
                {cat.emoji}
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-gray-900">{cat.label}</p>
                <p className="text-gray-600 text-sm">Ver videos de {cat.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const activeCat = categories.find((c) => c.value === selectedCategory);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => {
            setSelectedCategory(null);
            setSearchTerm('');
          }}
          className="w-10 h-10 rounded-full bg-white border border-sky-200 text-sky-700 flex items-center justify-center hover:bg-sky-50 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
            activeCat?.color || 'from-cyan-500 to-cyan-600'
          } flex items-center justify-center text-lg shadow-sm`}
        >
          {activeCat?.emoji || '🎥'}
        </div>

        <h1 className="text-xl font-bold text-gray-900">{activeCat?.label || 'Videos'}</h1>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar videos..."
          className="pl-10 bg-white border-sky-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-sky-400"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-red-200 shadow-sm">
          <Video className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">Error cargando videos</p>
          <p className="text-gray-500 text-sm mt-2">{error.message}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-sky-200 shadow-sm">
          <Video className="w-12 h-12 text-sky-300 mx-auto mb-3" />
          <p className="text-gray-600">No hay videos en esta categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              currentUser={currentUser}
              onLikeUpdate={refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
