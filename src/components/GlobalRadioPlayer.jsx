import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, X, Music, Minimize2, Cast } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export default function GlobalRadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => parseInt(localStorage.getItem('globalRadio_volume') || '70'));
  const [isMuted, setIsMuted] = useState(false);

  const [isMinimized, setIsMinimized] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const [showVisualizer, setShowVisualizer] = useState(true);

  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);

  // ✅ Configurar stream de radio web 24/7 igual que en TuRadioPersonal
  useEffect(() => {
    if (!audioRef.current) return;
    
    audioRef.current.src = 'https://radio.team-desveladoslldm.com/radio/8000/radio.mp3';
    audioRef.current.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      localStorage.setItem('globalRadio_isPlaying', 'false');
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setIsVisible(true);
      localStorage.setItem('globalRadio_isPlaying', 'true');
    } catch (error) {
      console.error('Error al reproducir:', error);
      setIsPlaying(false);
    }
  };

  const toggleMute = () => setIsMuted(v => !v);

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsVisible(false);
    localStorage.setItem('globalRadio_isPlaying', 'false');
    localStorage.setItem('globalRadio_visible', 'false');

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const handleCast = async () => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Radio TEAM DESVELADOS 24/7',
        artist: 'TEAM DESVELADOS LLDM',
        album: 'Radio en Vivo',
        artwork: [
          {
            src: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6965d0214fc84ccf68275f1d/ecac80ce7_teamdesveladosLLDM.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      });

      navigator.mediaSession.setActionHandler('play', handlePlayPause);
      navigator.mediaSession.setActionHandler('pause', handlePlayPause);
    }

    if ('share' in navigator) {
      try {
        await navigator.share({
          title: 'Radio TEAM DESVELADOS 24/7',
          text: 'Escuchando Radio TEAM DESVELADOS 24/7',
          url: window.location.href
        });
      } catch {
        // cancelado
      }
    }
  };

  // Visualizer
  useEffect(() => {
    if (!audioRef.current || !canvasRef.current || !isPlaying || !showVisualizer || isMinimized) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaElementSource(audioRef.current);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      analyserRef.current.fftSize = 128;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      if (!showVisualizer || !isPlaying) return;

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      // ✅ Fondo del canvas transparente para que el player azul se vea
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / dataArrayRef.current.length;
      let x = 0;

      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const barHeight = (dataArrayRef.current[i] / 255) * height * 0.85;

        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, '#0EA5E9');
        gradient.addColorStop(1, '#22D3EE');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, showVisualizer, isMinimized]);

  if (!isVisible) {
    return <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />;
  }

  return (
    <>
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      <div className={`fixed ${isMinimized ? 'bottom-6 right-6' : 'bottom-0 left-0 right-0'} z-50 transition-all duration-300`}>
        {isMinimized ? (
          <div className="relative">
            <div
              className="bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-2xl p-4 shadow-2xl cursor-pointer hover:scale-105 transition-transform border-2 border-cyan-600"
              onClick={() => {
                setIsMinimized(false);
                localStorage.setItem('globalRadio_minimized', 'false');
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <Music className={`w-8 h-8 text-black ${isPlaying ? 'animate-pulse' : ''}`} />
                <div className="flex gap-1">
                  {isPlaying && [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-1 bg-black rounded-full"
                      style={{ height: '20px', animation: `pulse 0.6s ease-in-out ${i * 0.1}s infinite alternate` }}
                    />
                  ))}
                </div>
              </div>
            </div>
            {isPlaying && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white" />
            )}
          </div>
        ) : (
          // ✅ AQUÍ cambiamos TODO el fondo a azul bajito
          <div className="global-radio-player bg-gradient-to-b from-[#E6F4FF] via-[#D3ECFF] to-[#BFE4FF] border-t-2 border-cyan-500 shadow-2xl relative">
            {showVisualizer && (
              <canvas
                ref={canvasRef}
                width={800}
                height={60}
                className="absolute top-0 left-0 w-full h-full opacity-35 pointer-events-none"
              />
            )}

            <div className="container mx-auto px-4 py-3 relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-slate-900 font-bold text-sm truncate">
                    Radio TEAM DESVELADOS 24/7
                  </h4>
                  <p className="text-slate-700 text-xs truncate">
                    En vivo - Transmisión continua
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    onClick={handlePlayPause}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-600 hover:to-cyan-500 text-black rounded-full w-12 h-12"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </Button>
                </div>

                <div className="hidden lg:flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={toggleMute} className="text-slate-900 hover:bg-white/40">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={(val) => {
                      setVolume(val[0]);
                      localStorage.setItem('globalRadio_volume', val[0].toString());
                    }}
                    max={100}
                    step={1}
                    className="w-24"
                  />
                </div>

                <Button size="icon" variant="ghost" onClick={handleCast} className="text-slate-900 hover:bg-white/40 hidden md:flex" title="Compartir">
                  <Cast className="w-5 h-5" />
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsMinimized(true);
                      localStorage.setItem('globalRadio_minimized', 'true');
                    }}
                    className="text-slate-700 hover:bg-white/40"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleClose} className="text-slate-700 hover:bg-white/40 hover:text-red-600">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}