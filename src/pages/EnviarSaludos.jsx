import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Mic,
  Upload,
  Loader2,
  Trash2,
  Play,
  Pause,
  Radio,
  Volume2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const RADIO_BASE = "https://radio.team-desveladoslldm.com";
const STATION = "tdv_lldm-christian_radio";
const RADIO_PAGE_URL = "http://radio24-7.team-desveladoslldm.com/";

const STREAMS = [
  `${RADIO_BASE}/listen/${STATION}/radio.mp3`,
  `${RADIO_BASE}/listen/${STATION}/radio.aac`,
];

export default function EnviarSaludos() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [routeIndex, setRouteIndex] = useState(0);
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [radioVolume, setRadioVolume] = useState(0.7);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const radioRef = useRef(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setSenderName(user?.full_name || '');
      } catch (error) {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!radioRef.current) return;
    radioRef.current.volume = radioVolume;
  }, [radioVolume]);

  useEffect(() => {
    return () => {
      if (radioRef.current) {
        radioRef.current.pause();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const { data: recentGreetings = [] } = useQuery({
    queryKey: ['recent-greetings-public'],
    queryFn: async () => {
      try {
        return await base44.entities.RadioGreeting.list('-created_date', 20);
      } catch (error) {
        console.error('Error cargando saludos recientes:', error);
        return [];
      }
    }
  });

  const createGreetingMutation = useMutation({
    mutationFn: async (data) => await base44.entities.RadioGreeting.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-greetings-public'] });
      toast.success('¡Saludo enviado exitosamente!');
      resetForm();
    },
    onError: (error) => {
      console.error('Error al crear saludo:', error);
      toast.error('Error al enviar el saludo');
    }
  });

  const handleToggleRadio = async () => {
    if (!radioRef.current) return;

    try {
      if (isRadioPlaying) {
        radioRef.current.pause();
        setIsRadioPlaying(false);
      } else {
        radioRef.current.src = STREAMS[routeIndex];
        radioRef.current.volume = radioVolume;
        await radioRef.current.play();
        setIsRadioPlaying(true);
      }
    } catch (error) {
      console.error('Error reproduciendo radio:', error);
      setIsRadioPlaying(false);
      toast.error('No se pudo reproducir la radio');
    }
  };

  const handleChangeRoute = async () => {
    const nextIndex = routeIndex === 0 ? 1 : 0;
    setRouteIndex(nextIndex);

    if (!radioRef.current) return;

    try {
      const wasPlaying = isRadioPlaying;
      radioRef.current.pause();
      radioRef.current.src = STREAMS[nextIndex];
      radioRef.current.load();

      if (wasPlaying) {
        await radioRef.current.play();
        setIsRadioPlaying(true);
      }
    } catch (error) {
      console.error('Error cambiando ruta:', error);
      setIsRadioPlaying(false);
    }
  };

  const handleRadioError = async () => {
    const fallbackIndex = routeIndex === 0 ? 1 : 0;

    if (!radioRef.current) return;

    try {
      radioRef.current.pause();
      radioRef.current.src = STREAMS[fallbackIndex];
      radioRef.current.load();
      setRouteIndex(fallbackIndex);

      if (isRadioPlaying) {
        await radioRef.current.play();
      }
    } catch (error) {
      console.error('Error en rutas de radio:', error);
      setIsRadioPlaying(false);
    }
  };

  const openRadioPage = () => {
    window.open(RADIO_PAGE_URL, '_blank', 'noopener,noreferrer');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);

        const extension = mimeType.includes('mp4')
          ? '.m4a'
          : mimeType.includes('webm')
          ? '.webm'
          : '.ogg';

        const recordedFile = new File([audioBlob], `grabacion${extension}`, { type: mimeType });

        setAudioUrl(url);
        setAudioFile(recordedFile);
        stream.getTracks().forEach(track => track.stop());

        toast.success('Audio grabado correctamente');
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('Error en MediaRecorder:', event);
        toast.error('Error al grabar audio');
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      toast.error('No se pudo acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Por favor selecciona un archivo de audio válido');
      return;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    const url = URL.createObjectURL(file);
    setAudioFile(file);
    setAudioUrl(url);
    setRecordingTime(0);
    setIsPlayingPreview(false);
  };

  const deleteAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioFile(null);
    setAudioUrl(null);
    setIsPlayingPreview(false);
    setRecordingTime(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!senderName.trim()) {
      toast.error('Escribe tu nombre');
      return;
    }

    if (!audioFile) {
      toast.error('Por favor graba o selecciona un audio');
      return;
    }

    if (uploading) return;

    setUploading(true);
    const loadingToast = toast.loading('Subiendo audio...');

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });

      const duration = recordingTime || 0;
      const safeName = senderName.trim();
      const guestEmail =
        currentUser?.email ||
        `saludo_${Date.now()}@teamdesvelados.local`;

      await createGreetingMutation.mutateAsync({
        user_email: guestEmail,
        user_name: safeName,
        audio_url: file_url,
        message: message.trim() || null,
        duration_seconds: duration
      });

      toast.dismiss(loadingToast);
    } catch (error) {
      console.error('Error al enviar saludo:', error);
      toast.dismiss(loadingToast);
      toast.error('Error al subir el audio. Intenta de nuevo.');
      setUploading(false);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setMessage('');
    if (!currentUser) {
      setSenderName('');
    }
    deleteAudio();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pendiente', color: 'bg-yellow-500' },
      approved: { text: 'Aprobado', color: 'bg-green-500' },
      rejected: { text: 'Rechazado', color: 'bg-red-500' },
      played: { text: 'Reproducido', color: 'bg-blue-500' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6 md:py-10 max-w-[1600px] mx-auto">
      <audio
        ref={radioRef}
        preload="none"
        onPause={() => setIsRadioPlaying(false)}
        onPlay={() => setIsRadioPlaying(true)}
        onError={handleRadioError}
      />

      <section className="mb-8">
        <Card className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_26%),linear-gradient(135deg,rgba(3,7,18,0.98),rgba(17,24,39,0.96),rgba(2,6,23,1))] border-cyan-500/20 text-white rounded-3xl">
          <div className="absolute -top-16 -left-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

          <CardContent className="relative p-5 md:p-7">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300 mb-4">
                  <Radio className="w-4 h-4" />
                  Radio en vivo 24/7
                </div>

                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                  Radio Team Desvelados
                  <br />
                  24/7
                </h2>

                <p className="mt-4 text-cyan-300 text-sm md:text-lg font-medium">
                  Transmisión continua · Música · Cantos · Programas
                </p>
              </div>

              <Button
                variant="outline"
                onClick={openRadioPage}
                className="shrink-0 border-cyan-400/25 bg-slate-900/60 text-cyan-200 hover:bg-cyan-500/15 hover:text-white rounded-2xl font-semibold"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Radio
              </Button>
            </div>

            <div className="rounded-[28px] border border-cyan-400/20 bg-cyan-500/10 backdrop-blur-sm p-4 md:p-6">
              <div className="grid grid-cols-[96px_1fr] md:grid-cols-[140px_1fr] gap-4 md:gap-6 items-center">
                <div className="h-24 w-24 md:h-36 md:w-36 rounded-full border-4 border-cyan-400/70 bg-cyan-500/10 flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.10)]">
                  <Radio className="w-10 h-10 md:w-16 md:h-16 text-cyan-400" />
                </div>

                <div>
                  <h3 className="text-2xl md:text-4xl font-black leading-tight text-white">
                    Radio Team Desvelados
                    <br />
                    24/7
                  </h3>

                  <p className="mt-2 text-slate-300 text-base md:text-xl">
                    {isRadioPlaying ? 'Reproduciendo' : 'Pausado'} · Ruta {routeIndex + 1}/2
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Button
                      onClick={handleToggleRadio}
                      className="h-14 md:h-16 px-6 md:px-10 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xl rounded-2xl shadow-lg"
                    >
                      {isRadioPlaying ? (
                        <Pause className="w-6 h-6 mr-3" />
                      ) : (
                        <Play className="w-6 h-6 mr-3" />
                      )}
                      {isRadioPlaying ? 'Pausar' : 'Reproducir'}
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleChangeRoute}
                      className="h-14 md:h-16 px-5 md:px-8 bg-slate-700/70 hover:bg-slate-600 text-white text-lg rounded-2xl"
                    >
                      Cambiar Ruta
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={openRadioPage}
                      className="h-14 md:h-16 w-14 md:w-16 p-0 bg-slate-700/70 hover:bg-slate-600 text-white rounded-2xl"
                    >
                      <ExternalLink className="w-7 h-7" />
                    </Button>
                  </div>

                  <div className="mt-6 flex items-center gap-4">
                    <Volume2 className="w-7 h-7 text-white shrink-0" />

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={radioVolume}
                      onChange={(e) => setRadioVolume(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />

                    <span className="text-2xl font-bold text-white w-[72px] text-right">
                      {Math.round(radioVolume * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        Enviar Saludos para la Radio
      </h1>

      <Card className="bg-gray-900 border-cyan-500/30 mb-8">
        <CardHeader>
          <CardTitle className="text-cyan-400">Grabar o Subir Audio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              placeholder="Tu nombre"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="bg-gray-800 border-cyan-500/30 text-white"
            />

            {!audioUrl && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex-1 ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-cyan-500 hover:bg-cyan-600'
                    }`}
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    {isRecording ? `Detener (${formatTime(recordingTime)})` : 'Grabar Audio'}
                  </Button>

                  <label className="flex-1">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="saludos-audio-upload"
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('saludos-audio-upload')?.click()}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Subir Archivo
                    </Button>
                  </label>
                </div>
              </div>
            )}

            {audioUrl && (
              <div className="bg-gray-800 p-4 rounded-lg space-y-4">
                <div className="bg-cyan-900/30 p-4 rounded text-center">
                  <p className="text-cyan-400 text-sm mb-2">✓ Audio listo</p>
                  <p className="text-white font-mono text-lg">
                    Duración: {formatTime(recordingTime)}
                  </p>
                </div>

                <audio
                  ref={audioPlayerRef}
                  src={audioUrl}
                  preload="metadata"
                  onEnded={() => setIsPlayingPreview(false)}
                  controls
                  controlsList="nodownload"
                  className="w-full bg-gray-900 rounded"
                  style={{ height: '54px' }}
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={deleteAudio}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Eliminar y Grabar Nuevo
                  </Button>
                </div>
              </div>
            )}

            <Textarea
              placeholder="Mensaje opcional (ej: Saludos a mis hermanos...)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-gray-800 border-cyan-500/30 text-white"
              rows={3}
            />

            <Button
              type="submit"
              disabled={!audioFile || uploading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Saludo'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400">Saludos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentGreetings.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Aún no hay saludos enviados
            </p>
          ) : (
            <div className="space-y-4">
              {recentGreetings.map((greeting) => (
                <div
                  key={greeting.id}
                  className="bg-gray-800 p-4 rounded-lg border border-cyan-500/20"
                >
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <div className="flex-1">
                      <p className="text-white font-semibold">{greeting.user_name || 'Invitado'}</p>
                      {greeting.message && (
                        <p className="text-gray-400 text-sm mt-1">{greeting.message}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(greeting.created_date).toLocaleString('es-MX')}
                      </p>
                    </div>
                    {getStatusBadge(greeting.status)}
                  </div>

                  <audio
                    src={greeting.audio_url}
                    controls
                    className="w-full mt-2"
                  />

                  {greeting.admin_note && (
                    <div className="mt-3 bg-gray-900 p-3 rounded border-l-4 border-yellow-500">
                      <p className="text-yellow-400 text-sm font-semibold">Nota del Admin:</p>
                      <p className="text-gray-300 text-sm">{greeting.admin_note}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
