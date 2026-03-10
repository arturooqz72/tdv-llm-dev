import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Video, Trash2, Search, Loader2, Eye, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import EditVideoModal from "@/components/video/EditVideoModal";

const categories = [
  { value: "predicaciones", label: "Predicaciones", color: "bg-yellow-500/20 text-yellow-400" },
  { value: "cantos", label: "Cantos", color: "bg-pink-500/20 text-pink-400" },
  { value: "testimonios", label: "Testimonios", color: "bg-blue-500/20 text-blue-400" },
  { value: "platicas", label: "Platicas", color: "bg-green-500/20 text-green-400" },
  { value: "debates", label: "Debates", color: "bg-red-500/20 text-red-400" },
  { value: "temas", label: "Temas", color: "bg-cyan-500/20 text-cyan-400" },
  { value: "podcast", label: "Podcast", color: "bg-orange-500/20 text-orange-400" },
  { value: "otros", label: "Otros", color: "bg-purple-500/20 text-purple-400" },
];

const statusLabels = {
  pending: { label: "Pendiente", color: "bg-yellow-500/20 text-yellow-400" },
  approved: { label: "Aprobado", color: "bg-green-500/20 text-green-400" },
  rejected: { label: "Rechazado", color: "bg-red-500/20 text-red-400" },
};

export default function AdminVideos() {
  const { user: currentUser, isLoadingAuth } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isReady, setIsReady] = useState(false);

  const refreshVideos = async () => {
    try {
      setIsReady(false);

      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setVideos(data || []);
    } catch (error) {
      console.error("Error cargando videos:", error);
      setVideos([]);
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    refreshVideos();
  }, []);

  const handleChangeCategory = async (videoId, newCategory) => {
    setUpdatingId(videoId);

    try {
      const { error } = await supabase
        .from("videos")
        .update({ religion: newCategory })
        .eq("id", videoId);

      if (error) throw error;

      await refreshVideos();
    } catch (error) {
      console.error("Error cambiando categoría:", error);
      alert("No se pudo actualizar la categoría.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (video) => {
    const ok = window.confirm(
      `¿Estás seguro de eliminar "${video.title}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    setUpdatingId(video.id);

    try {
      const { error } = await supabase.from("videos").delete().eq("id", video.id);

      if (error) throw error;

      await refreshVideos();
    } catch (error) {
      console.error("Error eliminando video:", error);
      alert("No se pudo eliminar el video.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      const title = v.title?.toLowerCase() || "";
      const createdBy = v.created_by?.toLowerCase() || "";
      const description = v.description?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();

      const matchSearch =
        title.includes(term) ||
        createdBy.includes(term) ||
        description.includes(term);

      const matchCat =
        filterCategory === "all" || (v.religion || "otros") === filterCategory;

      return matchSearch && matchCat;
    });
  }, [videos, searchTerm, filterCategory]);

  if (isLoadingAuth || !isReady) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl flex justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-700">
          <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Acceso restringido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Video className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Videos</h1>
          <p className="text-gray-400 text-sm">Cambiar categoría, editar o eliminar videos</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, descripción o usuario..."
            className="pl-10 bg-gray-800 border-gray-600 text-white"
          />
        </div>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-gray-500 text-sm mb-4">{filtered.length} videos</p>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-700">
          <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No se encontraron videos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((video) => {
            const status = statusLabels[video.status] || statusLabels.pending;
            const isUpdating = updatingId === video.id;

            return (
              <div
                key={video.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-all ${
                  isUpdating ? "opacity-50" : "bg-gray-900/60 border-gray-700"
                }`}
              >
                <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <Video className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{video.title}</p>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-gray-500 text-xs">
                      {video.created_by?.split("@")[0] || "usuario"}
                    </span>

                    <span className="text-gray-600 text-xs">•</span>

                    <span className="text-gray-500 text-xs">
                      {video.created_at
                        ? new Date(video.created_at).toLocaleDateString()
                        : video.created_date
                        ? new Date(video.created_date).toLocaleDateString()
                        : ""}
                    </span>

                    <Badge className={`${status.color} text-xs`}>
                      {status.label}
                    </Badge>
                  </div>
                </div>

                <Select
                  value={video.religion || "otros"}
                  onValueChange={(val) => handleChangeCategory(video.id, val)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link to={createPageUrl(`VideoDetail?id=${video.id}`)} target="_blank">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-cyan-400"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingVideo(video)}
                    disabled={isUpdating}
                    className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(video)}
                    disabled={isUpdating}
                    className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingVideo && (
        <EditVideoModal
          video={editingVideo}
          isOpen={!!editingVideo}
          onClose={() => setEditingVideo(null)}
          onSave={async () => {
            await refreshVideos();
            setEditingVideo(null);
          }}
        />
      )}
    </div>
  );
}
