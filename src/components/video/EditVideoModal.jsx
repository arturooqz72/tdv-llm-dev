import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const VIDEO_STORAGE_KEYS = [
  "tdv_videos",
  "tdv_video_files",
  "tdv_uploaded_videos",
];

const religions = [
  { value: "lldm", label: "LLDM" },
  { value: "cristianismo", label: "Cristianismo" },
  { value: "otros", label: "Otros" },
];

const statusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "approved", label: "Aprobado" },
  { value: "rejected", label: "Rechazado" },
];

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

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function EditVideoModal({ video, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: video?.title || "",
    description: video?.description || "",
    religion: video?.religion || "otros",
    topic: video?.topic || "",
    tags: video?.tags?.join(", ") || "",
    status: video?.status || "pending",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      title: video?.title || "",
      description: video?.description || "",
      religion: video?.religion || "otros",
      topic: video?.topic || "",
      tags: video?.tags?.join(", ") || "",
      status: video?.status || "pending",
    });
  }, [video]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!video?.id) return;

    setSaving(true);

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      let updated = false;

      for (const key of VIDEO_STORAGE_KEYS) {
        const collection = readJSON(key, []);
        if (!Array.isArray(collection) || collection.length === 0) continue;

        const exists = collection.some((item) => String(item.id) === String(video.id));
        if (!exists) continue;

        const nextCollection = collection.map((item) =>
          String(item.id) === String(video.id)
            ? {
                ...item,
                title: formData.title,
                description: formData.description,
                religion: formData.religion,
                topic: formData.topic,
                tags: tagsArray,
                status: formData.status,
              }
            : item
        );

        saveJSON(key, nextCollection);
        updated = true;
        break;
      }

      if (!updated) {
        alert("No se encontró el video para actualizar.");
        return;
      }

      if (onSave) onSave();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error al actualizar video:", error);
      alert("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Video</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div>
            <Label>Categoría *</Label>
            <Select
              value={formData.religion}
              onValueChange={(value) => setFormData({ ...formData, religion: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {religions.map((rel) => (
                  <SelectItem key={rel.value} value={rel.value}>
                    {rel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="topic">Tema</Label>
            <Input
              id="topic"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="ej: oración, meditación"
            />
          </div>

          <div>
            <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="ej: fe, esperanza, amor"
            />
          </div>

          <div>
            <Label>Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
