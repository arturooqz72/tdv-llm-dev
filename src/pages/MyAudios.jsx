import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Music, Play, Pause, Clock, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  approved: { label: 'Aprobado', color: 'bg-green-500/20 text-green-400', icon: CheckCircle2 },
  rejected: { label: 'Rechazado', color: 'bg-red-500/20 text-red-400', icon: XCircle },
};

export default function MyAudios() {
  const [currentUser, setCurrentUser] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [audioEl, setAudioEl] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: audios = [], isLoading } = useQuery({
    queryKey: ['my-audios', currentUser?.email, currentUser?.role],
    queryFn: () => {
      if (currentUser?.role === 'admin') {
        return base44.entities.AudioFile.list('-created_date');
      }
      return base44.entities.AudioFile.filter({ created_by: currentUser.email }, '-created_date');
    },
    enabled: !!currentUser?.email,
  });

  const handlePlay = (audio) => {
    if (playingId === audio.id) {
      audioEl?.pause();
      setPlayingId(null);
      setAudioEl(null);
      return;
    }

    if (audioEl) {
      audioEl.pause();
    }

    const newAudio = new Audio(audio.audio_url);
    newAudio.play();
    newAudio.onended = () => {
      setPlayingId(null);
      setAudioEl(null);
    };
    setPlayingId(audio.id);
    setAudioEl(newAudio);
  };

  useEffect(() => {
    return () => {
      if (audioEl) audioEl.pause();
    };
  }, [audioEl]);

  const handleDelete = async (audio) => {
    if (!confirm(`¿Estás seguro de eliminar "${audio.title}"?`)) return;
    if (playingId === audio.id) {
      audioEl?.pause();
      setPlayingId(null);
      setAudioEl(null);
    }
    await base44.entities.AudioFile.delete(audio.id);
    queryClient.invalidateQueries({ queryKey: ['my-audios'] });
  };

  const isAdmin = currentUser?.role === 'admin';

  if (!currentUser) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <Music className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{isAdmin ? 'Todos los Audios' : 'Mis Audios'}</h1>
          <p className="text-gray-400 text-sm">{isAdmin ? 'Gestiona todos los audios de la comunidad' : 'Audios que has subido a la comunidad'}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : audios.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-700">
          <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No has subido ningún audio todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {audios.map((audio) => {
            const status = statusConfig[audio.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            const isPlaying = playingId === audio.id;

            return (
              <div
                key={audio.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isPlaying
                    ? 'bg-cyan-500/10 border-cyan-500/40'
                    : 'bg-gray-900/60 border-gray-700 hover:border-gray-600'
                }`}
              >
                <button
                  onClick={() => handlePlay(audio)}
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
                   {isAdmin && audio.created_by && (
                     <span className="text-gray-600 text-xs">• {audio.created_by.split('@')[0]}</span>
                   )}
                    {audio.file_size_mb && (
                      <span className="text-gray-600 text-xs">• {audio.file_size_mb.toFixed(1)} MB</span>
                    )}
                    {audio.category && (
                      <span className="text-gray-600 text-xs">• {audio.category}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={`${status.color} flex items-center gap-1 text-xs`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </Badge>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(audio)}
                      className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 flex items-center justify-center transition-all"
                      title="Eliminar audio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}