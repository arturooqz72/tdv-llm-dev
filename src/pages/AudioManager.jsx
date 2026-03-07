import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Music,
  Upload,
  Trash2,
  Calendar,
  Clock,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const AUDIO_STORAGE_KEY = "tdv_audio_files";

function readStoredAudios() {
  try {
    const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredAudios(audios) {
  localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(audios));
}

export default function AudioManager() {
  const { user, isLoadingAuth } = useAuth();

  const [audioFiles, setAudioFiles] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    audio_url: "",
    scheduled_date: "",
    is_loop_filler: true,
    is_active: true,
  });

  useEffect(() => {
    const stored = readStoredAudios();
    setAudioFiles(stored);
    setIsReady(true);
  }, []);

  const persistAudios = (nextAudios) => {
    setAudioFiles(nextAudios);
    saveStoredAudios(nextAudios);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB para evitar problemas con localStorage
    if (file.size > maxSize) {
      alert(
        `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(
          1
        )}MB). Para esta versión temporal el máximo es 10MB.`
      );
      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();

      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          audio_url: typeof reader.result === "string" ? reader.result : "",
        }));
        setUploading(false);
      };

      reader.onerror = () => {
        console.error("Error leyendo archivo");
        alert("No se pudo leer el archivo.");
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error al procesar archivo:", error);
      alert("Error al subir el audio. Intenta de nuevo.");
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title || !formData.audio_url) {
      alert("Por favor completa los campos requeridos.");
      return;
    }

    const newAudio = {
      id: crypto.randomUUID(),
      ...formData,
      status: "approved",
      moderated_by: user?.email || "admin",
      created_by: user?.email || "admin",
      created_date: new Date().toISOString(),
    };

    const nextAudios = [newAudio, ...audioFiles];
    persistAudios(nextAudios);

    setFormData({
      title: "",
      description: "",
      audio_url: "",
      scheduled_date: "",
      is_loop_filler: true,
      is_active: true,
    });

    setShowUploadForm(false);
    alert("Audio guardado exitosamente.");
  };

  const handleDelete = (id) => {
    if (!window.confirm("¿Eliminar este audio?")) return;
    const nextAudios = audioFiles.filter((audio) => audio.id !== id);
    persistAudios(nextAudios);
  };

  const handleToggleActive = (audio) => {
    const nextAudios = audioFiles.map((item) =>
      item.id === audio.id ? { ...item, is_active: !item.is_active } : item
    );
    persistAudios(nextAudios);
  };

  const handleModerate = (id, status) => {
    const nextAudios = audioFiles.map((item) =>
      item.id === id
        ? {
            ...item,
            status,
            moderated_by: user?.email || "admin",
          }
        : item
    );
    persistAudios(nextAudios);
  };

  const pendingAudios = useMemo(
    () => audioFiles.filter((a) => a.status === "pending"),
    [audioFiles]
  );

  const loopFillers = useMemo(
    () => audioFiles.filter((a) => a.is_loop_filler && a.is_active),
    [audioFiles]
  );

  const scheduledAudios = useMemo(
    () => audioFiles.filter((a) => !a.is_loop_filler),
    [audioFiles]
  );

  if (isLoadingAuth || !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <Skeleton className="w-32 h-32 rounded-full" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-6">
        <Card className="max-w-xl w-full bg-gray-800 border-red-500">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Acceso restringido
            </h2>
            <p className="text-gray-300">
              Esta sección solo está disponible para administradores.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center">
            <Music className="w-12 h-12 text-black" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Gestión de Audios Pregrabados
          </h1>

          <p className="text-xl text-gray-300">
            Versión temporal sin Base44 para administrar audios localmente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm">Audios de Relleno</p>
                  <p className="text-3xl font-bold text-white">
                    {loopFillers.length}
                  </p>
                </div>
                <Music className="w-12 h-12 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm">Audios Programados</p>
                  <p className="text-3xl font-bold text-white">
                    {scheduledAudios.length}
                  </p>
                </div>
                <Calendar className="w-12 h-12 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm">Total Audios</p>
                  <p className="text-3xl font-bold text-white">
                    {audioFiles.length}
                  </p>
                </div>
                <Music className="w-12 h-12 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-3xl mx-auto mb-12">
          {!showUploadForm ? (
            <Button
              onClick={() => setShowUploadForm(true)}
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-600 hover:to-cyan-500 text-black h-16 text-lg"
            >
              <Upload className="w-6 h-6 mr-2" />
              Subir Nuevo Audio
            </Button>
          ) : (
            <Card className="bg-gray-800 border-cyan-500">
              <CardHeader>
                <CardTitle className="text-white">
                  Subir Audio Pregrabado
                </CardTitle>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Título del audio"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    required
                    className="bg-gray-900 text-white border-gray-700"
                  />

                  <Textarea
                    placeholder="Descripción (opcional)"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="bg-gray-900 text-white border-gray-700"
                  />

                  <div>
                    <label className="block text-white mb-2">
                      Archivo de Audio
                    </label>

                    <p className="text-xs text-gray-400 mb-2">
                      Versión temporal: máximo 10MB por archivo
                    </p>

                    <Input
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="bg-gray-900 text-white border-gray-700"
                    />

                    {uploading && (
                      <p className="text-cyan-400 mt-2">Procesando archivo...</p>
                    )}

                    {formData.audio_url && (
                      <p className="text-green-500 mt-2">
                        ✓ Archivo cargado correctamente
                      </p>
                    )}
                  </div>

                  <label className="flex items-center gap-2 text-white mb-4">
                    <input
                      type="checkbox"
                      checked={formData.is_loop_filler}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_loop_filler: e.target.checked,
                        }))
                      }
                      className="w-4 h-4"
                    />
                    Audio de relleno
                  </label>

                  {!formData.is_loop_filler && (
                    <div>
                      <label className="block text-white mb-2 text-sm">
                        Fecha y Hora Programada
                      </label>
                      <Input
                        type="datetime-local"
                        value={formData.scheduled_date}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            scheduled_date: e.target.value,
                          }))
                        }
                        className="bg-gray-900 text-white border-gray-700"
                      />
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={!formData.audio_url || uploading}
                      className="bg-gradient-to-r from-cyan-500 to-cyan-400 text-black"
                    >
                      Guardar Audio
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowUploadForm(false);
                        setFormData({
                          title: "",
                          description: "",
                          audio_url: "",
                          scheduled_date: "",
                          is_loop_filler: true,
                          is_active: true,
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {pendingAudios.length > 0 && (
          <div className="max-w-7xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
              Pendientes de Aprobación ({pendingAudios.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingAudios.map((audio) => (
                <Card
                  key={audio.id}
                  className="bg-gray-800 border-yellow-600/50 hover:border-yellow-500 transition-all"
                >
                  <CardContent className="p-4">
                    <h3 className="text-white font-semibold mb-1 truncate">
                      {audio.title}
                    </h3>

                    {audio.description && (
                      <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                        {audio.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                      <span>
                        Subido por: {audio.created_by?.split("@")[0] || "Admin"}
                      </span>
                      <span>
                        • {new Date(audio.created_date).toLocaleDateString()}
                      </span>
                    </div>

                    {audio.audio_url && (
                      <audio
                        controls
                        className="w-full mt-2 h-8"
                        src={audio.audio_url}
                      />
                    )}

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700">
                      <Button
                        size="sm"
                        onClick={() => handleModerate(audio.id, "approved")}
                        className="bg-green-600 hover:bg-green-700 text-white flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprobar
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleModerate(audio.id, "rejected")}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rechazar
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(audio.id)}
                        className="text-red-500 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Music className="w-6 h-6 text-cyan-400" />
              Audios de Relleno (Bucle)
            </h2>

            {loopFillers.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Music className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No hay audios de relleno</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {loopFillers.map((audio) => (
                  <Card
                    key={audio.id}
                    className="bg-gray-800 border-gray-700 hover:border-cyan-500 transition-all"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1">
                            {audio.title}
                          </h3>

                          {audio.description && (
                            <p className="text-gray-400 text-sm mb-2">
                              {audio.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mb-3">
                            <Badge
                              variant="outline"
                              className="text-blue-400 border-blue-600"
                            >
                              Relleno
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                audio.is_active
                                  ? "text-green-400 border-green-600"
                                  : "text-gray-400 border-gray-600"
                              }
                            >
                              {audio.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>

                          {audio.audio_url && (
                            <audio
                              controls
                              className="w-full"
                              src={audio.audio_url}
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggleActive(audio)}
                            className={
                              audio.is_active
                                ? "text-green-500 hover:bg-green-500/20"
                                : "text-gray-500 hover:bg-gray-500/20"
                            }
                            title={audio.is_active ? "Desactivar" : "Activar"}
                          >
                            {audio.is_active ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(audio.id)}
                            className="text-red-500 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-500" />
              Audios Programados
            </h2>

            {scheduledAudios.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No hay audios programados</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {scheduledAudios.map((audio) => (
                  <Card
                    key={audio.id}
                    className="bg-gray-800 border-gray-700 hover:border-purple-600 transition-all"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1">
                            {audio.title}
                          </h3>

                          {audio.description && (
                            <p className="text-gray-400 text-sm mb-2">
                              {audio.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 flex-wrap mb-3">
                            {audio.scheduled_date && (
                              <Badge
                                variant="outline"
                                className="text-purple-400 border-purple-600"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {format(
                                  new Date(audio.scheduled_date),
                                  "d MMM, h:mm a",
                                  { locale: es }
                                )}
                              </Badge>
                            )}

                            <Badge
                              variant="outline"
                              className={
                                audio.is_active
                                  ? "text-green-400 border-green-600"
                                  : "text-gray-400 border-gray-600"
                              }
                            >
                              {audio.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>

                          {audio.audio_url && (
                            <audio
                              controls
                              className="w-full"
                              src={audio.audio_url}
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggleActive(audio)}
                            className={
                              audio.is_active
                                ? "text-green-500 hover:bg-green-500/20"
                                : "text-gray-500 hover:bg-gray-500/20"
                            }
                            title={audio.is_active ? "Desactivar" : "Activar"}
                          >
                            {audio.is_active ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(audio.id)}
                            className="text-red-500 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
