import React, { useEffect, useMemo, useRef, useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload as UploadIcon,
  Video,
  Sparkles,
  CheckCircle2,
  Music,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const videoCategories = [
  { value: "predicaciones", label: "Predicaciones" },
  { value: "testimonios", label: "Testimonios" },
  { value: "cumpleanos", label: "Cumpleaños" },
  { value: "debates", label: "Debates" },
  { value: "podcast", label: "Podcast" },
  { value: "temas", label: "Temas" },
  { value: "otros", label: "Otros" },
];

const audioCategories = [
  { value: "sermon", label: "Sermón" },
  { value: "worship", label: "Adoración" },
  { value: "prayer", label: "Oración" },
  { value: "meditation", label: "Meditación" },
  { value: "podcast", label: "Podcast" },
  { value: "music", label: "Música" },
  { value: "other", label: "Otro" },
];

const STORAGE_BUCKETS = {
  thumbnails: "thumbnails",
};

const TABLES = {
  videos: "videos",
  audios: "audios",
};

function slugify(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getFileExtension(file) {
  const fromName = file?.name?.split(".")?.pop();
  if (fromName) return fromName.toLowerCase();
  return "bin";
}

function buildStoragePath(userId, folder, file) {
  const ext = getFileExtension(file);
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const safeName = slugify(file?.name?.replace(/\.[^/.]+$/, "") || "archivo");
  return `${userId}/${folder}/${timestamp}-${random}-${safeName}.${ext}`;
}

async function uploadToSupabaseStorage(bucket, path, file) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error("No se pudo obtener la URL pública de la miniatura.");
  }

  return data.publicUrl;
}

async function sha1Hex(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function uploadToB2(file, folder = "media") {
  const initResponse = await fetch("/api/b2-upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      folder,
    }),
  });

  const initData = await initResponse.json();

  if (!initResponse.ok) {
    throw new Error(
      initData?.error || "No se pudo preparar la subida a Backblaze."
    );
  }

  const sha1 = await sha1Hex(file);

  const uploadResponse = await fetch(initData.uploadUrl, {
    method: "POST",
    headers: {
      Authorization: initData.authorizationToken,
      "X-Bz-File-Name": encodeURIComponent(initData.fileName),
      "Content-Type": file.type || "b2/x-auto",
      "X-Bz-Content-Sha1": sha1,
    },
    body: file,
  });

  const rawText = await uploadResponse.text();

  let uploadData = null;
  try {
    uploadData = rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error(rawText || "Backblaze devolvió una respuesta inválida.");
  }

  if (!uploadResponse.ok) {
    throw new Error(
      uploadData?.message || uploadData?.error || "Error al subir a Backblaze."
    );
  }

  if (!initData?.publicUrl) {
    throw new Error("Backblaze no devolvió URL pública.");
  }

  return initData.publicUrl;
}

export default function Upload() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadType, setUploadType] = useState("video");

  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "predicaciones",
    topic: "",
    audioCategory: "sermon",
    tags: "",
    video_url: "",
    audio_url: "",
    thumbnail_url: "",
  });

  const videoPreview = useMemo(() => {
    if (videoFile) return URL.createObjectURL(videoFile);
    return formData.video_url || "";
  }, [videoFile, formData.video_url]);

  const audioPreview = useMemo(() => {
    if (audioFile) return URL.createObjectURL(audioFile);
    return formData.audio_url || "";
  }, [audioFile, formData.audio_url]);

  const thumbnailPreview = useMemo(() => {
    if (thumbnailFile) return URL.createObjectURL(thumbnailFile);
    return formData.thumbnail_url || "";
  }, [thumbnailFile, formData.thumbnail_url]);

  useEffect(() => {
    return () => {
      if (videoPreview?.startsWith("blob:")) URL.revokeObjectURL(videoPreview);
      if (audioPreview?.startsWith("blob:")) URL.revokeObjectURL(audioPreview);
      if (thumbnailPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [videoPreview, audioPreview, thumbnailPreview]);

  const resetFilesForType = (type) => {
    if (type === "video") {
      setAudioFile(null);
      setFormData((prev) => ({ ...prev, audio_url: "" }));
    } else {
      setVideoFile(null);
      setThumbnailFile(null);
      setFormData((prev) => ({
        ...prev,
        video_url: "",
        thumbnail_url: "",
      }));
    }
  };

  const handleSelectType = (type) => {
    setUploadType(type);
    resetFilesForType(type);
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setVideoFile(file);
    setFormData((prev) => ({
      ...prev,
      video_url: file ? file.name : "",
    }));
  };

  const handleAudioFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setAudioFile(file);
    setFormData((prev) => ({
      ...prev,
      audio_url: file ? file.name : "",
    }));
  };

  const handleThumbnailFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setThumbnailFile(file);
    setFormData((prev) => ({
      ...prev,
      thumbnail_url: file ? file.name : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser?.id) {
      alert("Debes iniciar sesión para subir contenido.");
      return;
    }

    if (!formData.title.trim()) {
      alert("Por favor ingresa un título.");
      return;
    }

    if (uploadType === "video" && !videoFile) {
      alert("Por favor selecciona un video.");
      return;
    }

    if (uploadType === "audio" && !audioFile) {
      alert("Por favor selecciona un audio.");
      return;
    }

    setUploading(true);
    setUploadProgress("");

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const userId = currentUser.id;

      if (uploadType === "video") {
        setUploadProgress("Subiendo video a Backblaze...");
        const publicVideoUrl = await uploadToB2(videoFile, `videos/${userId}`);

        let publicThumbnailUrl = null;

        if (thumbnailFile) {
          setUploadProgress("Subiendo miniatura...");
          const thumbPath = buildStoragePath(userId, "thumbnails", thumbnailFile);
          publicThumbnailUrl = await uploadToSupabaseStorage(
            STORAGE_BUCKETS.thumbnails,
            thumbPath,
            thumbnailFile
          );
        }

        setUploadProgress("Guardando video en la base de datos...");

        const { error: insertVideoError } = await supabase
          .from(TABLES.videos)
          .insert({
            user_id: userId,
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            video_url: publicVideoUrl,
            thumbnail_url: publicThumbnailUrl,
            category: formData.category,
            topic: formData.topic.trim() || null,
            tags: tagsArray,
            status: "pending",
            likes_count: 0,
            comments_count: 0,
            views_count: 0,
          });

        if (insertVideoError) throw insertVideoError;
      } else {
        setUploadProgress("Subiendo audio a Backblaze...");
        const publicAudioUrl = await uploadToB2(audioFile, `audios/${userId}`);

        setUploadProgress("Guardando audio en la base de datos...");

        const { error: insertAudioError } = await supabase
          .from(TABLES.audios)
          .insert({
            user_id: userId,
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            audio_url: publicAudioUrl,
            category: formData.audioCategory,
            tags: tagsArray,
            status: "pending",
          });

        if (insertAudioError) throw insertAudioError;
      }

      setUploadProgress("Finalizando...");
      setUploading(false);
      setUploadSuccess(true);

      setTimeout(() => {
        navigate(createPageUrl("Home"));
      }, 2000);
    } catch (error) {
      console.error("Error al subir:", error);
      alert(error?.message || "Hubo un error al guardar el contenido.");
      setUploading(false);
      setUploadProgress("");
    }
  };

  if (uploadSuccess) {
    return (
      <PermissionGuard>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              ¡Contenido Enviado!
            </h2>
            <p className="text-gray-600">
              Tu contenido está pendiente de aprobación por un moderador.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Redirigiendo al inicio...
            </p>
          </div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-6">
        <div className="max-w-3xl mx-auto">
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

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-6">
            <Label className="text-base font-semibold text-gray-900 mb-3 block">
              ¿Qué deseas subir? *
            </Label>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSelectType("video")}
                className={`p-6 rounded-xl border-2 transition-all ${
                  uploadType === "video"
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Video className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="font-semibold">Video</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectType("audio")}
                className={`p-6 rounded-xl border-2 transition-all ${
                  uploadType === "audio"
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Music className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="font-semibold">Audio</p>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {uploadType === "video" && (
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-3 block">
                    Video *
                  </Label>

                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <Video className="w-12 h-12 text-gray-400 mb-3" />
                    <span className="text-sm text-gray-600 text-center px-4">
                      {videoFile
                        ? `✓ ${videoFile.name}`
                        : "Click para subir tu video"}
                    </span>
                  </button>

                  {videoPreview && (
                    <video
                      src={videoPreview}
                      controls
                      className="mt-3 w-full rounded-xl shadow"
                    />
                  )}
                </div>
              )}

              {uploadType === "audio" && (
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-3 block">
                    Audio *
                  </Label>

                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <Music className="w-12 h-12 text-gray-400 mb-3" />
                    <span className="text-sm text-gray-600 text-center px-4">
                      {audioFile
                        ? `✓ ${audioFile.name}`
                        : "Click para subir tu audio"}
                    </span>
                  </button>

                  {audioPreview && (
                    <audio
                      src={audioPreview}
                      controls
                      className="mt-3 w-full"
                    />
                  )}
                </div>
              )}

              {uploadType === "video" && (
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-3 block">
                    Miniatura (opcional)
                  </Label>

                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <UploadIcon className="w-10 h-10 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {thumbnailFile
                        ? `✓ ${thumbnailFile.name}`
                        : "Click para subir imagen de portada"}
                    </span>
                  </button>

                  {thumbnailPreview && (
                    <img
                      src={thumbnailPreview}
                      alt="Miniatura"
                      className="mt-3 w-full rounded-xl shadow"
                    />
                  )}
                </div>
              )}

              <div>
                <Label
                  htmlFor="title"
                  className="text-base font-semibold text-gray-900 mb-3 block"
                >
                  Título *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Dale un título a tu contenido"
                  className="text-base h-12"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="description"
                  className="text-base font-semibold text-gray-900 mb-3 block"
                >
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Comparte tu reflexión o mensaje..."
                  className="text-base min-h-32"
                />
              </div>

              {uploadType === "video" ? (
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-3 block">
                    Categoría del Video *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {videoCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
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
                    value={formData.audioCategory}
                    onValueChange={(value) =>
                      setFormData({ ...formData, audioCategory: value })
                    }
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

              {uploadType === "video" && (
                <div>
                  <Label
                    htmlFor="topic"
                    className="text-base font-semibold text-gray-900 mb-3 block"
                  >
                    Tema
                  </Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) =>
                      setFormData({ ...formData, topic: e.target.value })
                    }
                    placeholder="ej: oración, meditación, reflexión"
                    className="text-base h-12"
                  />
                </div>
              )}

              <div>
                <Label
                  htmlFor="tags"
                  className="text-base font-semibold text-gray-900 mb-3 block"
                >
                  Etiquetas (separadas por comas)
                </Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="ej: fe, esperanza, amor"
                  className="text-base h-12"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Las etiquetas ayudan a organizar y encontrar tu contenido
                </p>
              </div>

              {uploading && uploadProgress && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <p className="text-purple-700 font-medium text-sm">
                      {uploadProgress}
                    </p>
                  </div>
                  <div className="mt-2 h-2 bg-purple-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"
                      style={{ width: "60%" }}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={uploading}
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg disabled:opacity-70"
              >
                {uploading
                  ? "Subiendo... no cierres esta página"
                  : `Enviar ${uploadType === "video" ? "Video" : "Audio"} para Aprobación`}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
