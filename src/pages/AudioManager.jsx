import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Edit,
  Trash2,
  Loader2,
  Save,
  Music,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Disc3,
  Headphones,
} from "lucide-react";

const AUDIO_CATEGORIES = [
  { value: "Predicaciones", label: "Predicaciones" },
  { value: "Cantos LLDM", label: "Cantos LLDM" },
  { value: "Instrumental", label: "Instrumental" },
  { value: "Testimonios", label: "Testimonios" },
  { value: "Podcast", label: "Podcast" },
  { value: "Debates", label: "Debates" },
  { value: "Temas", label: "Temas" },
  { value: "Otros", label: "Otros" },
];

const ACCEPTED_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".m4a",
  ".aac",
  ".ogg",
  ".mp4",
];

const MAX_FILE_SIZE_MB = 500;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const STORAGE_BUCKET = "audios";

function getCategoryLabel(value) {
  return AUDIO_CATEGORIES.find((item) => item.value === value)?.label || "Otros";
}

function sanitizeFileName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getExtension(fileName = "") {
  const match = fileName.toLowerCase().match(/\.[^.]+$/);
  return match ? match[0] : "";
}

function getBaseName(fileName = "") {
  return fileName.replace(/\.[^/.]+$/, "");
}

function normalizeExistingCategory(value) {
  if (!value) return "Otros";

  const exact = AUDIO_CATEGORIES.find((item) => item.value === value);
  if (exact) return exact.value;

  const lower = String(value).trim().toLowerCase();

  if (lower === "sermon" || lower === "sermón") return "Predicaciones";
  if (lower === "worship" || lower === "music" || lower === "música") return "Cantos LLDM";
  if (lower === "meditation" || lower === "meditación") return "Instrumental";
  if (lower === "prayer" || lower === "oracion" || lower === "oración") return "Temas";
  if (lower === "podcast") return "Podcast";
  if (lower === "other" || lower === "otro") return "Otros";

  return "Otros";
}

function inferCategoryFromName(fileName = "") {
  const name = fileName.toLowerCase();

  if (name.includes("predic")) return "Predicaciones";
  if (name.includes("canto")) return "Cantos LLDM";
  if (name.includes("instrumental")) return "Instrumental";
  if (name.includes("testimonio")) return "Testimonios";
  if (name.includes("podcast")) return "Podcast";
  if (name.includes("debate")) return "Debates";
  if (name.includes("tema")) return "Temas";

  return "Otros";
}

export default function AudioManager() {
  const { user, isLoadingAuth } = useAuth();

  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [audios, setAudios] = useState([]);
  const [loadingAudios, setLoadingAudios] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [editingQueueIndex, setEditingQueueIndex] = useState(null);
  const [queueEditForm, setQueueEditForm] = useState(null);

  const [editingExistingId, setEditingExistingId] = useState(null);
  const [existingEditForm, setExistingEditForm] = useState(null);
  const [updatingExisting, setUpdatingExisting] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && user?.role === "admin") {
      loadAudios();
    }
  }, [isLoadingAuth, user]);

  async function loadAudios() {
    try {
      setLoadingAudios(true);

      const { data, error } = await supabase
        .from("audios")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;

      const cleaned = (data || []).map((item) => ({
        ...item,
        category: normalizeExistingCategory(item.category),
      }));

      setAudios(cleaned);
    } catch (error) {
      console.error("Error cargando audios:", error);
      alert(`Error al cargar audios: ${error?.message || "Error inesperado."}`);
    } finally {
      setLoadingAudios(false);
    }
  }

  const processSelectedFiles = (fileList) => {
    const selectedFiles = Array.from(fileList || []);
    if (selectedFiles.length === 0) return;

    const validFiles = [];
    const rejectedFiles = [];

    for (const file of selectedFiles) {
      const extension = getExtension(file.name);

      if (!ACCEPTED_EXTENSIONS.includes(extension)) {
        rejectedFiles.push(
          `${file.name}: tipo no permitido (${extension || "sin extensión"})`
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        rejectedFiles.push(
          `${file.name}: excede el máximo de ${MAX_FILE_SIZE_MB} MB`
        );
        continue;
      }

      validFiles.push({
        localFile: file,
        original_name: file.name,
        title: getBaseName(file.name),
        description: "",
        category: inferCategoryFromName(file.name),
        audio_url: "",
        file_size_mb: Number((file.size / (1024 * 1024)).toFixed(2)),
        is_active: true,
      });
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }

    if (rejectedFiles.length > 0) {
      alert(
        `Algunos archivos no se pudieron agregar:\n\n${rejectedFiles.join("\n")}`
      );
    }

    if (validFiles.length > 0 && rejectedFiles.length === 0) {
      alert(`✓ ${validFiles.length} audio(s) agregado(s) correctamente.`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processSelectedFiles(e.dataTransfer.files);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeQueuedFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const openQueueEditModal = (index) => {
    setEditingQueueIndex(index);
    setQueueEditForm({ ...files[index] });
  };

  const cancelQueueEdit = () => {
    setEditingQueueIndex(null);
    setQueueEditForm(null);
  };

  const saveQueueEdit = () => {
    if (!queueEditForm?.title?.trim()) {
      alert("El título no puede ir vacío.");
      return;
    }

    const updated = [...files];
    updated[editingQueueIndex] = {
      ...updated[editingQueueIndex],
      ...queueEditForm,
      title: queueEditForm.title.trim(),
      description: queueEditForm.description?.trim() || "",
    };

    setFiles(updated);
    cancelQueueEdit();
  };

  const uploadOneFileToSupabase = async (fileEntry) => {
    const file = fileEntry.localFile;

    if (!file) {
      throw new Error(`No se encontró el archivo local para "${fileEntry.title}".`);
    }

    const extension = getExtension(file.name) || ".mp3";
    const safeOriginalName = sanitizeFileName(getBaseName(file.name) || "audio");
    const safeTitle = sanitizeFileName(fileEntry.title || safeOriginalName || "audio");
    const userFolder = sanitizeFileName(user?.email || user?.id || "admin");

    const filePath = `${userFolder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}-${safeTitle || safeOriginalName}${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    const audioUrl = publicUrlData?.publicUrl;

    if (!audioUrl) {
      throw new Error(`No se pudo obtener la URL pública de "${fileEntry.title}".`);
    }

    return {
      title: fileEntry.title.trim(),
      description: fileEntry.description?.trim() || "",
      category: fileEntry.category || "Otros",
      audio_url: audioUrl,
      file_size_mb: fileEntry.file_size_mb || 0,
      is_active:
        typeof fileEntry.is_active === "boolean" ? fileEntry.is_active : true,
      created_by: user?.email || "admin",
    };
  };

  const saveAllAudios = async () => {
    if (files.length === 0) {
      alert("No hay audios para guardar.");
      return;
    }

    setSaving(true);

    try {
      const payload = [];

      for (const fileEntry of files) {
        const savedAudio = await uploadOneFileToSupabase(fileEntry);
        payload.push(savedAudio);
      }

      const { error } = await supabase.from("audios").insert(payload);

      if (error) {
        throw error;
      }

      setFiles([]);
      await loadAudios();
      alert("✓ Audios subidos y guardados correctamente.");
    } catch (error) {
      console.error("Error guardando audios:", error);
      alert(
        `Error al subir o guardar audios: ${
          error?.message || "Ocurrió un error inesperado."
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  const openExistingEdit = (audio) => {
    setEditingExistingId(audio.id);
    setExistingEditForm({
      title: audio.title || "",
      description: audio.description || "",
      category: normalizeExistingCategory(audio.category),
      is_active: Boolean(audio.is_active),
    });
  };

  const cancelExistingEdit = () => {
    setEditingExistingId(null);
    setExistingEditForm(null);
  };

  const saveExistingEdit = async () => {
    if (!existingEditForm?.title?.trim()) {
      alert("El título no puede ir vacío.");
      return;
    }

    try {
      setUpdatingExisting(true);

      const { error } = await supabase
        .from("audios")
        .update({
          title: existingEditForm.title.trim(),
          description: existingEditForm.description?.trim() || "",
          category: existingEditForm.category || "Otros",
          is_active: existingEditForm.is_active,
        })
        .eq("id", editingExistingId);

      if (error) throw error;

      await loadAudios();
      cancelExistingEdit();
      alert("✓ Audio actualizado correctamente.");
    } catch (error) {
      console.error("Error actualizando audio:", error);
      alert(`Error al actualizar audio: ${error?.message || "Error inesperado."}`);
    } finally {
      setUpdatingExisting(false);
    }
  };

  const toggleExistingActive = async (audio) => {
    try {
      const { error } = await supabase
        .from("audios")
        .update({ is_active: !audio.is_active })
        .eq("id", audio.id);

      if (error) throw error;

      await loadAudios();
    } catch (error) {
      console.error("Error cambiando estado:", error);
      alert(`Error al cambiar estado: ${error?.message || "Error inesperado."}`);
    }
  };

  const deleteExistingAudio = async (audio) => {
    const ok = window.confirm(`¿Eliminar el audio "${audio.title || "Sin título"}"?`);
    if (!ok) return;

    try {
      const { error } = await supabase.from("audios").delete().eq("id", audio.id);
      if (error) throw error;

      await loadAudios();
      alert("✓ Audio eliminado.");
    } catch (error) {
      console.error("Error eliminando audio:", error);
      alert(`Error al eliminar audio: ${error?.message || "Error inesperado."}`);
    }
  };

  const activeAudios = useMemo(
    () => audios.filter((audio) => audio.is_active),
    [audios]
  );

  const inactiveAudios = useMemo(
    () => audios.filter((audio) => !audio.is_active),
    [audios]
  );

  if (isLoadingAuth) {
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
        <div className="text-center mb-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-400 flex items-center justify-center">
            <Disc3 className="w-12 h-12 text-black" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Administración de LLDMPlay
          </h1>

          <p className="text-xl text-gray-300">
            Subida múltiple, edición y control de audios conectados a Supabase
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-cyan-900 to-cyan-800 border-cyan-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm">Audios activos</p>
                  <p className="text-3xl font-bold text-white">
                    {activeAudios.length}
                  </p>
                </div>
                <Eye className="w-12 h-12 text-cyan-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Audios inactivos</p>
                  <p className="text-3xl font-bold text-white">
                    {inactiveAudios.length}
                  </p>
                </div>
                <EyeOff className="w-12 h-12 text-gray-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm">Total audios</p>
                  <p className="text-3xl font-bold text-white">
                    {audios.length}
                  </p>
                </div>
                <Headphones className="w-12 h-12 text-green-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="hidden"
          onChange={(e) => processSelectedFiles(e.target.files)}
        />

        <Card className="bg-cyan-900/30 border-cyan-500 mb-8">
          <CardContent className="p-4">
            <h3 className="text-white font-bold mb-2">Cómo funciona</h3>
            <ol className="text-gray-300 text-sm space-y-1">
              <li>1. Haz clic en "Seleccionar Audios"</li>
              <li>2. Elige uno o varios archivos</li>
              <li>3. Edita título, descripción o categoría si quieres</li>
              <li>4. Activa o desactiva cada audio</li>
              <li>5. Haz clic en "GUARDAR TODO"</li>
            </ol>
            <div className="mt-3 text-xs text-cyan-200 space-y-1">
              <p>Formatos permitidos: MP3, WAV, M4A, AAC, OGG, MP4</p>
              <p>Tamaño máximo por archivo: {MAX_FILE_SIZE_MB} MB</p>
              <p>Los archivos se guardan directo en Supabase Storage.</p>
              <p>
                Categorías de LLDMPlay: Predicaciones, Cantos LLDM, Instrumental,
                Testimonios, Podcast, Debates, Temas y Otros.
              </p>
            </div>
          </CardContent>
        </Card>

        {files.length === 0 && (
          <Card className="bg-gray-800 border-cyan-500 mb-10">
            <CardContent className="p-8">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                  dragging
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-gray-600 hover:border-cyan-500"
                }`}
              >
                <Upload className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Selecciona audios para LLDMPlay
                </h3>
                <p className="text-gray-400 mb-4">
                  Puedes subir varios audios a la vez
                </p>

                <Button
                  type="button"
                  disabled={saving}
                  className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                  onClick={handleFileSelect}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Seleccionar Audios
                </Button>

                <p className="text-xs text-gray-500 mt-4">
                  MP3, WAV, M4A, AAC, OGG, MP4 · máximo {MAX_FILE_SIZE_MB} MB
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {files.length > 0 && (
          <Card className="bg-green-900/30 border-green-500 mb-10">
            <CardContent className="p-6">
              <div className="bg-green-600 text-white p-4 rounded-lg mb-4">
                <h3 className="font-bold text-lg mb-1">
                  ✓ {files.length} audio(s) listo(s)
                </h3>
                <p className="text-sm">
                  Revísalos y luego haz clic en "GUARDAR TODO"
                </p>
              </div>

              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={saveAllAudios}
                    disabled={saving || files.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-6"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        GUARDAR TODO
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleFileSelect}
                    disabled={saving}
                    variant="outline"
                    className="border-cyan-500 text-cyan-400"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Agregar Más
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-400 text-sm font-medium pb-2">
                        Nombre
                      </th>
                      <th className="text-left text-gray-400 text-sm font-medium pb-2">
                        Tamaño
                      </th>
                      <th className="text-left text-gray-400 text-sm font-medium pb-2">
                        Categoría
                      </th>
                      <th className="text-left text-gray-400 text-sm font-medium pb-2">
                        Estado
                      </th>
                      <th className="text-right text-gray-400 text-sm font-medium pb-2">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file, index) => (
                      <tr
                        key={`${file.original_name}-${index}`}
                        className="border-b border-gray-700/50 hover:bg-gray-700/30"
                      >
                        <td className="py-3 text-white">{file.title}</td>
                        <td className="py-3 text-gray-400">
                          {Number(file.file_size_mb || 0).toFixed(1)} MB
                        </td>
                        <td className="py-3 text-gray-400">
                          {getCategoryLabel(file.category)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              file.is_active
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-300"
                            }`}
                          >
                            {file.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              onClick={() => openQueueEditModal(index)}
                              className="bg-cyan-600 hover:bg-cyan-700 text-white"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const updated = [...files];
                                updated[index] = {
                                  ...updated[index],
                                  is_active: !updated[index].is_active,
                                };
                                setFiles(updated);
                              }}
                              className="border-gray-600 text-gray-200"
                            >
                              {file.is_active ? (
                                <>
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3 mr-1" />
                                  Activar
                                </>
                              )}
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeQueuedFile(index)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {editingQueueIndex !== null && queueEditForm && (
          <Card className="bg-gray-800 border-cyan-500 mb-10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-bold text-lg">
                  Editar Audio en Cola
                </h3>
              </div>

              <div>
                <label className="block text-sm mb-2 text-white">Título</label>
                <Input
                  value={queueEditForm.title}
                  onChange={(e) =>
                    setQueueEditForm({ ...queueEditForm, title: e.target.value })
                  }
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-white">
                  Descripción
                </label>
                <Textarea
                  value={queueEditForm.description}
                  onChange={(e) =>
                    setQueueEditForm({
                      ...queueEditForm,
                      description: e.target.value,
                    })
                  }
                  className="bg-gray-900 border-gray-700 text-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-white">
                  Categoría
                </label>
                <select
                  value={queueEditForm.category}
                  onChange={(e) =>
                    setQueueEditForm({
                      ...queueEditForm,
                      category: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white"
                >
                  {AUDIO_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={queueEditForm.is_active}
                  onChange={(e) =>
                    setQueueEditForm({
                      ...queueEditForm,
                      is_active: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                Audio activo
              </label>

              <div className="flex gap-3 pt-4">
                <Button onClick={saveQueueEdit} className="bg-cyan-600 hover:bg-cyan-700">
                  Guardar Cambios
                </Button>
                <Button variant="outline" onClick={cancelQueueEdit}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h2 className="text-2xl font-bold text-white">
            Audios guardados en LLDMPlay
          </h2>

          <Button
            variant="outline"
            onClick={loadAudios}
            className="border-cyan-500 text-cyan-400"
            disabled={loadingAudios}
          >
            {loadingAudios ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar
              </>
            )}
          </Button>
        </div>

        {loadingAudios ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-2/3 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : audios.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <Music className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No hay audios guardados todavía.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {audios.map((audio) => (
              <Card
                key={audio.id}
                className="bg-gray-800 border-gray-700 hover:border-cyan-500 transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[260px]">
                      <h3 className="text-white font-semibold mb-1">
                        {audio.title || "Sin título"}
                      </h3>

                      {audio.description ? (
                        <p className="text-gray-400 text-sm mb-2">
                          {audio.description}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm mb-2">
                          Sin descripción
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <Badge
                          variant="outline"
                          className="text-cyan-300 border-cyan-600"
                        >
                          {getCategoryLabel(audio.category)}
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

                        {audio.file_size_mb ? (
                          <Badge
                            variant="outline"
                            className="text-gray-300 border-gray-600"
                          >
                            {Number(audio.file_size_mb).toFixed(1)} MB
                          </Badge>
                        ) : null}
                      </div>

                      {audio.audio_url ? (
                        <audio controls className="w-full" src={audio.audio_url} />
                      ) : (
                        <p className="text-red-400 text-sm">Este audio no tiene URL.</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => openExistingEdit(audio)}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleExistingActive(audio)}
                        className="border-gray-600 text-gray-200"
                      >
                        {audio.is_active ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Activar
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteExistingAudio(audio)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {editingExistingId && existingEditForm && (
          <Card className="bg-gray-800 border-cyan-500 mt-10">
            <CardHeader>
              <CardTitle className="text-white">Editar audio guardado</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-white">Título</label>
                <Input
                  value={existingEditForm.title}
                  onChange={(e) =>
                    setExistingEditForm({
                      ...existingEditForm,
                      title: e.target.value,
                    })
                  }
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-white">
                  Descripción
                </label>
                <Textarea
                  value={existingEditForm.description}
                  onChange={(e) =>
                    setExistingEditForm({
                      ...existingEditForm,
                      description: e.target.value,
                    })
                  }
                  className="bg-gray-900 border-gray-700 text-white"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-white">
                  Categoría
                </label>
                <select
                  value={existingEditForm.category}
                  onChange={(e) =>
                    setExistingEditForm({
                      ...existingEditForm,
                      category: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white"
                >
                  {AUDIO_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={existingEditForm.is_active}
                  onChange={(e) =>
                    setExistingEditForm({
                      ...existingEditForm,
                      is_active: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                Audio activo
              </label>

              <div className="flex gap-3 pt-4 flex-wrap">
                <Button
                  onClick={saveExistingEdit}
                  className="bg-cyan-600 hover:bg-cyan-700"
                  disabled={updatingExisting}
                >
                  {updatingExisting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>

                <Button variant="outline" onClick={cancelExistingEdit}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
