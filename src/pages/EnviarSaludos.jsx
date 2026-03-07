import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Upload, Loader2, Play, Pause, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function EnviarSaludos() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        base44.auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const { data: myGreetings = [] } = useQuery({
    queryKey: ['my-greetings', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.RadioGreeting.filter(
        { user_email: currentUser.email },
        '-created_date'
      );
    },
    enabled: !!currentUser?.email
  });

  const createGreetingMutation = useMutation({
    mutationFn: async (data) => await base44.entities.RadioGreeting.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-greetings'] });
      toast.success('¡Saludo enviado exitosamente!');
      resetForm();
    },
    onError: () => {
      toast.error('Error al enviar el saludo');
    }
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Detectar el formato compatible
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
        
        // Crear archivo con extensión correcta
        const extension = mimeType.includes('mp4') ? '.m4a' : 
                         mimeType.includes('webm') ? '.webm' : '.ogg';
        const audioFile = new File([audioBlob], `grabacion${extension}`, { type: mimeType });
        
        setAudioUrl(url);
        setAudioFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
        
        toast.success('Audio grabado correctamente');
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('Error en MediaRecorder:', event);
        toast.error('Error al grabar audio');
      };

      mediaRecorderRef.current.start(100); // Capturar datos cada 100ms
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
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error('Por favor selecciona un archivo de audio válido');
        return;
      }
      const url = URL.createObjectURL(file);
      setAudioFile(file);
      setAudioUrl(url);
    }
  };

  const togglePlayPause = () => {
    if (!audioPlayerRef.current) return;
    
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play().catch(err => {
        console.error('Error reproduciendo audio:', err);
        toast.error('Error al reproducir audio');
      });
      setIsPlaying(true);
    }
  };

  const deleteAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioFile(null);
    setAudioUrl(null);
    setIsPlaying(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!audioFile) {
      toast.error('Por favor graba o selecciona un audio');
      return;
    }

    if (uploading) return;

    setUploading(true);
    
    const loadingToast = toast.loading('Subiendo audio...');

    try {
      console.log('Subiendo archivo de audio...', audioFile);
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
      
      console.log('Audio subido exitosamente:', file_url);

      const duration = recordingTime || 0;

      await createGreetingMutation.mutateAsync({
        user_email: currentUser.email,
        user_name: currentUser.full_name,
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
    }
  };

  const resetForm = () => {
    setMessage('');
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        Enviar Saludos para la Radio
      </h1>

      <Card className="bg-gray-900 border-cyan-500/30 mb-8">
        <CardHeader>
          <CardTitle className="text-cyan-400">Grabar o Subir Audio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    />
                    <Button
                      type="button"
                      onClick={() => document.querySelector('input[type="file"]').click()}
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
                  <p className="text-cyan-400 text-sm mb-2">✓ Audio grabado</p>
                  <p className="text-white font-mono text-lg">
                    Duración: {formatTime(recordingTime)}
                  </p>
                </div>

                <audio
                  ref={audioPlayerRef}
                  src={audioUrl}
                  preload="metadata"
                  onEnded={() => setIsPlaying(false)}
                  onLoadedMetadata={() => {
                    console.log('Audio cargado correctamente');
                  }}
                  onError={(e) => {
                    console.error('Error al cargar audio:', e);
                  }}
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
          <CardTitle className="text-cyan-400">Mis Saludos Enviados</CardTitle>
        </CardHeader>
        <CardContent>
          {myGreetings.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Aún no has enviado saludos
            </p>
          ) : (
            <div className="space-y-4">
              {myGreetings.map((greeting) => (
                <div
                  key={greeting.id}
                  className="bg-gray-800 p-4 rounded-lg border border-cyan-500/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-white font-semibold">{greeting.user_name}</p>
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