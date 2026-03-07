import React, { useState, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, X, Music } from 'lucide-react';

// Global audio state - persists across page navigations
window.__radioPlayer = window.__radioPlayer || {
  audio: null,
  programs: [],
  currentIndex: -1,
  isPlaying: false,
  listeners: new Set(),
  isClosed: false,
};

function notify() {
  // Use setTimeout to ensure React picks up state changes
  setTimeout(() => {
    window.__radioPlayer.listeners.forEach(fn => fn());
  }, 0);
}

export function startGlobalProgram(programs, index) {
  const state = window.__radioPlayer;
  
  // Detener AzuraCast si está tocando
  if (window.pauseAzuraCast && typeof window.globalIsPlaying !== 'undefined') {
    try {
      const azuraCastModule = require('./AzuraCastPlayer');
      if (azuraCastModule.useAzuraCastPlayer) {
        window.pauseAzuraCast();
      }
    } catch (e) {
      // Si no se puede importar, intentar pausar directamente
      if (window.pauseAzuraCast) {
        window.pauseAzuraCast();
      }
    }
  }
  
  // Stop previous audio
  if (state.audio) {
    state.audio.pause();
    state.audio.onended = null;
    state.audio.onerror = null;
    state.audio = null;
  }

  state.programs = [...programs]; // copy to avoid reference issues
  state.currentIndex = index;

  const program = programs[index];
  if (!program?.audio_url) return;

  const audio = new Audio(program.audio_url);
  state.audio = audio;
  state.isPlaying = true;
  notify();

  audio.play().catch(() => {
    state.isPlaying = false;
    notify();
  });

  audio.onended = () => {
    const next = (state.currentIndex + 1) % state.programs.length;
    startGlobalProgram(state.programs, next);
  };

  audio.onerror = () => {
    state.isPlaying = false;
    notify();
  };
}

export function stopGlobalPlayer() {
  const state = window.__radioPlayer;
  if (state.audio) {
    state.audio.pause();
    state.audio.onended = null;
    state.audio.onerror = null;
    state.audio = null;
  }
  state.isPlaying = false;
  state.currentIndex = -1;
  state.programs = [];
  notify();
}

export function closeMiniPlayer() {
  const state = window.__radioPlayer;
  stopGlobalPlayer();
  state.isClosed = true;
  notify();
}

// Exponer globalmente para que AzuraCast pueda detener este reproductor
if (typeof window !== 'undefined') {
  window.stopGlobalPlayer = stopGlobalPlayer;
}

function useGlobalPlayer() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    window.__radioPlayer.listeners.add(listener);
    return () => window.__radioPlayer.listeners.delete(listener);
  }, []);

  return window.__radioPlayer;
}

export default function GlobalMiniPlayer() {
  const state = useGlobalPlayer();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef(null);

  const program = state.programs[state.currentIndex];
  const isActive = state.currentIndex >= 0 && state.audio;

  useEffect(() => {
    if (!state.audio) return;

    const audio = state.audio;
    const onMeta = () => setDuration(audio.duration || 0);
    audio.addEventListener('loadedmetadata', onMeta);
    if (audio.duration) setDuration(audio.duration);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (audio) setCurrentTime(audio.currentTime || 0);
    }, 500);

    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.audio, state.currentIndex]);

  // Solo mostrar si hay audio activo y el usuario no lo cerró
  if (!isActive || state.isClosed) return null;

  const togglePlay = () => {
    if (!state.audio) return;
    if (state.isPlaying) {
      state.audio.pause();
      state.isPlaying = false;
    } else {
      state.audio.play();
      state.isPlaying = true;
    }
    notify();
  };

  const handleNext = () => {
    if (state.programs.length === 0) return;
    const next = (state.currentIndex + 1) % state.programs.length;
    startGlobalProgram(state.programs, next);
  };

  const handlePrev = () => {
    if (state.programs.length === 0) return;
    const prev = (state.currentIndex - 1 + state.programs.length) % state.programs.length;
    startGlobalProgram(state.programs, prev);
  };

  const handleSeek = (val) => {
    if (state.audio) {
      state.audio.currentTime = val[0];
      setCurrentTime(val[0]);
    }
  };

  const handleVolume = (val) => {
    setVolume(val[0]);
    setMuted(false);
    if (state.audio) state.audio.volume = val[0];
  };

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    if (state.audio) state.audio.volume = newMuted ? 0 : volume;
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-gray-950 border-t border-cyan-500/50 shadow-[0_-4px_20px_rgba(0,0,0,0.8)]">
      {/* Interactive Progress bar with draggable slider */}
      {isActive && (
        <div className="px-3 py-1.5 bg-gray-900">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="cursor-pointer [&_[role=slider]]:bg-white [&_[role=slider]]:border-white [&_.bg-primary]:bg-cyan-500"
          />
        </div>
      )}

      <div className="px-3 py-2">
        {/* Main row */}
        <div className="flex items-center gap-2">
          {/* Song info */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Music className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="text-cyan-400 font-semibold text-sm truncate">
                {program ? program.title : 'Mini Reproductor Radio Personal'}
              </p>
              <p className="text-gray-500 text-[11px] truncate">
                {isActive 
                  ? `${program.created_by?.split('@')[0] || 'Radio Personal'} · ${formatTime(currentTime)}/${formatTime(duration)}`
                  : 'Selecciona un programa de Tu Radio Personal'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            <button onClick={handlePrev} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition active:scale-95">
              <SkipBack className="w-4 h-4" />
            </button>
            <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-cyan-500 text-black flex items-center justify-center hover:bg-cyan-400 transition active:scale-95">
              {state.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button onClick={handleNext} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition active:scale-95">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Volume - desktop only */}
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={toggleMute} className="text-gray-400 hover:text-white">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <Slider
              value={[muted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolume}
              className="w-20"
            />
          </div>

          {/* Close */}
          <button onClick={closeMiniPlayer} className="text-gray-500 hover:text-white ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Safe area padding for phones with gesture bars */}
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </div>
  );
}