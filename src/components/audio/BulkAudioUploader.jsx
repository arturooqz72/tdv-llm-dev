import React, { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Edit,
  Trash2,
  Loader2,
  Save,
  Music,
  Eye,
  EyeOff,
} from "lucide-react";

const AUDIO_CATEGORIES = [
  { value: "predicaciones", label: "Predicaciones" },
  { value: "cantos", label: "Cantos" },
  { value: "testimonios", label: "Testimonios" },
  { value: "platicas", label: "Platicas" },
  { value: "debates", label: "Debates" },
  { value: "temas", label: "Temas" },
  { value: "podcast", label: "Podcast" },
  { value: "otros", label: "Otros" },
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
  return (
    AUDIO_CATEGORIES.find((item) => item.value === value)?.label || "Otros"
  );
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

export default function BulkAudioUploader({ onSuccess, currentUser }) {
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const processSelectedFiles = (fileList) => {
    const selectedFiles = Array.from(fileList || []);

    if (selectedFiles.length === 0) {
      return;
    }

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
        category: "predicaciones",
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

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const openEditModal = (index) => {
    setEditingIndex(index);
    setEditForm({ ...files[index] });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (!editForm?.title?.trim()) {
      alert("El título no puede ir vacío.");
      return;
    }

    const updated = [...files];
    updated[editingIndex] = {
      ...updated[editingIndex],
      ...editForm,
      title: editForm.title.trim(),
      description: editForm.description?.trim() || "",
    };

    setFiles(updated);
    cancelEdit();
  };

  const uploadOneFileToSupabase = async (fileEntry) => {
    const file = fileEntry.localFile;

    if (!file) {
      throw new Error(`No se encontró el archivo local para "${fileEntry.title}".`);
    }

    const extension = getExtension(file.name) || ".mp3";
    const safeOriginalName = sanitizeFileName(getBaseName(file.name) || "audio");
    const safeTitle = sanitizeFileName(fileEntry.title || safeOriginalName || "audio");
    const userFolder = sanitizeFileName(
      currentUser?.email || currentUser?.id || "admin"
    );

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
      category: fileEntry.category || "otros",
      audio_url: audioUrl,
      file_size_mb: fileEntry.file_size_mb || 0,
      is_active:
        typeof fileEntry.is_active === "boolean" ? fileEntry.is_active : true,
      created_by: currentUser?.email || "admin",
    };
  };

  const saveAllAudios = async () => {
    if (files.length === 0) {
      alert("No hay audios para guardar.");
      return;
    }

    setSaving(true);
    setUploading(true);

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
      alert("✓ Audios subidos y guardados correctamente.");

      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("Error guardando audios:", error);
      alert(
        `Error al subir o guardar audios: ${
          error?.message || "Ocurrió un error inesperado."
        }`
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={(e) => processSelectedFiles(e.target.files)}
      />

      <Card className="bg-cyan-900/30 border-cyan-500">
        <CardContent className="p-4">
          <h3 className="text-white font-bold mb-2">Cómo funciona</h3>
          <ol className="text-gray-300 text-sm space-y-1">
            <li>1. Haz clic en "Seleccionar Audios"</li>
            <li>2. Elige uno o varios archivos</li>
            <li>3. Espera a que aparezcan en la lista</li>
            <li>4. Edita título, descripción o categoría si quieres</li>
            <li>5. Activa o desactiva cada audio</li>
            <li>6. Haz clic en "GUARDAR TODO"</li>
          </ol>
          <div className="mt-3 text-xs text-cyan-200 space-y-1">
            <p>Formatos permitidos: MP3, WAV, M4A, AAC, OGG, MP4</p>
            <p>Tamaño máximo por archivo: {MAX_FILE_SIZE_MB} MB</p>
            <p>Los archivos se guardan directo en Supabase Storage.</p>
          </div>
        </CardContent>
      </Card>

      {uploading && (
        <Card className="bg-yellow-900/30 border-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
              <div>
                <h3 className="text-white font-semibold">
                  Procesando archivos...
                </h3>
                <p className="text-gray-400 text-sm">
                  Espera mientras se preparan los audios
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {files.length === 0 && (
        <Card className="bg-gray-800 border-cyan-500">
          <CardContent className="p-8">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                dragging
                  ? "border-cyan-400 bg-cyan-400/10"
                  : "border-gray-600 hover:border-cyan-500"
              }`}
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Selecciona audios
              </h3>
              <p className="text-gray-400 mb-4">
                Puedes subir varios audios a la vez
              </p>

              <Button
                type="button"
                disabled={uploading || saving}
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
        <Card className="bg-green-900/30 border-green-500">
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
                  disabled={uploading || saving}
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
                            onClick={() => openEditModal(index)}
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
                            onClick={() => removeFile(index)}
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

      {editingIndex !== null && editForm && (
        <Card className="bg-gray-800 border-cyan-500">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-cyan-400" />
              <h3 className="text-white font-bold text-lg">Editar Audio</h3>
            </div>

            <div>
              <label className="block text-sm mb-2 text-white">Título</label>
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-white">
                Descripción
              </label>
              <Textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
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
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({ ...editForm, category: e.target.value })
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
                checked={editForm.is_active}
                onChange={(e) =>
                  setEditForm({ ...editForm, is_active: e.target.checked })
                }
                className="w-4 h-4"
              />
              Audio activo
            </label>

            <div className="flex gap-3 pt-4">
              <Button onClick={saveEdit} className="bg-cyan-600 hover:bg-cyan-700">
                Guardar Cambios
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
