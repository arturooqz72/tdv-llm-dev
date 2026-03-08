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

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function normalizeCategory(category) {
  if (!category) return "Otros";
  const trimmed = String(category).trim();
  const found = CATEGORY_ORDER.find(
    (item) => item.toLowerCase() === trimmed.toLowerCase()
  );
  return found || "Otros";
}

function shuffleArray(array, currentIndex = 0) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  if (copy.length > 1 && currentIndex >= 0) {
    const currentItem = array[currentIndex];
    const newIndex = copy.findIndex((item) => item.id === currentItem?.id);
    if (newIndex > 0) {
      [copy[0], copy[newIndex]] = [copy[newIndex], copy[0]];
    }
  }

  return copy;
}

export default function MyAudios() {
  const audioRef = useRef(null);

  const [allAudios, setAllAudios] = useState([]);
  const [displayList, setDisplayList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  const [currentIndex, setCurrentIndex] = useState(-1);
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
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const cleaned = (data || []).map((item) => ({
        ...item,
        category: normalizeCategory(item.category),
      }));

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
      const q = search.toLowerCase();
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

    result.sort((a, b) => {
      const aIndex = CATEGORY_ORDER.indexOf(a.category);
      const bIndex = CATEGORY_ORDER.indexOf(b.category);

      if (aIndex !== bIndex) return aIndex - bIndex;

      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();
      return bDate - aDate;
    });

    return result;
  }, [allAudios, selectedCategory, search]);

  useEffect(() => {
    if (shuffleMode) {
      const shuffled = shuffleArray(filteredAudios, currentIndex >= 0 ? currentIndex : 0);
      setDisplayList(shuffled);
    } else {
      setDisplayList(filteredAudios);
    }
  }, [filteredAudios, shuffleMode]);

  useEffect(() => {
    if (!displayList.length) {
      setCurrentIndex(-1);
      setIsPlaying(false);
      return;
    }

    if (currentIndex === -1) return;

    const currentAudio = displayList[currentIndex];
    if (!currentAudio) {
      setCurrentIndex(0);
    }
  }, [displayList, currentIndex]);

  const currentAudio = currentIndex >= 0 ? displayList[currentIndex] : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudio?.file_url) return;

    audio.src = currentAudio.file_url;
    audio.load();

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
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error("Error al reproducir:", err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  function playAudio(index) {
    if (index < 0 || index >= displayList.length) return;
    setCurrentIndex(index);
    setIsPlaying(true);
  }

  function togglePlayPause() {
    if (!displayList.length) return;

    if (currentIndex === -1) {
      setCurrentIndex(0);
      setIsPlaying(true);
      return;
    }

    setIsPlaying((prev) => !prev);
  }

  function playNext() {
    if (!displayList.length) return;

    if (repeatMode && currentIndex >= 0) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      return;
    }

    if (currentIndex === -1) {
      setCurrentIndex(0);
      setIsPlaying(true);
      return;
    }

    const nextIndex = currentIndex + 1;

    if (nextIndex < displayList.length) {
      setCurrentIndex(nextIndex);
      setIsPlaying(true);
    } else {
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  }

  function playPrev() {
    if (!displayList.length) return;

    if (currentIndex === -1) {
      setCurrentIndex(0);
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
      setCurrentIndex(prevIndex);
      setIsPlaying(true);
    } else {
      setCurrentIndex(displayList.length - 1);
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
    const counts = CATEGORY_ORDER.map((category) => ({
      name: category,
      count: allAudios.filter((audio) => normalizeCategory(audio.category) === category).length,
    }));

    return counts;
  }, [allAudios]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white pb-40">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
              <Music className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mis Audios</h1>
              <p className="text-zinc-400 text-sm">
                Reproductor estilo playlist para Team Desvelados
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 h-fit">
            <div className="mb-4">
              <label className="text-sm text-zinc-300 mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar audio..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-300 mb-3 block">
                Categorías
              </label>

              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory("Todas")}
                  className={`w-full text-left px-3 py-2 rounded-xl transition ${
                    selectedCategory === "Todas"
                      ? "bg-green-500 text-black font-semibold"
                      : "bg-zinc-950 hover:bg-zinc-800 text-zinc-200"
                  }`}
                >
                  Todas
                </button>

                {categoriesWithCounts.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-xl transition ${
                      selectedCategory === cat.name
                        ? "bg-green-500 text-black font-semibold"
                        : "bg-zinc-950 hover:bg-zinc-800 text-zinc-200"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs opacity-80">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold">
                {selectedCategory === "Todas" ? "Todos los audios" : selectedCategory}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                {filteredAudios.length} audio{filteredAudios.length === 1 ? "" : "s"} encontrados
              </p>
            </div>

            {loading ? (
              <div className="p-6 text-zinc-400">Cargando audios...</div>
            ) : error ? (
              <div className="p-6 text-red-400">{error}</div>
            ) : displayList.length === 0 ? (
              <div className="p-6 text-zinc-400">No hay audios disponibles.</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {displayList.map((audio, index) => {
                  const active = currentAudio?.id === audio.id;

                  return (
                    <div
                      key={audio.id}
                      className={`px-4 sm:px-6 py-4 flex items-center gap-4 transition ${
                        active ? "bg-green-500/10" : "hover:bg-zinc-800/60"
                      }`}
                    >
                      <button
                        onClick={() => playAudio(index)}
                        className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition ${
                          active
                            ? "bg-green-500 text-black"
                            : "bg-zinc-800 text-white hover:bg-green-500 hover:text-black"
                        }`}
                      >
                        {active && isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{audio.title || "Sin título"}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">
                            {audio.category || "Otros"}
                          </span>
                        </div>

                        <p className="text-sm text-zinc-400 line-clamp-2">
                          {audio.description || "Sin descripción"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-black/95 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {!currentAudio ? (
            <div className="text-zinc-400 text-sm">
              Selecciona un audio para empezar a reproducir.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_220px] items-center">
              <div className="min-w-0">
                <p className="font-semibold truncate">{currentAudio.title || "Sin título"}</p>
                <p className="text-sm text-zinc-400 truncate">
                  {currentAudio.category || "Otros"}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleShuffle}
                    className={`p-2 rounded-full transition ${
                      shuffleMode ? "text-green-400 bg-zinc-800" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>

                  <button
                    onClick={playPrev}
                    className="p-2 rounded-full text-zinc-200 hover:bg-zinc-800"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="h-12 w-12 rounded-full bg-green-500 text-black flex items-center justify-center hover:scale-105 transition"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={playNext}
                    className="p-2 rounded-full text-zinc-200 hover:bg-zinc-800"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  <button
                    onClick={toggleRepeat}
                    className={`p-2 rounded-full transition ${
                      repeatMode ? "text-green-400 bg-zinc-800" : "text-zinc-400 hover:text-white"
                    }`}
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
