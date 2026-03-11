import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lightbulb, Loader2 } from 'lucide-react';
import SuggestionForm from '@/components/suggestions/SuggestionForm';
import SuggestionCard from '@/components/suggestions/SuggestionCard';

export default function Suggestions() {
  const [currentUser, setCurrentUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => base44.entities.Suggestion.list('-created_date'),
  });

  const { data: votes = [] } = useQuery({
    queryKey: ['my-votes', currentUser?.email],
    queryFn: () => base44.entities.SuggestionVote.filter({ user_email: currentUser.email }),
    enabled: !!currentUser?.email,
  });

  const votedIds = new Set(votes.map(v => v.suggestion_id));

  const handleVote = async (suggestion) => {
    if (!currentUser) return;
    const alreadyVoted = votedIds.has(suggestion.id);

    if (alreadyVoted) {
      const vote = votes.find(v => v.suggestion_id === suggestion.id);
      if (vote) {
        await base44.entities.SuggestionVote.delete(vote.id);
        await base44.entities.Suggestion.update(suggestion.id, {
          votes_count: Math.max(0, (suggestion.votes_count || 0) - 1)
        });
      }
    } else {
      await base44.entities.SuggestionVote.create({
        suggestion_id: suggestion.id,
        user_email: currentUser.email
      });
      await base44.entities.Suggestion.update(suggestion.id, {
        votes_count: (suggestion.votes_count || 0) + 1
      });
    }
    queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    queryClient.invalidateQueries({ queryKey: ['my-votes'] });
  };

  const filters = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'accepted', label: 'Aceptadas' },
    { key: 'implemented', label: 'Implementadas' },
  ];

  const filtered = filter === 'all'
    ? suggestions
    : suggestions.filter(s => s.status === filter);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sugerencias</h1>
          <p className="text-gray-600 text-sm">Comparte ideas para mejorar la comunidad</p>
        </div>
      </div>

      {currentUser ? (
        <div className="mb-8">
          <SuggestionForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ['suggestions'] })} />
        </div>
      ) : (
        <div className="mb-8 bg-white border border-sky-200 rounded-2xl p-5 text-center shadow-sm">
          <p className="text-gray-600">Inicia sesión para enviar sugerencias y votar</p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-6">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f.key
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-white border border-sky-200 text-sky-700 hover:bg-sky-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-sky-200 shadow-sm">
          <Lightbulb className="w-12 h-12 text-sky-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay sugerencias aún. ¡Sé el primero!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              hasVoted={votedIds.has(s.id)}
              onVote={handleVote}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}
