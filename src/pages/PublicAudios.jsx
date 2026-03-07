import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Music, Play, Pause, Loader2, Search, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AudioPlayerBar from '@/components/audio/AudioPlayerBar';

const categoryLabels = {
  sermon: 'Sermón',
  worship: 'Adoración',
  prayer: 'Oración',
  meditation: 'Meditación',
  podcast: 'Podcast',
  music: 'Música',
  other: 'Otro'
};

export default function PublicAudios() {
  const [playingAudio, setPlayingAudio] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated);
  }, []);

  const { data: audios = [], isLoading } = useQuery({
    queryKey: ['public-audios'],
    queryFn: () => base44.entities.AudioFile.filter({ status: 'approved' }, '-created_date'),
  });

  const handleToggle = (audio) => {
    if (!audio || playingAudio?.id === audio.id) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(audio);
    }
  };

  const filtered = audios.filter(a => {
    const matchSearch = !search || 
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'all' || a.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const categories = ['all', ...new Set(audios.map(a => a.category).filter(Boolean))];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Music className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Audios</h1>
            <p className="text-gray-400 text-sm">Escucha los audios de la comunidad</p>
          </div>
        </div>
        {isAuthenticated && (
          <Link to={createPageUrl('Upload')}>
            <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-black">
              <Upload className="w-4 h-4 mr-1" />
              Subir
            </Button>
          </Link>
        )}
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Buscar audios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-900/60 border-gray-700 text-white pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-black'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {cat === 'all' ? 'Todos' : categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audio List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-700">
          <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No hay audios disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((audio) => {
            const isPlaying = playingAudio?.id === audio.id;
            return (
              <div key={audio.id}>
                <div
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    isPlaying
                      ? 'bg-cyan-500/10 border-cyan-500/40'
                      : 'bg-gray-900/60 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <button
                    onClick={() => handleToggle(audio)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isPlaying ? 'bg-cyan-500 text-black' : 'bg-gray-700 text-white hover:bg-cyan-500 hover:text-black'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isPlaying ? 'text-cyan-400' : 'text-white'}`}>
                      {audio.title}
                    </p>
                    {audio.description && (
                      <p className="text-gray-500 text-sm truncate">{audio.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-gray-600 text-xs">
                        {new Date(audio.created_date).toLocaleDateString()}
                      </span>
                      {audio.created_by && (
                        <span className="text-gray-600 text-xs">• {audio.created_by.split('@')[0]}</span>
                      )}
                    </div>
                  </div>

                  {audio.category && (
                    <Badge variant="outline" className="text-gray-400 border-gray-600 text-xs flex-shrink-0">
                      {categoryLabels[audio.category] || audio.category}
                    </Badge>
                  )}
                </div>
                {isPlaying && (
                  <AudioPlayerBar audio={audio} isPlaying={true} onToggle={handleToggle} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Login CTA for non-authenticated users */}
      {!isAuthenticated && (
        <div className="mt-8 text-center p-6 bg-gray-900/60 rounded-2xl border border-gray-700">
          <p className="text-gray-400 mb-3">¿Quieres subir tu propio audio?</p>
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-cyan-500 hover:bg-cyan-600 text-black"
          >
            Iniciar Sesión
          </Button>
        </div>
      )}
    </div>
  );
}