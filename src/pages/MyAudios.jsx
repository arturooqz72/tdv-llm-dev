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
        }));

      setAllAudios(cleaned);
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudieron cargar los audios.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pb-44">

      {/* resto del archivo sigue exactamente igual */}

    </div>
  );
}
