import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RecurrenceSelector from './RecurrenceSelector';
import { Loader2 } from 'lucide-react';

export default function ProgramEditor({ program, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: program.title || '',
    description: program.description || '',
    schedule_time: program.schedule_time || '',
    is_recurring: program.is_recurring || false,
    recurrence_type: program.recurrence_type || 'weekly',
    recurrence_interval: program.recurrence_interval || 1,
    monthly_week: program.monthly_week || null,
    monthly_day_of_week: program.monthly_day_of_week || null,
    days: program.days || [],
    auto_broadcast: program.auto_broadcast || false,
    is_active: program.is_active ?? true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.entities.RadioProgram.update(program.id, formData);
      onSave();
    } catch (error) {
      console.error('Error updating program:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Programa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2 text-sm">Título</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-gray-900 text-white border-gray-700"
              required
            />
          </div>

          <div>
            <label className="block text-white mb-2 text-sm">Descripción</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-gray-900 text-white border-gray-700"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-white mb-2 text-sm">Estado del Programa</label>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-white text-sm">
                Programa activo
              </label>
            </div>
          </div>

          <div>
            <label className="block text-white mb-2 text-sm">¿Programa Recurrente?</label>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-white text-sm">Configurar programación recurrente</span>
            </div>
          </div>

          {formData.is_recurring && (
            <RecurrenceSelector formData={formData} setFormData={setFormData} />
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}