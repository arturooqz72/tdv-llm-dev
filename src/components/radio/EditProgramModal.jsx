import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function EditProgramModal({ program, onClose, onSuccess }) {
  const [title, setTitle] = useState(program?.title || '');
  const [description, setDescription] = useState(program?.description || '');
  const [genre, setGenre] = useState(program?.genre || '');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.RadioProgram.update(program.id, {
        title: title.trim(),
        description: description.trim(),
        genre: genre || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio-programs'] });
      onSuccess?.();
      onClose();
    }
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('Por favor ingresa un título');
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border border-yellow-600">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Programa de Radio</DialogTitle>
          <DialogDescription className="text-gray-400">
            Modifica el título y descripción de tu programa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 block mb-2">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del programa"
              className="bg-gray-700 text-white border-gray-600"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-2">Descripción</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del programa (opcional)"
              className="bg-gray-700 text-white border-gray-600 h-24"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-2">Género</label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                <SelectValue placeholder="Selecciona un género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worship">Alabanzas</SelectItem>
                <SelectItem value="sermon">Predicaciones</SelectItem>
                <SelectItem value="prayer">Oración</SelectItem>
                <SelectItem value="meditation">Meditación</SelectItem>
                <SelectItem value="music">Música</SelectItem>
                <SelectItem value="podcast">Podcast</SelectItem>
                <SelectItem value="youth">Jóvenes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-yellow-600 hover:bg-yellow-700 text-black"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}