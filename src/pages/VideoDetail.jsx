import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Video, Loader2, Calendar, User } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function VideoDetail() {
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get("id");

  const {
    data: video,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["video-detail", videoId],
    queryFn: async () => {
      if (!videoId) return null;

      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("id", videoId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!videoId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-5xl flex justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-700">
          <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-white font-semibold">Video no encontrado</p>
          <p className="text-gray-400 text-sm mt-2">
            Este video no existe en la base actual o todavía no ha sido cargado.
          </p>

          <div className="mt-6">
            <Link to={createPageUrl("Videos")}>
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Videos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const videoUrl =
    video.video_url ||
    video.file_url ||
    video.url ||
    "";

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Link to={createPageUrl("Videos")}>
          <Button
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      <div className="bg-gray-900/60 border border-gray-700 rounded-2xl overflow-hidden">
        <div className="aspect-video bg-black">
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              className="w-full h-full"
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Video className="w-12 h-12 mx-auto mb-3" />
                <p>No hay URL de video disponible</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-3">
            {video.title || "Sin título"}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{video.created_by || "Usuario"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {video.created_at
                  ? new Date(video.created_at).toLocaleDateString()
                  : "Sin fecha"}
              </span>
            </div>
          </div>

          {video.category && (
            <div className="mb-4">
              <span className="inline-flex px-3 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {video.category}
              </span>
            </div>
          )}

          <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
            {video.description || "Sin descripción."}
          </div>
        </div>
      </div>
    </div>
  );
}
