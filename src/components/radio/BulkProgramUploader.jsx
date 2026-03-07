import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Edit, Trash2, Loader2, Save, Music } from 'lucide-react';
import RecurrenceSelector from '@/components/radio/RecurrenceSelector';

export default function BulkProgramUploader({ onSuccess, currentUser }) {
  const [files, setFiles] = React.useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect();
  };

  const handleFileSelect = () => {
    openUploadcareMultiple((filesData) => {
      uploadFilesFromUrls(filesData);
    });
  };

  const openUploadcareMultiple = (callback) => {
    if (!window.uploadcare) {
      alert('El sistema de carga está inicializando. Por favor intenta de nuevo en un momento.');
      return;
    }

    const widget = window.uploadcare.openDialog(null, {
      publicKey: "d6edf1496c801ed26b07",
      multiple: true,
      imagesOnly: false
    });

    widget.done(result => {
      console.log('✅ Widget done, result:', result);
      
      // result.files() devuelve un array (no promise)
      const filesList = result.files();
      console.log('✅ filesList:', filesList);
      
      if (!filesList || filesList.length === 0) {
        alert('No se seleccionaron archivos');
        return;
      }
      
      // Cada elemento en filesList es un jQuery Promise
      const filePromises = filesList.map(fileInfo => {
        return new Promise((resolve) => {
          fileInfo.done(file => {
            console.log('✅ Archivo resuelto:', file);
            resolve({
              url: file.cdnUrl,
              name: file.name,
              size: file.size
            });
          }).fail(err => {
            console.error('❌ Error al resolver archivo:', err);
            resolve(null);
          });
        });
      });
      
      Promise.all(filePromises).then(files => {
        const validFiles = files.filter(f => f !== null);
        console.log('✅ Archivos válidos:', validFiles);
        callback(validFiles);
      });
    });
  };

  const uploadFilesFromUrls = async (filesData) => {
    console.log('📥 uploadFilesFromUrls called with:', filesData);
    
    if (!filesData || filesData.length === 0) {
      alert('❌ No se seleccionaron archivos');
      return;
    }

    setUploading(true);
    
    try {
      const newFiles = filesData.map((fileData, index) => {
        const fileName = fileData.name.replace(/\.[^/.]+$/, '');
        const fileSizeMB = (fileData.size / (1024 * 1024)).toFixed(2);
        console.log(`📄 Processing file ${index + 1}:`, fileName);
        return {
          title: fileName,
          description: '',
          audio_url: fileData.url,
          genre: 'sermon',
          duration_minutes: null,
          file_size_mb: parseFloat(fileSizeMB),
          scheduled_date: '',
          is_recurring: false,
          recurrence_type: 'weekly',
          recurrence_interval: 1,
          days: [],
          auto_broadcast: false
        };
      });
      
      console.log('✅ Files processed:', newFiles);
      setFiles(prevFiles => {
        const updated = [...prevFiles, ...newFiles];
        console.log('✅ Files state updated. Total files:', updated.length);
        return updated;
      });
      
      alert(`✓ ${newFiles.length} archivo(s) agregado(s) exitosamente`);
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Error al cargar archivos: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const openEditModal = (index) => {
    setEditingIndex(index);
    setEditForm({ ...files[index] });
  };

  const saveEdit = () => {
    const newFiles = [...files];
    newFiles[editingIndex] = editForm;
    setFiles(newFiles);
    setEditingIndex(null);
    setEditForm(null);
  };

  const saveAllPrograms = async () => {
    if (files.length === 0) return;

    setSaving(true);
    try {
      await Promise.all(
        files.map(file => 
          base44.entities.RadioProgram.create({
            ...file,
            broadcast_status: 'scheduled',
            is_active: true
          })
        )
      );
      setFiles([]);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar programas');
    } finally {
      setSaving(false);
    }
  };

  const genreLabels = {
    worship: 'Alabanza',
    sermon: 'Predicación',
    prayer: 'Oración',
    meditation: 'Meditación',
    music: 'Música',
    podcast: 'Podcast',
    youth: 'Jóvenes',
    other: 'Otro'
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card className="bg-cyan-900/30 border-cyan-500">
        <CardContent className="p-4">
          <h3 className="text-white font-bold mb-2">📝 Instrucciones:</h3>
          <ol className="text-gray-300 text-sm space-y-1">
            <li>1. Haz clic en "Seleccionar Archivos"</li>
            <li>2. Elige uno o varios archivos de audio</li>
            <li>3. <span className="text-yellow-400 font-bold">IMPORTANTE: Haz clic en el botón azul "Add" para confirmar</span></li>
            <li>4. Espera a que aparezcan en la tabla abajo</li>
            <li>5. Edita los detalles si quieres</li>
            <li>6. Haz clic en "GUARDAR TODO"</li>
          </ol>
        </CardContent>
      </Card>

      {/* Upload Status */}
      {uploading && (
        <Card className="bg-yellow-900/30 border-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
              <div>
                <h3 className="text-white font-semibold">Procesando archivos...</h3>
                <p className="text-gray-400 text-sm">Por favor espera mientras se cargan los archivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drag & Drop Zone */}
      {files.length === 0 && (
        <Card className="bg-gray-800 border-cyan-500">
          <CardContent className="p-8">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                dragging
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-gray-600 hover:border-cyan-500'
              }`}
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Selecciona archivos de audio
              </h3>
              <p className="text-gray-400 mb-2">
                Puedes seleccionar múltiples archivos a la vez
              </p>
              <p className="text-yellow-400 font-bold text-sm mb-4">
                ⚠️ No olvides hacer clic en "Add" después de seleccionar
              </p>
              <Button
                type="button"
                disabled={uploading}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                onClick={handleFileSelect}
              >
                <Upload className="w-4 h-4 mr-2" />
                Seleccionar Archivos
              </Button>
              <p className="text-xs text-gray-500 mt-4">
                MP3, MP4, WAV, M4A, AAC • Sin límite de tamaño
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files Table */}
      {files.length > 0 && (
        <Card className="bg-green-900/30 border-green-500">
          <CardContent className="p-6">
            <div className="bg-green-600 text-white p-4 rounded-lg mb-4">
              <h3 className="font-bold text-lg mb-1">✓ {files.length} archivo(s) cargado(s) exitosamente</h3>
              <p className="text-sm">Edita los detalles si quieres y luego haz clic en "GUARDAR TODO"</p>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <Button
                  onClick={saveAllPrograms}
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
                  disabled={uploading}
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
                    <th className="text-left text-gray-400 text-sm font-medium pb-2">Nombre</th>
                    <th className="text-left text-gray-400 text-sm font-medium pb-2">Duración</th>
                    <th className="text-left text-gray-400 text-sm font-medium pb-2">Tamaño</th>
                    <th className="text-left text-gray-400 text-sm font-medium pb-2">Categoría</th>
                    <th className="text-right text-gray-400 text-sm font-medium pb-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, index) => (
                    <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-3 text-white">{file.title}</td>
                      <td className="py-3 text-gray-400">{file.duration_minutes ? `${file.duration_minutes} min` : '-'}</td>
                      <td className="py-3 text-gray-400">{file.file_size_mb.toFixed(1)} MB</td>
                      <td className="py-3 text-gray-400">{genreLabels[file.genre]}</td>
                      <td className="py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => openEditModal(index)}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            EDITAR
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

      {/* Edit Modal */}
      {editingIndex !== null && editForm && (
        <Dialog open={true} onOpenChange={() => setEditingIndex(null)}>
          <DialogContent className="bg-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Programa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm mb-2">Título</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Descripción</label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Categoría</label>
                <Select
                  value={editForm.genre}
                  onValueChange={(value) => setEditForm({ ...editForm, genre: value })}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sermon">Predicación</SelectItem>
                    <SelectItem value="worship">Alabanza</SelectItem>
                    <SelectItem value="prayer">Oración</SelectItem>
                    <SelectItem value="meditation">Meditación</SelectItem>
                    <SelectItem value="music">Música</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                    <SelectItem value="youth">Jóvenes</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={editForm.is_recurring || false}
                    onChange={(e) => setEditForm({ ...editForm, is_recurring: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Programa Recurrente
                </label>
              </div>

              {editForm.is_recurring ? (
                <RecurrenceSelector formData={editForm} setFormData={setEditForm} />
              ) : (
                <div>
                  <label className="block text-sm mb-2">Fecha y Hora de Transmisión</label>
                  <Input
                    type="datetime-local"
                    value={editForm.scheduled_date || ''}
                    onChange={(e) => setEditForm({ ...editForm, scheduled_date: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={saveEdit} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                  Guardar Cambios
                </Button>
                <Button variant="outline" onClick={() => setEditingIndex(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}