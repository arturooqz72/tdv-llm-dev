import React, { useState, useEffect } from 'react';
import PermissionGuard from '@/components/PermissionGuard';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload as UploadIcon, Video, Sparkles, CheckCircle2, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const religions = [
  { value: 'lldm', label: 'LLDM' },
  { value: 'cristianismo', label: 'Cristianismo' },
  { value: 'otros', label: 'Otros' }
];

const audioCategories = [
  { value: 'sermon', label: 'Sermón' },
  { value: 'worship', label: 'Adoración' },
  { value: 'prayer', label: 'Oración' },
  { value: 'meditation', label: 'Meditación' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'music', label: 'Música' },
  { value: 'other', label: 'Otro' }
];
export default function Upload() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(''); // ← ESTA LÍNEA ES OBLIGATORIA
  const [uploadType, setUploadType] = useState('video'); // 'video' or 'audio'

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    religion: 'lldm',
    topic: '',
    category: 'sermon',
    tags: '',
    video_url: '',
    audio_url: '',
    thumbnail_url: ''
  });

  // ⭐ Cargar Uploadcare
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);
  // ⭐ Handlers de Uploadcare
  const openUploadcare = (callback, accept = null) => {
  const widget = uploadcare.openDialog(null, {
    publicKey: "d6edf1496c801ed26b07", // ← AQUÍ VA TU PUBLIC KEY REAL
    imagesOnly: accept === "image",
    multiple: false
  });

  widget.done(filePromise => {
    filePromise.done(fileInfo => {
      callback(fileInfo.cdnUrl);
    });
  });
};


  const handleVideoUpload = () => {
    openUploadcare((url) => {
      setFormData({ ...formData, video_url: url });
    });
  };

  const handleAudioUpload = () => {
    openUploadcare((url) => {
      setFormData({ ...formData, audio_url: url });
    });
  };

  const handleThumbnailUpload = () => {
    openUploadcare((url) => {
      setFormData({ ...formData, thumbnail_url: url });
    }, "image");
  };

  // ⭐ Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (uploadType === "video" && !formData.video_url) {
      alert("Por favor sube un video");
      return;
    }

    if (uploadType === "audio" && !formData.audio_url) {
      alert("Por favor sube un audio");
      return;
    }

    if (!formData.title.trim()) {
      alert("Por favor ingresa un título");
      return;
    }

    setUploading(true);
    setUploadProgress("Guardando contenido...");

    try {
      const tagsArray = formData.tags
        .split(",")
        .map(t => t.trim())
        .filter(t => t);

      if (uploadType === "video") {
        await base44.entities.Video.create({
          title: formData.title,
          description: formData.description,
          video_url: formData.video_url,
          thumbnail_url: formData.thumbnail_url,
          religion: formData.religion,
          topic: formData.topic,
          tags: tagsArray,
          status: "pending",
          likes_count: 0,
          comments_count: 0,
          views_count: 0
        });

        if (currentUser) {
          await base44.auth.updateMe({
            videos_count: (currentUser.videos_count || 0) + 1
          });
        }
      } else {
        await base44.entities.AudioFile.create({
          title: formData.title,
          description: formData.description,
          audio_url: formData.audio_url,
          category: formData.category,
          tags: tagsArray,
          status: "pending"
        });
      }

      setUploading(false);
      setUploadSuccess(true);

      setTimeout(() => {
        navigate(createPageUrl("Home"));
      }, 2000);

    } catch (error) {
      console.error("Error al subir:", error);
      alert("Hubo un error al guardar el contenido.");
      setUploading(false);
    }
  };
  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">¡Contenido Enviado!</h2>
          <p className="text-gray-600">Tu contenido está pendiente de aprobación por un moderador.</p>
          <p className="text-gray-500 text-sm mt-2">Redirigiendo al inicio...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-6">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Comparte tu Mensaje
            </h1>
            <p className="text-gray-600 text-lg">
              Comparte contenido con nuestra comunidad LLDM
            </p>
          </div>

          {/* Type Selector */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-6">
            <Label className="text-base font-semibold text-gray-900 mb-3 block">
              ¿Qué deseas subir? *
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setUploadType('video')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  uploadType === 'video'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Video className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="font-semibold">Video</p>
              </button>

              <button
                type="button"
                onClick={() => setUploadType('audio')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  uploadType === 'audio'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Music className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="font-semibold">Audio</p>
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Video Upload */}
              {uploadType === 'video' && (
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-3 block">
                    Video *
                  </Label>

                  <button
                    type="button"
                    onClick={handleVideoUpload}
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <Video className="w-12 h-12 text-gray-400 mb-3" />
                    <span className="text-sm text-gray-600 text-center px-4">
                      {formData.video_url ? "✓ Video subido correctamente" : "Click para subir tu video"}
                    </span>
                  </button>

                  {formData.video_url && (
                    <video
                      src={formData.video_url}
                      controls
                      className="mt-3 w-full rounded-xl shadow"
                    />
                  )}
                </div>
              )}

              {/* Audio Upload */}
              {uploadType === 'audio' && (
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-3 block">
                    Audio *
                  </Label>

                  <button
                    type="button"
                    onClick={handleAudioUpload}
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <Music className="w-12 h-12 text-gray-400 mb-3" />
                    <span className="text-sm text-gray-600 text-center px-4">
                      {formData.audio_url ? "✓ Audio subido correctamente" : "Click para subir tu audio"}
                    </span>
                  </button>

                  {formData.audio_url && (
                    <audio
                      src={formData.audio_url}
                      controls
                      className="mt-3 w-full"
                    />
                  )}
                </div>
              )}

              {/* Thumbnail Upload */}
              {uploadType === 'video' && (
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-3 block">
                    Miniatura (opcional)
                  </Label>

                  <button
                    type="button"
                    onClick={handleThumbnailUpload}
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <UploadIcon className="w-10 h-10 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {formData.thumbnail_url ? "✓ Miniatura subida" : "Click para subir imagen de portada"}
                    </span>
                  </button>

                  {formData.thumbnail_url && (
                    <img
                      src={formData.thumbnail_url}
                      alt="Miniatura"
                      className="mt-3 w-full rounded-xl shadow"
                    />
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-base font-semibold text-gray-900 mb-3 block">
                  Título *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Dale un título a tu contenido"
                  className="text-base h-12"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-base font-semibold text-gray-900 mb-3 block">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comparte tu reflexión o mensaje..."
                  className="text-base min-h-32"
                />
              </div>

              {/* Religion / Category */}
              {uploadType === 'video' ? (
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-3 block">
                    Categoría Religiosa *
                  </Label>
                  <Select
                    value={formData.religion}
                    onValueChange={(value) => setFormData({ ...formData, religion: value })}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {religions.map((religion) => (
                        <SelectItem key={religion.value} value={religion.value}>
                          {religion.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-3 block">
                    Categoría *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {audioCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Topic */}
              {uploadType === 'video' && (
                <div>
                  <Label htmlFor="topic" className="text-base font-semibold text-gray-900 mb-3 block">
                    Tema
                  </Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="ej: oración, meditación, reflexión"
                    className="text-base h-12"
                  />
                </div>
              )}

              {/* Tags */}
              <div>
                <Label htmlFor="tags" className="text-base font-semibold text-gray-900 mb-3 block">
                  Etiquetas (separadas por comas)
                </Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="ej: fe, esperanza, amor"
                  className="text-base h-12"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Las etiquetas ayudan a organizar y encontrar tu contenido
                </p>
              </div>

              {/* Upload Progress */}
              {uploading && uploadProgress && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <p className="text-purple-700 font-medium text-sm">{uploadProgress}</p>
                  </div>
                  <div className="mt-2 h-2 bg-purple-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={uploading}
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg disabled:opacity-70"
              >
                {uploading ? 'Subiendo... no cierres esta página' : `Enviar ${uploadType === 'video' ? 'Video' : 'Audio'} para Aprobación`}
              </Button>

            </form>
          </div>
        </div>
      </div>
  );
}