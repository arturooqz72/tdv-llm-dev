import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import VideoCard from '@/components/video/VideoCard';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft, Video, Loader2 } from 'lucide-react';

const categories = [
  { value: 'lldm', label: 'LLDM', emoji: '⛪', color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  { value: 'cristianismo', label: 'Cristiano', emoji: '✝️', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-500/10 border-blue-500/30' },
  { value: 'otros', label: 'Otros', emoji: '🌟', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/10 border-purple-500/30' },
];

export default function Videos() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: videos = [], isLoading, refetch } = useQuery({
    queryKey: ['videos-page', selectedCategory],
    queryFn: () => {
      if (selectedCategory) {
        return base44.entities.Video.filter({ religion: selectedCategory, status: 'approved' }, '-created_date', 100);
      }
      return [];
    },
    enabled: !!selectedCategory,
  });

  const filtered = videos.filter(v =>
    v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Category selection view
  if (!selectedCategory) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Video className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Videos</h1>
            <p className="text-gray-400 text-sm">Elige una categoría para ver los videos</p>
          </div>
        </div>

        <div className="space-y-4">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`w-full flex items-center gap-5 p-6 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${cat.bg}`}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-3xl shadow-lg`}>
                {cat.emoji}
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-white">{cat.label}</p>
                <p className="text-gray-400 text-sm">Ver videos de {cat.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Videos list view
  const activeCat = categories.find(c => c.value === selectedCategory);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => { setSelectedCategory(null); setSearchTerm(''); }}
          className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeCat.color} flex items-center justify-center text-lg`}>
          {activeCat.emoji}
        </div>
        <h1 className="text-xl font-bold text-white">{activeCat.label}</h1>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar videos..."
          className="pl-10 bg-gray-800 border-gray-600 text-white"
        />
      </div>

      {/* Videos */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-700">
          <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No hay videos en esta categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(video => (
            <VideoCard key={video.id} video={video} currentUser={currentUser} onLikeUpdate={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}