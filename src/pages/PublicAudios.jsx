import React, { useMemo, useState } from 'react';
import { Music, Play, Pause, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

// ✅ AQUÍ VAS AGREGANDO TUS AUDIOS DE UPLOADCARE
// Puedes duplicar cualquiera de estos objetos y solo cambiar:
// id, title, description, category, created_date, created_by y el link.
const AUDIOS_UPLOADCARE = [
  {
    id: 'a1',
    title: 'Hermoso es - Hnas Patlán',
    description: 'Audio recuperado desde Uploadcare',
    category: 'music',
    created_date: '2026-02-17T12:00:00.000Z',
    created_by: 'arturooqz72',
    audio_url:
      'https://4cnd4gdczc.ucarecd.net/a1e8e498-ee80-4787-b7c4-0126f38dd04e/HermosoesHnasPatln.m4a',
    file_url:
      'https://4cnd4gdczc.ucarecd.net/a1e8e498-ee80-4787-b7c4-0126f38dd04e/HermosoesHnasPatln.m4a',
    url: 'https://4cnd4gdczc.ucarecd.net/a1e8e498-ee80-4787-b7c4-0126f38dd04e/HermosoesHnasPatln.m4a',
    status: 'approved'
  },

  // ⬇️ EJEMPLOS LISTOS PARA PEGAR TUS OTROS LINKS
  {
    id: 'a2',
    title: 'Celestial ciudad LLDM',
    description: 'Pega aquí el link real de Uploadcare',
    category: 'music',
    created_date: '2026-02-17T12:00:00.000Z',
    created_by: 'arturooqz72',
    audio_url: '',
    file_url: '',
    url: '',
    status: 'approved'
  },
  {
    id: 'a3',
    title: 'Si te Preguntan - LLDM',
    description: 'Pega aquí el link real de Uploadcare',
    category: 'music',
    created_date: '2026-02-17T12:00:00.000Z',
    created_by: 'arturooqz72',
    audio_url: '',
    file_url: '',
    url: '',
    status: 'approved'
  },
  {
    id: 'a4',
    title: 'SEÑOR TÚ ERES EL MISMO - Hnas Barajas',
    description: 'Pega aquí el link real de Uploadcare',
    category: 'music',
    created_date: '2026-02-17T12:00:00.000Z',
    created_by: 'arturooqz72',
    audio_url: '',
    file_url: '',
    url: '',
    status: 'approved'
  },
  {
    id: 'a5',
    title: 'SI NO ERES TU ¿QUIÉN? - Jairo Santamaría Feat Saul Duarte',
    description: 'Pega aquí el link real de Uploadcare',
    category: 'music',
    created_date: '2026-02-17T12:00:00.000Z',
    created_by: 'arturooqz72',
    audio_url: '',
    file_url: '',
    url: '',
    status: 'approved'
  },
  {
    id: 'a6',
    title: 'LLDM - Orfeón La Luz Del Mundo - Barro en tus Mano',
    description: 'Pega aquí el link real de Uploadcare',
    category: 'music',
    created_date: '2026-02-20T12:00:00.000Z',
    created_by: 'arturooqz72',
    audio_url: '',
    file_url: '',
    url: '',
    status: 'approved'
  }
];

export default function PublicAudios() {
  const [playingAudio, setPlayingAudio] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // ✅ Solo deja audios que sí tengan link
  const audios = useMemo(() => {
    return AUDIOS_UPLOADCARE.filter(
      (audio) =>
        audio?.status === 'approved' &&
        (audio?.audio_url || audio?.file_url || audio?.url)
    );
  }, []);

  const handleToggle = (audio) => {
    if (!audio || playingAudio?.id === audio.id) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(audio);
    }
  };

  const filtered = audios.filter((a) => {
    const matchSearch =
      !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      selectedCategory === 'all' || a.category === selectedCategory;

    return matchSearch && matchCategory;
  });

  const categories = ['all', ...new Set(audios.map((a) => a.category).filter(Boolean))];

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
            <p className="text-gray-400 text-sm">
              Escucha los audios de la comunidad
            </p>
          </div>
        </div>
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
          {categories.map((cat) => (
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
      {filtered.length === 0 ? (
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
                      isPlaying
                        ? 'bg-cyan-500 text-black'
                        : 'bg-gray-700 text-white hover:bg-cyan-500 hover:text-black'
                    }`}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold truncate ${
                        isPlaying ? 'text-cyan-400' : 'text-white'
                      }`}
                    >
                      {audio.title}
                    </p>

                    {audio.description && (
                      <p className="text-gray-500 text-sm truncate">
                        {audio.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-gray-600 text-xs">
                        {audio.created_date
                          ? new Date(audio.created_date).toLocaleDateString()
                          : ''}
                      </span>

                      {audio.created_by && (
                        <span className="text-gray-600 text-xs">
                          • {audio.created_by}
                        </span>
                      )}
                    </div>
                  </div>

                  {audio.category && (
                    <Badge
                      variant="outline"
                      className="text-gray-400 border-gray-600 text-xs flex-shrink-0"
                    >
                      {categoryLabels[audio.category] || audio.category}
                    </Badge>
                  )}
                </div>

                {isPlaying && (
                  <AudioPlayerBar
                    audio={{
                      ...audio,
                      audio_url: audio.audio_url || audio.file_url || audio.url,
                      file_url: audio.file_url || audio.audio_url || audio.url,
                      url: audio.url || audio.audio_url || audio.file_url
                    }}
                    isPlaying={true}
                    onToggle={handleToggle}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
