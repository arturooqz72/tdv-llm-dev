import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function RecurrenceSelector({ formData, setFormData }) {
  const dayNames = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const weekOptions = [
    { value: 1, label: 'Primer' },
    { value: 2, label: 'Segundo' },
    { value: 3, label: 'Tercer' },
    { value: 4, label: 'Cuarto' },
    { value: 5, label: 'Último' }
  ];

  const dayOfWeekOptions = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white mb-2 text-sm">Tipo de Recurrencia</label>
        <Select
          value={formData.recurrence_type || 'weekly'}
          onValueChange={(value) => setFormData({ ...formData, recurrence_type: value })}
        >
          <SelectTrigger className="bg-gray-900 text-white border-gray-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="biweekly">Quincenal (cada 2 semanas)</SelectItem>
            <SelectItem value="monthly_day">Mensual (día específico del mes)</SelectItem>
            <SelectItem value="monthly_week">Mensual (ej. primer lunes)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.recurrence_type === 'weekly' && (
        <div>
          <label className="block text-white mb-2 text-sm">Días de la Semana</label>
          <div className="grid grid-cols-4 gap-2">
            {dayNames.map(day => (
              <label key={day} className="flex items-center gap-2 text-white text-sm">
                <input
                  type="checkbox"
                  checked={formData.days?.includes(day) || false}
                  onChange={(e) => {
                    const days = formData.days || [];
                    if (e.target.checked) {
                      setFormData({ ...formData, days: [...days, day] });
                    } else {
                      setFormData({ ...formData, days: days.filter(d => d !== day) });
                    }
                  }}
                  className="w-4 h-4"
                />
                {day.charAt(0).toUpperCase() + day.slice(1, 3)}
              </label>
            ))}
          </div>
        </div>
      )}

      {formData.recurrence_type === 'biweekly' && (
        <div>
          <label className="block text-white mb-2 text-sm">Días de la Semana (cada 2 semanas)</label>
          <div className="grid grid-cols-4 gap-2">
            {dayNames.map(day => (
              <label key={day} className="flex items-center gap-2 text-white text-sm">
                <input
                  type="checkbox"
                  checked={formData.days?.includes(day) || false}
                  onChange={(e) => {
                    const days = formData.days || [];
                    if (e.target.checked) {
                      setFormData({ ...formData, days: [...days, day], recurrence_interval: 2 });
                    } else {
                      setFormData({ ...formData, days: days.filter(d => d !== day) });
                    }
                  }}
                  className="w-4 h-4"
                />
                {day.charAt(0).toUpperCase() + day.slice(1, 3)}
              </label>
            ))}
          </div>
        </div>
      )}

      {formData.recurrence_type === 'monthly_day' && (
        <div>
          <label className="block text-white mb-2 text-sm">Día del Mes</label>
          <Input
            type="number"
            min="1"
            max="31"
            value={formData.monthly_day_of_week || ''}
            onChange={(e) => setFormData({ ...formData, monthly_day_of_week: parseInt(e.target.value) })}
            placeholder="1-31"
            className="bg-gray-900 text-white border-gray-700"
          />
          <p className="text-xs text-gray-400 mt-1">
            Si el día no existe en el mes, se usará el último día disponible
          </p>
        </div>
      )}

      {formData.recurrence_type === 'monthly_week' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white mb-2 text-sm">Semana del Mes</label>
            <Select
              value={formData.monthly_week?.toString()}
              onValueChange={(value) => setFormData({ ...formData, monthly_week: parseInt(value) })}
            >
              <SelectTrigger className="bg-gray-900 text-white border-gray-700">
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-white mb-2 text-sm">Día de la Semana</label>
            <Select
              value={formData.monthly_day_of_week?.toString()}
              onValueChange={(value) => setFormData({ ...formData, monthly_day_of_week: parseInt(value) })}
            >
              <SelectTrigger className="bg-gray-900 text-white border-gray-700">
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                {dayOfWeekOptions.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div>
        <label className="block text-white mb-2 text-sm">Hora de Transmisión</label>
        <Input
          type="time"
          value={formData.schedule_time || ''}
          onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
          className="bg-gray-900 text-white border-gray-700"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="auto_broadcast"
          checked={formData.auto_broadcast || false}
          onChange={(e) => setFormData({ ...formData, auto_broadcast: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="auto_broadcast" className="text-white text-sm">
          Transmitir automáticamente (programa enlatado/pregrabado)
        </label>
      </div>
      {formData.auto_broadcast && (
        <p className="text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded">
          Este programa se transmitirá automáticamente en los horarios programados
        </p>
      )}
    </div>
  );
}