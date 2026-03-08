import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import BulkAudioUploader from "@/components/audio/BulkAudioUploader";
import AudioPlayerBar from "@/components/audio/AudioPlayerBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  Loader2,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

const categoryLabels = {
  sermon: "Sermón",
  worship: "Adoración",
  prayer: "Oración",
  meditation: "Meditación",
  podcast: "Podcast",
  music: "Música",
  other: "Otro",
};

export default function MyAudios() {
  const { user: currentUser, isLoadingAuth } = useAuth();

  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [workingId, setWorkingId] = useState(null);

  const isAdmin = currentUser?.role === "admin";

  const loadAudios = async () => {
    if (!currentUser?.email) {
      setAudios([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      let query = supabase
        .from("audios")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("created_by", currentUser.email);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setAudios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando audios:", error);
      alert(`Error cargando audios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoadingAuth) {
      loadAudios();
    }
  }, [currentUser?.email, currentUser?.role, isLoadingAuth]);

  const handleTogglePlay = (audio) => {
    if (!audio || playingAudio?.id === audio.id) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(audio);
    }
  };

  const handleDelete = async (audio) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${audio.title}"?`)) return;

    try {
      setWorkingId(audio.id);

      if (playingAudio?.id === audio.id) {
        setPlayingAudio(null);
      }

      const { error } = await supabase.from("audios").delete().eq("id", audio.id);

      if (error) {
        throw error;
      }

      await loadAudios();
    } catch (error) {
      console.error("Error eliminando audio:", error);
      alert(`Error eliminando audio: ${error.message}`);
    } finally {
      setWorkingId(null);
    }
  };

  const handleToggleActive = async (audio) => {
    try {
      setWorkingId(audio.id);

      const { error } = await supabase
        .from("audios")
        .update({ is_active: !audio.is_active })
        .eq("id", audio.id);

      if (error) {
        throw error;
      }

      await loadAudios();
    } catch (error) {
      console.error("Error actualizando audio:", error);
      alert(`Error actualizando audio: ${error.message}`);
    } finally {
      setWorkingId(null);
    }
  };

  const totals = useMemo(() => {
    return {
      total: audios.length,
      active: audios.filter((a) => a.is_active).length,
      inactive: audios.filter((a) => !a.is_active).length,
    };
  }, [audios]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!currentUser?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Card className="bg-gray-900 border-yellow-600 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Music className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">
              Inicia sesión para ver tus audios
            </h2>
            <p className="text-gray-400">
              Necesitas entrar a tu cuenta para subir y administrar tus audios.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Music className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isAdmin ? "Todos los Audios" : "Mis Audios"}
            </h1>
            <p className="text-gray-400 text-sm">
              {isAdmin
                ? "Gestiona todos los audios guardados en el sistema"
                : "Sube, edita y reproduce tus audios"}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={loadAudios}
            variant="outline"
            className="border-cyan-500 text-cyan-400"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refrescar
          </Button>

          <Button
            onClick={() => setShowUploader((prev) => !prev)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            {showUploader ? "Ocultar Subida" : "Subir Audios"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gray-900/70 border-gray-700">
          <CardContent className="p-5">
            <p className="text-sm text-gray-400">Total</p>
            <p className="text-3xl font-bold text-white">{totals.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-green-700">
          <CardContent className="p-5">
            <p className="text-sm text-green-400">Activos</p>
            <p className="text-3xl font-bold text-white">{totals.active}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-700">
          <CardContent className="p-5">
            <p className="text-sm text-gray-400">Inactivos</p>
            <p className="text-3xl font-bold text-white">{totals.inactive}</p>
          </CardContent>
        </Card>
      </div>

      {showUploader && (
        <div className="mb-8">
          <BulkAudioUploader
            currentUser={currentUser}
            onSuccess={async () => {
              setShowUploader(false);
              await loadAudios();
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : audios.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-700">
          <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Todavía no hay audios guardados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {audios.map((audio) => {
            const isPlaying = playingAudio?.id === audio.id;
            const isWorking = workingId === audio.id;

            return (
              <div key={audio.id}>
                <div
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    isPlaying
                      ? "bg-cyan-500/10 border-cyan-500/40"
                      : "bg-gray-900/60 border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <button
                    onClick={() => handleTogglePlay(audio)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isPlaying
                        ? "bg-cyan-500 text-black"
                        : "bg-gray-700 text-white hover:bg-cyan-500 hover:text-black"
                    }`}
                  >
                    <Music className="w-5 h-5" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold truncate ${
                        isPlaying ? "text-cyan-400" : "text-white"
                      }`}
                    >
                      {audio.title}
                    </p>

                    {audio.description && (
                      <p className="text-gray-500 text-sm truncate">
                        {audio.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-gray-600 text-xs">
                        {audio.created_at
                          ? new Date(audio.created_at).toLocaleDateString()
                          : ""}
                      </span>

                      {audio.created_by && (
                        <span className="text-gray-600 text-xs">
                          • {audio.created_by.split("@")[0]}
                        </span>
                      )}

                      {audio.file_size_mb ? (
                        <span className="text-gray-600 text-xs">
                          • {Number(audio.file_size_mb).toFixed(1)} MB
                        </span>
                      ) : null}

                      {audio.category && (
                        <span className="text-gray-600 text-xs">
                          • {categoryLabels[audio.category] || audio.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      className={`text-xs ${
                        audio.is_active
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-300"
                      }`}
                    >
                      {audio.is_active ? "Activo" : "Inactivo"}
                    </Badge>

                    <button
                      onClick={() => handleToggleActive(audio)}
                      disabled={isWorking}
                      className="w-9 h-9 rounded-full bg-gray-800 text-cyan-400 hover:bg-gray-700 flex items-center justify-center transition-all disabled:opacity-50"
                      title={audio.is_active ? "Desactivar audio" : "Activar audio"}
                    >
                      {audio.is_active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(audio)}
                      disabled={isWorking}
                      className="w-9 h-9 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 flex items-center justify-center transition-all disabled:opacity-50"
                      title="Eliminar audio"
                    >
                      {isWorking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isPlaying && (
                  <AudioPlayerBar
                    audio={audio}
                    isPlaying={true}
                    onToggle={handleTogglePlay}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
