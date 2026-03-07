import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Radio, Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, Repeat, Repeat1, Settings2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AutoPlay247({ stationId = null }) {
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const filterNodesRef = useRef([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState('all');
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0]);

  const presets = {
    normal: [0, 0, 0, 0, 0],
    bass: [12, 8, 0, -5, -8],
    treble: [-8, -5, 0, 8, 12],
    pop: [5, 3, -2, 2, 5],
    rock: [8, 5, -3, 3, 8],
    jazz: [5, 3, 2, -3, -5]
  };

  const frequencies = [60, 250, 1000, 4000, 16000];

  const { data: programs = [] } = useQuery({
    queryKey: ['autoplay-programs', stationId],
    queryFn: async () => {
      const query = stationId 
        ? { is_active: true, station_id: stationId }
        : { is_active: true };
      const progs = await base44.entities.RadioProgram.filter(query, '-created_date', 100);
      // Ciclar programas para crear una lista más larga
      return progs.length > 0 ? [...progs, ...progs, ...progs] : [];
    },
    staleTime: 1200000, // 20 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false
  });

  const { data: station } = useQuery({
    queryKey: ['station', stationId],
    queryFn: async () => {
      if (!stationId) return null;
      const stations = await base44.entities.RadioStation.filter({ id: stationId });
      return stations[0] || null;
    },
    enabled: !!stationId,
    staleTime: 1200000, // 20 minutos
    refetchOnWindowFocus: false,
    refetchInterval: false
  });

  const currentProgram = programs[currentIndex];

  // Inicializar Web Audio API
  useEffect(() => {
    if (!audioRef.current || audioContextRef.current) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaElementAudioSource(audioRef.current);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const filters = frequencies.map(freq => {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });

      source.connect(filters[0]);
      filters.forEach((filter, i) => {
        if (i < filters.length - 1) {
          filter.connect(filters[i + 1]);
        }
      });
      filters[filters.length - 1].connect(analyser);
      analyser.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      filterNodesRef.current = filters;
    } catch (err) {
      console.log('Web Audio API no disponible:', err);
    }
  }, []);

  // Auto-iniciar reproducción
  useEffect(() => {
    if (programs.length > 0 && audioRef.current && !isPlaying) {
      const timer = setTimeout(() => {
        audioRef.current?.play()?.then(() => {
          setIsPlaying(true);
        }).catch(err => console.log('Autoplay bloqueado:', err));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [programs]);

  // Cambiar programa
  useEffect(() => {
    if (programs.length > 0 && audioRef.current && programs[currentIndex]?.audio_url) {
      audioRef.current.src = programs[currentIndex].audio_url;
      audioRef.current.volume = volume / 100;
      audioRef.current.load();
      
      if (isPlaying) {
        audioRef.current.play().catch(err => console.log('Error al reproducir:', err));
      }
    }
  }, [currentIndex, programs]);

  // Control de volumen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Listeners de tiempo
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const handlePlayPause = async () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error al reproducir:', error);
      }
    }
  };

  const handleNext = () => {
    if (repeatMode === 'one') return; // Si está en repeat 1, no avanza
    const nextIndex = (currentIndex + 1) % programs.length;
    setCurrentIndex(nextIndex);
  };

  const handlePrevious = () => {
    const prevIndex = currentIndex === 0 ? programs.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
  };

  const handleSeek = (value) => {
    const newTime = (value[0] / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRepeatMode = () => {
    const modes = ['all', 'one', 'off'];
    const currentIdx = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIdx + 1) % modes.length]);
  };

  const updateEqualizer = (newBands) => {
    setEqBands(newBands);
    if (filterNodesRef.current.length > 0) {
      filterNodesRef.current.forEach((filter, i) => {
        filter.gain.value = newBands[i];
      });
    }
  };

  const applyPreset = (presetName) => {
    const preset = presets[presetName] || presets.normal;
    updateEqualizer(preset);
  };

  const resetEqualizer = () => {
    updateEqualizer([0, 0, 0, 0, 0]);
  };

  if (programs.length === 0) {
    return (
      <Card className="bg-gray-800 border-cyan-500">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">No hay programas disponibles para esta estación</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-cyan-500 shadow-2xl shadow-cyan-500/20">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <div className={`w-full h-full rounded-full bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center ${isPlaying ? 'animate-pulse' : ''}`}>
              <Radio className="w-16 h-16 text-black" />
            </div>
            {isPlaying && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                <div className="flex gap-1">
                  {[0, 0.1, 0.2, 0.3, 0.2, 0.1].map((delay, i) => (
                    <div key={i} className="w-1 h-6 bg-cyan-400 animate-pulse" style={{ animationDelay: `${delay}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Badge className="mb-3 bg-red-600 text-white animate-pulse">
            ● RADIO 24/7 EN VIVO
          </Badge>
          
          {station && (
            <Badge className="mb-2 bg-cyan-500 text-black">
              {station.name}
            </Badge>
          )}

          <h3 className="text-2xl font-bold text-white mb-2 mt-2">
            {currentProgram?.title || 'Sin título'}
          </h3>
          
          {currentProgram?.description && (
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-2">
              {currentProgram.description}
            </p>
          )}

          <div className="text-cyan-400 font-mono text-sm">
            {isPlaying ? '● TRANSMITIENDO' : '⏸ PAUSADO'}
          </div>
        </div>

        <audio
          ref={audioRef}
          onEnded={handleNext}
          onError={(e) => {
            console.error('Error en el audio:', e);
            handleNext();
          }}
          preload="auto"
          className="hidden"
        />

        {/* Barra de progreso */}
        <div className="mb-6">
          <Slider
            value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controles principales */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            onClick={handlePrevious}
            size="icon"
            variant="outline"
            className="rounded-full border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black"
            title="Anterior"
          >
            <SkipBack className="w-5 h-5" />
          </Button>

          <Button
            onClick={handlePlayPause}
            size="lg"
            className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-600 hover:to-cyan-500 text-black shadow-lg shadow-cyan-500/50"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </Button>

          <Button
            onClick={handleNext}
            size="icon"
            variant="outline"
            className="rounded-full border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black"
            title="Siguiente"
          >
            <SkipForward className="w-5 h-5" />
          </Button>

          <Button
            onClick={toggleRepeatMode}
            size="icon"
            variant={repeatMode === 'off' ? 'outline' : 'default'}
            className={`rounded-full ${
              repeatMode === 'off' 
                ? 'border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black'
                : 'bg-cyan-500 text-black hover:bg-cyan-600'
            }`}
            title={`Repetir: ${repeatMode === 'all' ? 'Todos' : repeatMode === 'one' ? 'Uno' : 'Desactivado'}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </Button>

          <Button
            onClick={() => setShowEqualizer(!showEqualizer)}
            size="icon"
            variant={showEqualizer ? 'default' : 'outline'}
            className={`rounded-full ${
              showEqualizer
                ? 'bg-cyan-500 text-black hover:bg-cyan-600'
                : 'border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black'
            }`}
            title="Ecualizador"
          >
            <Settings2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Ecualizador */}
        {showEqualizer && (
          <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-cyan-500">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-cyan-400 font-semibold">Ecualizador</h4>
              <Button
                onClick={() => setShowEqualizer(false)}
                size="icon"
                variant="ghost"
                className="w-6 h-6 text-gray-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Preajustes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
              {Object.keys(presets).map((preset) => (
                <Button
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  variant={JSON.stringify(eqBands) === JSON.stringify(presets[preset]) ? 'default' : 'outline'}
                  size="sm"
                  className={`text-xs capitalize ${
                    JSON.stringify(eqBands) === JSON.stringify(presets[preset])
                      ? 'bg-cyan-500 text-black hover:bg-cyan-600'
                      : 'border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black'
                  }`}
                >
                  {preset}
                </Button>
              ))}
            </div>

            {/* Bandas del ecualizador */}
            <div className="flex items-end justify-between gap-3 mb-4">
              {eqBands.map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="text-xs text-gray-400 mb-2 text-center">
                    {frequencies[i] < 1000 ? frequencies[i] + 'Hz' : (frequencies[i] / 1000) + 'kHz'}
                  </div>
                  <div className="h-32 bg-gray-800 rounded relative w-full flex items-end justify-center">
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      value={value}
                      onChange={(e) => {
                        const newBands = [...eqBands];
                        newBands[i] = parseInt(e.target.value);
                        updateEqualizer(newBands);
                      }}
                      className="absolute h-full w-full opacity-0 cursor-pointer"
                      style={{ writingMode: 'bt-lr' }}
                    />
                    <div
                      className="w-1.5 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded"
                      style={{
                        height: `${Math.max(0, (value + 20) / 40 * 100)}%`,
                        transition: 'height 0.1s'
                      }}
                    />
                  </div>
                  <div className="text-xs text-cyan-400 mt-2 font-semibold w-full text-center">
                    {value > 0 ? '+' : ''}{value}dB
                  </div>
                </div>
              ))}
            </div>

            {/* Botón reset */}
            <Button
              onClick={resetEqualizer}
              variant="outline"
              size="sm"
              className="w-full border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black"
            >
              Restablecer
            </Button>
          </div>
        )}

        {/* Control de volumen */}
        <div className="flex items-center gap-4 max-w-xs mx-auto">
          <Button
            onClick={() => setIsMuted(!isMuted)}
            size="icon"
            variant="ghost"
            className="text-cyan-400"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={(val) => {
              setVolume(val[0]);
              if (val[0] > 0) setIsMuted(false);
            }}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-gray-400 w-12 text-right">
            {isMuted ? 0 : volume}%
          </span>
        </div>

        {/* Info y estado */}
        <div className="mt-4 space-y-2 text-center text-xs text-gray-400">
          <div>
            Programa {currentIndex + 1} de {programs.length}
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <span className={`px-2 py-1 rounded ${isPlaying ? 'bg-green-600 text-green-100' : 'bg-gray-700'}`}>
              {isPlaying ? '▶ Reproduciendo' : '⏸ Pausado'}
            </span>
            <span className="bg-gray-700 px-2 py-1 rounded">
              {repeatMode === 'all' ? '🔁 Repetir todos' : repeatMode === 'one' ? '🔁 Repetir uno' : '➡️ Sin repetir'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}