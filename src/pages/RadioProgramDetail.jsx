import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Radio, Clock, Calendar, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ProgramComments from '@/components/radio/ProgramComments';
import ProgramRequestForm from '@/components/radio/ProgramRequestForm';
import FavoriteStationButton from '@/components/radio/FavoriteStationButton';
import { format, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RadioProgramDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const programId = urlParams.get('id');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.log('Usuario no autenticado');
      }
    };
    loadUser();
  }, []);

  const { data: program, isLoading } = useQuery({
    queryKey: ['program-detail', programId],
    queryFn: async () => {
      const programs = await base44.entities.RadioProgram.filter({ id: programId });
      return programs[0] || null;
    },
    enabled: !!programId
  });

  const { data: station } = useQuery({
    queryKey: ['station', program?.station_id],
    queryFn: async () => {
      if (!program?.station_id) return null;
      const stations = await base44.entities.RadioStation.filter({ id: program.station_id });
      return stations[0] || null;
    },
    enabled: !!program?.station_id
  });

  const { data: creator } = useQuery({
    queryKey: ['creator', program?.created_by],
    queryFn: async () => {
      if (!program?.created_by) return null;
      const users = await base44.entities.User.filter({ email: program.created_by });
      return users[0] || null;
    },
    enabled: !!program?.created_by
  });

  const { data: similarPrograms = [] } = useQuery({
    queryKey: ['similar-programs', program?.station_id, programId],
    queryFn: async () => {
      if (!program?.station_id) return [];
      const programs = await base44.entities.RadioProgram.filter({ 
        station_id: program.station_id,
        is_active: true
      }, '-created_date', 6);
      return programs.filter(p => p.id !== programId).slice(0, 4);
    },
    enabled: !!program?.station_id
  });

  useEffect(() => {
    if (program?.audio_url && audioRef.current) {
      audioRef.current.src = program.audio_url;
      audioRef.current.volume = volume / 100;
      audioRef.current.load();
    }
  }, [program]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-64 w-full rounded-3xl mb-6 bg-gray-800" />
          <Skeleton className="h-8 w-3/4 mb-4 bg-gray-800" />
          <Skeleton className="h-4 w-1/2 bg-gray-800" />
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <p className="text-gray-400">Programa no encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Player Section */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-600 shadow-2xl">
              <CardContent className="p-8">
                {/* Album Art */}
                <div className="text-center mb-8">
                  <div className="relative w-64 h-64 mx-auto mb-6">
                    <div className={`w-full h-full rounded-3xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center ${isPlaying ? 'animate-pulse' : ''}`}>
                      <Radio className="w-32 h-32 text-black" />
                    </div>
                    {isPlaying && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                        <div className="flex gap-1">
                          {[0, 0.1, 0.2, 0.3, 0.2, 0.1].map((delay, i) => (
                            <div key={i} className="w-1 h-8 bg-yellow-500 animate-pulse" style={{ animationDelay: `${delay}s` }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {station && (
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Badge className="bg-yellow-600 text-black">
                        {station.name}
                      </Badge>
                      <FavoriteStationButton 
                        stationId={station.id} 
                        currentUser={currentUser}
                      />
                    </div>
                  )}

                  <h1 className="text-3xl font-bold text-white mb-4">
                    {program.title}
                  </h1>

                  {program.description && (
                    <p className="text-gray-400 max-w-xl mx-auto mb-4">
                      {program.description}
                    </p>
                  )}

                  {/* Creator Info */}
                  {creator && (
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 overflow-hidden">
                        {creator.profile_picture_url ? (
                          <img src={creator.profile_picture_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-black font-semibold">
                            {creator.full_name?.charAt(0).toUpperCase() || creator.email?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-gray-500">Creado por</p>
                        <p className="text-sm text-white font-medium">
                          {creator.full_name || creator.email.split('@')[0]}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Schedule Info */}
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mb-4">
                    {program.schedule_time && (
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {program.schedule_time}
                      </span>
                    )}
                    {program.plays_count > 0 && (
                      <span>▶ {program.plays_count} reproducciones</span>
                    )}
                  </div>

                  {/* Next Broadcast */}
                  {(program.next_broadcast || program.scheduled_date) && isFuture(new Date(program.next_broadcast || program.scheduled_date)) && (
                    <div className="bg-blue-900/50 border border-blue-600 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-center gap-2 text-blue-400">
                        <Calendar className="w-5 h-5" />
                        <div className="text-center">
                          <p className="text-xs mb-1">Próxima transmisión</p>
                          <p className="font-semibold">
                            {format(new Date(program.next_broadcast || program.scheduled_date), "EEEE, d 'de' MMMM 'a las' HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Request Button */}
                  {currentUser && (
                    <div className="mb-4">
                      <ProgramRequestForm currentUser={currentUser} currentProgram={program} />
                    </div>
                  )}
                </div>

                <audio
                  ref={audioRef}
                  onError={(e) => console.error('Error en el audio:', e)}
                  preload="auto"
                  className="hidden"
                />

                {/* Progress Bar */}
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

                {/* Play Button */}
                <div className="flex items-center justify-center mb-6">
                  <Button
                    onClick={handlePlayPause}
                    size="lg"
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black shadow-lg shadow-yellow-500/50"
                  >
                    {isPlaying ? (
                      <Pause className="w-10 h-10" />
                    ) : (
                      <Play className="w-10 h-10 ml-1" />
                    )}
                  </Button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-4 max-w-md mx-auto">
                  <Button
                    onClick={() => setIsMuted(!isMuted)}
                    size="icon"
                    variant="ghost"
                    className="text-yellow-500"
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
              </CardContent>
            </Card>
          </div>

          {/* Comments Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ProgramComments program={program} currentUser={currentUser} />
            </div>
          </div>
        </div>

        {/* Similar Programs */}
        {similarPrograms.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              Más de {station?.name || 'esta estación'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarPrograms.map((prog) => (
                <Link key={prog.id} to={createPageUrl(`RadioProgramDetail?id=${prog.id}`)}>
                  <Card className="bg-gray-800 border-gray-700 hover:border-yellow-600 transition-all h-full cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="w-full aspect-square bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl mb-3 flex items-center justify-center group-hover:from-yellow-500/30 group-hover:to-yellow-600/30 transition-all">
                        <Radio className="w-12 h-12 text-yellow-500" />
                      </div>
                      <h3 className="text-white font-semibold mb-1 line-clamp-2">{prog.title}</h3>
                      {prog.description && (
                        <p className="text-gray-400 text-xs line-clamp-2">{prog.description}</p>
                      )}
                      {prog.schedule_time && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                          <Clock className="w-3 h-3" />
                          {prog.schedule_time}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}