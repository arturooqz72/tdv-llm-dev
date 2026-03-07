import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, BarChart3 } from 'lucide-react';

export default function PollManager({ programId }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const queryClient = useQueryClient();

  const { data: polls = [] } = useQuery({
    queryKey: ['polls', programId],
    queryFn: () => base44.entities.RadioPoll.filter({ program_id: programId }, '-created_date'),
    enabled: !!programId
  });

  const createPollMutation = useMutation({
    mutationFn: async (pollData) => {
      return await base44.entities.RadioPoll.create(pollData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', programId] });
      setQuestion('');
      setOptions(['', '']);
    }
  });

  const togglePollMutation = useMutation({
    mutationFn: async ({ pollId, isActive }) => {
      return await base44.entities.RadioPoll.update(pollId, { is_active: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', programId] });
    }
  });

  const deletePollMutation = useMutation({
    mutationFn: async (pollId) => {
      return await base44.entities.RadioPoll.delete(pollId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', programId] });
    }
  });

  const handleCreatePoll = () => {
    const validOptions = options.filter(opt => opt.trim());
    if (!question.trim() || validOptions.length < 2) return;

    createPollMutation.mutate({
      program_id: programId,
      question: question.trim(),
      options: validOptions,
      is_active: true,
      responses_count: {}
    });
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Create Poll */}
      <Card className="bg-gray-800 border-yellow-600">
        <CardHeader>
          <CardTitle className="text-white">Crear Nueva Encuesta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-white mb-2 text-sm">Pregunta</label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="¿Cuál es tu opinión sobre...?"
              className="bg-gray-900 text-white border-gray-700"
            />
          </div>

          <div>
            <label className="block text-white mb-2 text-sm">Opciones de Respuesta</label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opción ${index + 1}`}
                    className="bg-gray-900 text-white border-gray-700"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Opción
            </Button>
          </div>

          <Button
            onClick={handleCreatePoll}
            disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            Crear Encuesta
          </Button>
        </CardContent>
      </Card>

      {/* Existing Polls */}
      <div className="space-y-4">
        {polls.map(poll => {
          const totalResponses = Object.values(poll.responses_count || {}).reduce((a, b) => a + b, 0);
          
          return (
            <Card key={poll.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg mb-2">{poll.question}</CardTitle>
                    <p className="text-sm text-gray-400">{totalResponses} respuestas</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={poll.is_active ? "default" : "outline"}
                      onClick={() => togglePollMutation.mutate({ pollId: poll.id, isActive: poll.is_active })}
                    >
                      {poll.is_active ? 'Activa' : 'Inactiva'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePollMutation.mutate(poll.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {poll.options.map((option, index) => {
                    const count = poll.responses_count?.[option] || 0;
                    const percentage = totalResponses > 0 ? ((count / totalResponses) * 100).toFixed(1) : 0;
                    
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-white">{option}</span>
                          <span className="text-gray-400">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-yellow-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {polls.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay encuestas
            </h3>
            <p className="text-gray-400">
              Crea tu primera encuesta para interactuar con tus oyentes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}