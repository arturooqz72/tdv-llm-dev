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

const UPLOADCARE_PUBLIC_KEY = import.meta.env.VITE_UPLOADCARE_PUBLIC_KEY;

async function uploadToUploadcare(file) {
  const form = new FormData();
  form.append("UPLOADCARE_PUB_KEY", UPLOADCARE_PUBLIC_KEY);
  form.append("UPLOADCARE_STORE", "1");
  form.append("file", file);

  const response = await fetch("https://upload.uploadcare.com/base/", {
    method: "POST",
    body: form,
  });

  const data = await response.json();

  if (!data?.file) {
    throw new Error("Uploadcare no devolvió UUID");
  }

  return `https://ucarecdn.com/${data.file}/`;
}

async function uploadThumbnail(bucket, path, file) {
  const { error } = await supabase.storage.from(bucket).upload(path, file);

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
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
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser?.id) {
      alert("Debes iniciar sesión.");
      return;
    }

    setUploading(true);

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const userId = currentUser.id;

      if (uploadType === "video") {
        setUploadProgress("Subiendo video a Uploadcare...");

        const videoUrl = await uploadToUploadcare(videoFile);

        let thumbnailUrl = null;

        if (thumbnailFile) {
          setUploadProgress("Subiendo miniatura...");

          const path = `${userId}/${Date.now()}-${thumbnailFile.name}`;

          thumbnailUrl = await uploadThumbnail(
            STORAGE_BUCKETS.thumbnails,
            path,
            thumbnailFile
          );
        }

        setUploadProgress("Guardando en base de datos...");

        const { error } = await supabase.from(TABLES.videos).insert({
          user_id: userId,
          title: formData.title,
          description: formData.description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          category: formData.category,
          topic: formData.topic,
          tags: tagsArray,
          status: "pending",
        });

        if (error) throw error;
      } else {
        setUploadProgress("Subiendo audio a Uploadcare...");

        const audioUrl = await uploadToUploadcare(audioFile);

        setUploadProgress("Guardando audio...");

        const { error } = await supabase.from(TABLES.audios).insert({
          user_id: userId,
          title: formData.title,
          description: formData.description,
          audio_url: audioUrl,
          category: formData.audioCategory,
          tags: tagsArray,
          status: "pending",
        });

        if (error) throw error;
      }

      setUploading(false);
      setUploadSuccess(true);

      setTimeout(() => {
        navigate(createPageUrl("Home"));
      }, 2000);
    } catch (error) {
      console.error(error);
      alert(error.message);
      setUploading(false);
    }
  };

  if (uploadSuccess) {
    return (
      <PermissionGuard>
        <div className="text-center mt-20">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
          <h2 className="text-2xl font-bold mt-4">Contenido enviado</h2>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard>
      <div className="max-w-3xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Subir Contenido</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            placeholder="Título"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />

          <Textarea
            placeholder="Descripción"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <input
            type="file"
            accept={uploadType === "video" ? "video/*" : "audio/*"}
            onChange={(e) =>
              uploadType === "video"
                ? setVideoFile(e.target.files[0])
                : setAudioFile(e.target.files[0])
            }
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files[0])}
          />

          <Button disabled={uploading}>
            {uploading ? uploadProgress : "Subir contenido"}
          </Button>
        </form>
      </div>
    </PermissionGuard>
  );
}
