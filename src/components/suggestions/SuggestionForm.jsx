import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send } from 'lucide-react';

const categories = [
  { value: 'feature', label: '💡 Nueva función' },
  { value: 'improvement', label: '🔧 Mejora' },
  { value: 'bug', label: '🐛 Problema' },
  { value: 'content', label: '📺 Contenido' },
  { value: 'other', label: '📝 Otro' },
];

export default function SuggestionForm({ onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('feature');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    await base44.entities.Suggestion.create({
      title: title.trim(),
      description: description.trim(),
      category,
      status: 'pending',
      votes_count: 0
    });
    setTitle('');
    setDescription('');
    setCategory('feature');
    setSubmitting(false);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900/60 border border-gray-700 rounded-2xl p-5 space-y-4">
      <h3 className="text-lg font-semibold text-white">Enviar Sugerencia</h3>
      <Input
        placeholder="Título de tu sugerencia"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-gray-800 border-gray-600 text-white"
        required
      />
      <Textarea
        placeholder="Describe tu idea o sugerencia..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="bg-gray-800 border-gray-600 text-white min-h-24"
        required
      />
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.map(c => (
            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={submitting} className="bg-cyan-500 hover:bg-cyan-600 text-black w-full">
        <Send className="w-4 h-4 mr-2" />
        {submitting ? 'Enviando...' : 'Enviar Sugerencia'}
      </Button>
    </form>
  );
}