import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Repeat,
  Shuffle,
  Music,
  Disc3,
  Mic2,
  Headphones,
  Radio,
  Waves,
} from "lucide-react";

const CATEGORY_ORDER = [
  "Predicaciones",
  "Cantos LLDM",
  "Instrumental",
  "Testimonios",
  "Podcast",
  "Debates",
  "Temas",
  "Otros",
];

const CATEGORY_STYLES = {
  Predicaciones: {
    icon: Mic2,
    gradient: "from-blue-600/30 via-sky-500/20 to-cyan-400/10",
  },
  "Cantos LLDM": {
    icon: Music,
    gradient: "from-emerald-600/30 via-green-500/20 to-lime-400/10",
  },
  Instrumental: {
    icon: Waves,
    gradient: "from-violet-600/30 via-fuchsia-500/20 to-pink-400/10",
  },
  Testimonios: {
    icon: Headphones,
    gradient: "from-amber-500/30 via-orange-500/20 to-yellow-300/10",
  },
  Podcast: {
    icon: Radio,
    gradient: "from-rose-600/30 via-pink-500/20 to-red-400/10",
  },
  Debates: {
    icon: Disc3,
    gradient: "from-indigo-600/30 via-purple-500/20 to-violet-300/10",
  },
  Temas: {
    icon: Music,
    gradient: "from-teal-600/30 via-cyan-500/20 to-sky-400/10",
  },
  Otros: {
    icon: Music,
    gradient: "from-zinc-600/30 via-zinc-500/20 to-zinc-400/10",
  },
};

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function normalizeCategory(category) {
  if (!category) return "Otros";
  const value = String(category).trim();

  const match = CATEGORY_ORDER.find(
    (item) => item.toLowerCase() === value.toLowerCase()
  );

  return match || "Otros";
}

function shuffleArray(array, currentItemId = null) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  if (currentItemId && copy.length > 1) {
    const currentIndex = copy.findIndex((item) => item.id === currentItemId);
    if (currentIndex > 0) {
      [copy[0], copy[currentIndex]] = [copy[currentIndex], copy[0]];
    }
  }

  return copy;
}

function AudioRow({ audio, isActive, isPlaying, onPlay }) {
  return (
    <div
      className={`group flex items-center gap-4 rounded-2xl px-4 py-4 transition ${
        isActive
          ? "bg-white/10 ring-1 ring-white/10"
          : "hover:bg-white/5"
      }`}
    >
      <button
        onClick={onPlay}
        className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center transition ${
          isActive
            ? "bg-green-500 text-black"
            : "bg-white/10 text-white group-hover:bg-green-500 group-hover:text-black"
        }`}
      >
        {isActive && isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-semibold truncate">{audio.title || "Sin título"}</h3>

          <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 text-zinc-200">
            {audio.category}
          </span>

          {audio.file_size_mb ? (
            <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 text-zinc-400">
              {audio.file_size_mb} MB
            </span>
          ) : null}
        </div>

        <p className="text-sm text-zinc-400 line-clamp-2">
          {audio.description || "Contenido de edificación espiritual"}
        </p>
      </div>
    </div>
  );
}

export default function MyAudios() {
  const audioRef = useRef(null);

  const [allAudios, setAllAudios] = useState([]);
  const [displayList, setDisplayList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  const [currentAudioId, setCurrentAudioId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    loadAudios();
  }, []);

  async function loadAudios() {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("audios")
        .select("id, title, description, category, audio_url, is_active, file_size_mb")
        .eq("is_active", true);

      if (error) throw error;

      const cleaned = (data || [])
        .filter((item) => item.audio_url)
        .map((item) => ({
          ...item,
          category: normalizeCategory(item.category),
        }))
        .sort((a, b) => {
          const aIndex = CATEGORY_ORDER.indexOf(a.category);
          const bIndex = CATEGORY_ORDER.indexOf(b.category);
          if (aIndex !== bIndex) return aIndex - bIndex;

          const aTitle = (a.title || "").toLowerCase();
          const bTitle = (b.title || "").toLowerCase();
          return aTitle.localeCompare(bTitle);
        });

      setAllAudios(cleaned);
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudieron cargar los audios.");
    } finally {
      setLoading(false);
    }
  }

  const filteredAudios = useMemo(() => {
    let result = [...allAudios];

    if (selectedCategory !== "Todas") {
      result = result.filter((audio) => audio.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();

      result = result.filter((audio) => {
        const title = audio.title?.toLowerCase() || "";
        const description = audio.description?.toLowerCase() || "";
        const category = audio.category?.toLowerCase() || "";

        return (
          title.includes(q) ||
          description.includes(q) ||
          category.includes(q)
        );
      });
    }

    return result;
  }, [allAudios, selectedCategory, search]);

  useEffect(() => {
    const currentId = currentAudioId;

    if (shuffleMode) {
      setDisplayList(shuffleArray(filteredAudios, currentId));
    } else {
      setDisplayList(filteredAudios);
    }
  }, [filteredAudios, shuffleMode, currentAudioId]);

  const currentIndex = useMemo(() => {
    return displayList.findIndex((audio) => audio.id === currentAudioId);
  }, [displayList, currentAudioId]);

  const currentAudio =
    currentIndex >= 0 && currentIndex < displayList.length
      ? displayList[currentIndex]
      : null;

  useEffect(() => {
    if (!displayList.length) {
      setCurrentAudioId(null);
      setIsPlaying(false);
      return;
    }

    if (currentAudioId && displayList.some((item) => item.id === currentAudioId)) {
      return;
    }

    setCurrentAudioId(displayList[0].id);
    setIsPlaying(false);
  }, [displayList, currentAudioId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudio?.audio_url) return;

    audio.src = currentAudio.audio_url;
    audio.load();
    setCurrentTime(0);
    setDuration(0);

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error("Error al reproducir:", err);
        setIsPlaying(false);
      });
    }
  }, [currentAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudio) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error("Error al reproducir:", err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentAudio]);

  function playAudioById(audioId) {
    setCurrentAudioId(audioId);
    setIsPlaying(true);
  }

  function togglePlayPause() {
    if (!displayList.length) return;

    if (!currentAudio && displayList[0]) {
      setCurrentAudioId(displayList[0].id);
      setIsPlaying(true);
      return;
    }

    setIsPlaying((prev) => !prev);
  }

  function playNext() {
    if (!displayList.length) return;

    if (!currentAudio) {
      setCurrentAudioId(displayList[0].id);
      setIsPlaying(true);
      return;
    }

    if (repeatMode) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      return;
    }

    const nextIndex = currentIndex + 1;

    if (nextIndex < displayList.length) {
      setCurrentAudioId(displayList[nextIndex].id);
      setIsPlaying(true);
    } else {
      setCurrentAudioId(displayList[0].id);
      setIsPlaying(true);
    }
  }

  function playPrev() {
    if (!displayList.length) return;

    if (!currentAudio) {
      setCurrentAudioId(displayList[0].id);
      setIsPlaying(true);
      return;
    }

    const audio = audioRef.current;
    if (audio && audio.currentTime > 5) {
      audio.currentTime = 0;
      return;
    }

    const prevIndex = currentIndex - 1;

    if (prevIndex >= 0) {
      setCurrentAudioId(displayList[prevIndex].id);
      setIsPlaying(true);
    } else {
      setCurrentAudioId(displayList[displayList.length - 1].id);
      setIsPlaying(true);
    }
  }

  function onEnded() {
    if (repeatMode) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      return;
    }

    playNext();
  }

  function handleProgressChange(e) {
    const value = Number(e.target.value);
    setCurrentTime(value);

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value;
    }
  }

  function toggleShuffle() {
    setShuffleMode((prev) => !prev);
  }

  function toggleRepeat() {
    setRepeatMode((prev) => !prev);
  }

  const categoriesWithCounts = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      name: category,
      count: allAudios.filter((audio) => audio.category === category).length,
    }));
  }, [allAudios]);

  const recentAudios = useMemo(() => {
    return allAudios.slice(0, 8);
  }, [allAudios]);

  const groupedAudios = useMemo(() => {
    const groups = {};
    CATEGORY_ORDER.forEach((category) => {
      groups[category] = filteredAudios.filter((audio) => audio.category === category);
    });
    return groups;
  }, [filteredAudios]);

  const heroCategoryText = CATEGORY_ORDER.join(" • ");

  return (
    <div className="min-h-screen bg-black text-white pb-44">
      <audio
        ref={audioRef}
        onLoadedMetadata={() => {
          const audio = audioRef.current;
          if (audio) setDuration(audio.duration || 0);
        }}
        onTimeUpdate={() => {
          const audio = audioRef.current;
          if (audio) setCurrentTime(audio.currentTime || 0);
        }}
        onEnded={onEnded}
      />

      <div className="bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.22),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_28%),linear-gradient(to_bottom,#111827,#09090b,#000000)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8">
            <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-green-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative grid gap-6 lg:grid-cols-[1.3fr_320px] items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm text-zinc-200 mb-4">
                  <Music className="w-4 h-4 text-green-400" />
                  Audio espiritual para la comunidad
                </div>

                <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">
                  LLDMPlay
                </h1>

                <p className="text-zinc-300 text-base sm:text-lg max-w-2xl">
                  La biblioteca de audio de la comunidad. Predicaciones, cantos,
                  testimonios, podcasts y más contenido para edificación espiritual.
                </p>

                <p className="text-zinc-500 text-sm mt-4">
                  {heroCategoryText}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      if (displayList.length > 0) {
                        setCurrentAudioId(displayList[0].id);
                        setIsPlaying(true);
                      }
                    }}
                    className="px-6 py-3 rounded-full bg-green-500 text-black font-semibold hover:scale-[1.02] transition"
                  >
                    Reproducir
                  </button>

                  <button
                    onClick={toggleShuffle}
                    className={`px-6 py-3 rounded-full border transition ${
                      shuffleMode
                        ? "border-green-500 bg-green-500/10 text-green-400"
                        : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    Shuffle
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5 shadow-2xl">
                <div className="aspect-square rounded-[24px] bg-gradient-to-br from-green-500/30 via-emerald-400/10 to-sky-500/20 border border-white/10 flex items-center justify-center">
                  <div className="text-center px-4">
                    <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-black/30 flex items-center justify-center border border-white/10">
                      <Disc3 className="w-10 h-10 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold">LLDMPlay</h2>
                    <p className="text-zinc-300 text-sm mt-2">
                      Sonidos para la comunidad
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <p className="text-zinc-400 text-xs">Audios activos</p>
                    <p className="text-xl font-bold mt-1">{allAudios.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <p className="text-zinc-400 text-xs">Categorías</p>
                    <p className="text-xl font-bold mt-1">{CATEGORY_ORDER.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar predicaciones, cantos, testimonios, podcast..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 py-4 text-sm outline-none focus:border-green-500 backdrop-blur-xl"
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold">Explorar categorías</h2>
              <button
                onClick={() => setSelectedCategory("Todas")}
                className={`text-sm px-4 py-2 rounded-full transition ${
                  selectedCategory === "Todas"
                    ? "bg-green-500 text-black font-semibold"
                    : "bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10"
                }`}
              >
                Ver todas
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoriesWithCounts.map((cat) => {
                const style = CATEGORY_STYLES[cat.name] || CATEGORY_STYLES.Otros;
                const Icon = style.icon;

                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`relative overflow-hidden rounded-[24px] border p-5 text-left transition hover:scale-[1.01] ${
                      selectedCategory === cat.name
                        ? "border-green-500 bg-green-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-100`}
                    />
                    <div className="relative">
                      <div className="h-12 w-12 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-lg">{cat.name}</h3>
                      <p className="text-sm text-zinc-300 mt-1">
                        {cat.count} audio{cat.count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold">Recientemente cargados</h2>
              {selectedCategory !== "Todas" ? (
                <div className="text-sm text-zinc-400">
                  Filtro activo: <span className="text-white">{selectedCategory}</span>
                </div>
              ) : null}
            </div>

            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-zinc-400">
                Cargando audios...
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
                {error}
              </div>
            ) : recentAudios.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-zinc-400">
                No hay audios disponibles.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                {recentAudios.map((audio) => {
                  const active = currentAudio?.id === audio.id;
                  const style =
                    CATEGORY_STYLES[audio.category] || CATEGORY_STYLES.Otros;
                  const Icon = style.icon;

                  return (
                    <button
                      key={audio.id}
                      onClick={() => playAudioById(audio.id)}
                      className={`text-left rounded-[28px] border overflow-hidden transition hover:scale-[1.01] ${
                        active
                          ? "border-green-500 bg-green-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div
                        className={`h-36 bg-gradient-to-br ${style.gradient} flex items-center justify-between p-5`}
                      >
                        <div className="h-14 w-14 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center">
                          <Icon className="w-7 h-7 text-white" />
                        </div>

                        <div className="h-12 w-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                          {active && isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 ml-0.5" />
                          )}
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold truncate">
                          {audio.title || "Sin título"}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1 truncate">
                          {audio.category}
                        </p>
                        <p className="text-sm text-zinc-500 mt-2 line-clamp-2">
                          {audio.description || "Contenido espiritual"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-10 space-y-8">
            {CATEGORY_ORDER.map((category) => {
              const list = groupedAudios[category] || [];
              if (!list.length) return null;

              const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.Otros;
              const Icon = style.icon;

              return (
                <section key={category}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{category}</h2>
                      <p className="text-sm text-zinc-400">
                        {list.length} audio{list.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/5 p-3 sm:p-4 space-y-2">
                    {list.map((audio) => {
                      const active = currentAudio?.id === audio.id;

                      return (
                        <AudioRow
                          key={audio.id}
                          audio={audio}
                          isActive={active}
                          isPlaying={isPlaying}
                          onPlay={() => playAudioById(audio.id)}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/90 backdrop-blur-2xl z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {!currentAudio ? (
            <div className="text-zinc-400 text-sm">
              Selecciona un audio para comenzar en LLDMPlay.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_220px] items-center">
              <div className="min-w-0">
                <p className="font-bold truncate">
                  {currentAudio.title || "Sin título"}
                </p>
                <p className="text-sm text-zinc-400 truncate">
                  {currentAudio.category || "Otros"}
                </p>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleShuffle}
                    className={`p-2 rounded-full transition ${
                      shuffleMode
                        ? "text-green-400 bg-white/10"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                    title="Shuffle"
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>

                  <button
                    onClick={playPrev}
                    className="p-2 rounded-full text-zinc-200 hover:bg-white/5"
                    title="Anterior"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="h-12 w-12 rounded-full bg-green-500 text-black flex items-center justify-center hover:scale-105 transition"
                    title={isPlaying ? "Pausar" : "Reproducir"}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={playNext}
                    className="p-2 rounded-full text-zinc-200 hover:bg-white/5"
                    title="Siguiente"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  <button
                    onClick={toggleRepeat}
                    className={`p-2 rounded-full transition ${
                      repeatMode
                        ? "text-green-400 bg-white/10"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                    title="Repeat"
                  >
                    <Repeat className="w-5 h-5" />
                  </button>
                </div>

                <div className="w-full flex items-center gap-3">
                  <span className="text-xs text-zinc-400 w-10 text-right">
                    {formatTime(currentTime)}
                  </span>

                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={1}
                    value={currentTime}
                    onChange={handleProgressChange}
                    className="w-full accent-green-500"
                  />

                  <span className="text-xs text-zinc-400 w-10">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-start lg:justify-end">
                <Volume2 className="w-5 h-5 text-zinc-400" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full max-w-[140px] accent-green-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
