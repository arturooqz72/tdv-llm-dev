import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MessageSquare } from 'lucide-react';

const categoryConfig = {
  feature: { label: 'Nueva función', color: 'bg-blue-500/20 text-blue-400' },
  improvement: { label: 'Mejora', color: 'bg-cyan-500/20 text-cyan-400' },
  bug: { label: 'Problema', color: 'bg-red-500/20 text-red-400' },
  content: { label: 'Contenido', color: 'bg-purple-500/20 text-purple-400' },
  other: { label: 'Otro', color: 'bg-gray-500/20 text-gray-400' },
};

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400' },
  reviewed: { label: 'En revisión', color: 'bg-blue-500/20 text-blue-400' },
  accepted: { label: 'Aceptada', color: 'bg-green-500/20 text-green-400' },
  implemented: { label: 'Implementada', color: 'bg-emerald-500/20 text-emerald-400' },
  rejected: { label: 'Rechazada', color: 'bg-red-500/20 text-red-400' },
};

export default function SuggestionCard({ suggestion, hasVoted, onVote, currentUser }) {
  const cat = categoryConfig[suggestion.category] || categoryConfig.other;
  const status = statusConfig[suggestion.status] || statusConfig.pending;

  return (
    <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all">
      <div className="flex gap-3">
        {/* Vote button */}
        <button
          onClick={() => onVote(suggestion)}
          disabled={!currentUser}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl flex-shrink-0 transition-all ${
            hasVoted
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
          <span className="text-xs font-bold mt-0.5">{suggestion.votes_count || 0}</span>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge className={`${cat.color} text-xs`}>{cat.label}</Badge>
            <Badge className={`${status.color} text-xs`}>{status.label}</Badge>
          </div>
          <h3 className="text-white font-semibold truncate">{suggestion.title}</h3>
          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{suggestion.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-gray-600 text-xs">
              {suggestion.created_by?.split('@')[0]} • {new Date(suggestion.created_date).toLocaleDateString()}
            </span>
          </div>
          {suggestion.admin_response && (
            <div className="mt-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
              <p className="text-xs text-cyan-400 font-semibold mb-1">
                <MessageSquare className="w-3 h-3 inline mr-1" />
                Respuesta del admin
              </p>
              <p className="text-sm text-gray-300">{suggestion.admin_response}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}