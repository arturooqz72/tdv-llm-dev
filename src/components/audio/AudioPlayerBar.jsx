import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function AudioPlayerBar({ audio, isPlaying, onToggle }) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audio?.audio_url) return;

    const el = new Audio(audio.audio_url);
    audioRef.current = el;

    el.addEventListener('loadedmetadata', () => setDuration(el.duration));
    el.addEventListener('timeupdate', () => setCurrentTime(el.currentTime));
    el.addEventListener('ended', () => onToggle(null));

    if (isPlaying) el.play();

    return () => {
      el.pause();
      el.src = '';
    };
  }, [audio?.id]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handleSeek = (val) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = val[0];
    setCurrentTime(val[0]);
  };

  const skip = (seconds) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
  };

  if (!audio) return null;

  return (
    <div className="bg-gray-800/80 border border-cyan-500/30 rounded-xl p-3 mt-2 space-y-2">
      <div className="flex items-center gap-3">
        <button onClick={() => skip(-10)} className="text-gray-400 hover:text-white transition-colors" title="Retroceder 10s">
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={() => onToggle(isPlaying ? null : audio)}
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            isPlaying ? 'bg-cyan-500 text-black' : 'bg-gray-700 text-white hover:bg-cyan-500 hover:text-black'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button onClick={() => skip(10)} className="text-gray-400 hover:text-white transition-colors" title="Adelantar 10s">
          <SkipForward className="w-4 h-4" />
        </button>

        <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">{formatTime(currentTime)}</span>
        <div className="flex-1">
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={0.5}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>
        <span className="text-xs text-gray-400 w-10 flex-shrink-0">{formatTime(duration)}</span>
      </div>
    </div>
  );
}