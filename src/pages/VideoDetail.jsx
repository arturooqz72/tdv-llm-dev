import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import VideoPlayer from "@/components/video/VideoPlayer";
import { useAuth } from "@/lib/AuthContext";

const VIDEO_STORAGE_KEYS = [
  "tdv_videos",
  "tdv_video_files",
  "tdv_uploaded_videos",
];

const VIDEO_LIKES_STORAGE_KEY = "tdv_video_likes";

function readJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function readStoredVideos() {
  for (const key of VIDEO_STORAGE_KEYS) {
    const data = readJSON(key, []);
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  }
  return [];
}

function readStoredLikes() {
  return readJSON(VIDEO_LIKES_STORAGE_KEY, []);
}

function saveStoredLikes(likes) {
  localStorage.setItem(VIDEO_LIKES_STORAGE_KEY, JSON.stringify(likes));
}

export default function VideoDetail() {
  const { user: currentUser } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get("id");

  const [video, setVideo] = useState(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setVideoLoading(true);

    const videos = readStoredVideos();
    const foundVideo = videos.find((item) => String(item.id) === String(videoId));

    if (!foundVideo) {
      setVideo(null);
      setVideoLoading(false);
      return;
    }

    const nextVideo = {
      ...foundVideo,
      views_count: (foundVideo.views_count || 0) + 1,
    };

    setVideo(nextVideo);

    // guardar incremento de vistas en la misma colección encontrada
    for (const key of VIDEO_STORAGE_KEYS) {
      const collection = readJSON(key, []);
      if (!Array.isArray(collection) || collection.length === 0) continue;

      const exists = collection.some((item) => String(item.id) === String(videoId));
      if (!exists) continue;

      const updated = collection.map((item) =>
        String(item.id) === String(videoId)
          ? { ...item, views_count: (item.views_count || 0) + 1 }
          : item
      );

      localStorage.setItem(key, JSON.stringify(updated));
      break;
    }

    setVideoLoading(false);
  }, [videoId]);

  useEffect(() => {
    if (!currentUser?.email || !videoId) {
      setLiked(false);
      return;
    }

    const likes = readStoredLikes();
    const alreadyLiked = likes.some(
      (item) =>
        String(item.video_id) === String(videoId) &&
        item.user_email === currentUser.email
    );

    setLiked(alreadyLiked);
  }, [currentUser, videoId]);

  const likesCount = useMemo(() => {
    if (!videoId) return 0;
    const likes = readStoredLikes();
    return likes.filter((item) => String(item.video_id) === String(videoId)).length;
  }, [videoId, liked, video]);

  const handleLike = () => {
    if (!currentUser?.email || !videoId) return;

    const likes = readStoredLikes();

    if (liked) {
      const updatedLikes = likes.filter(
        (item) =>
          !(
            String(item.video_id) === String(videoId) &&
            item.user_email === currentUser.email
          )
      );
      saveStoredLikes(updatedLikes);
      setLiked(false);
      return;
    }

    const newLike = {
      id: crypto.randomUUID(),
      video_id: videoId,
      user_email: currentUser.email,
      created_date: new Date().toISOString(),
    };

    saveStoredLikes([...likes, newLike]);
    setLiked(true);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: video?.title || "Video",
          text: video?.description || "Mira este video",
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      alert("Enlace copiado al portapapeles.");
    } catch (error) {
      console.error("Error compartiendo:", error);
    }
  };

  if (videoLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="aspect-video w-full rounded-3xl mb-6" />
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center max-w-xl w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Video no encontrado
          </h2>
          <p className="text-gray-600">
            Este video no existe en la copia actual o todavía no ha sido cargado.
          </p>
        </div>
      </div>
    );
  }

  const creatorName =
    video.created_by?.split("@")[0] ||
    video.userName ||
    video.author ||
    "Usuario";

  const creatorInitial = creatorName?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className="aspect-video bg-black">
                <VideoPlayer
                  src={video.video_url}
                  poster={video.thumbnail_url}
                  autoPlay
                  className="w-full h-full"
                />
              </div>

              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {video.title}
                </h1>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                      {creatorInitial}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">{creatorName}</p>
                      <p className="text-sm text-gray-500">
                        {video.religion || video.category || "Video"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleLike}
                      disabled={!currentUser?.email}
                      className={cn(
                        "gap-2 rounded-full",
                        liked && "text-red-500 border-red-500"
                      )}
                    >
                      <Heart className={cn("w-5 h-5", liked && "fill-current")} />
                      {likesCount}
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2 rounded-full"
                      onClick={handleShare}
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 flex-wrap">
                  <span>{video.views_count || 0} vistas</span>
                  {video.created_date && (
                    <span>
                      {new Date(video.created_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {video.description && (
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {video.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Comentarios
                </h2>
                <p className="text-gray-600">
                  La sección de comentarios de esta copia está temporalmente en modo
                  simple mientras se termina de quitar Base44.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
