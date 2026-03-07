import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { History, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PlaybackHistory({ currentUser, onPlayProgram }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['playback-history', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      
      const stats = await base44.entities.RadioListenerStats.filter(
        { user_email: currentUser.email },
        '-created_date',
        10
      );
      
      // Get unique programs
      const programIds = [...new Set(stats.map(s => s.program_id))];
      const programs = await Promise.all(
        programIds.map(id => 
          base44.entities.RadioProgram.filter({ id }).then(p => p[0])
        )
      );
      
      // Combine with stats
      return stats.map(stat => {
        const program = programs.find(p => p?.id === stat.program_id);
        return {
          ...stat,
          program
        };
      }).filter(item => item.program);
    },
    enabled: !!currentUser?.email,
    staleTime: 60000
  });

  if (!currentUser || isLoading || history.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-yellow-500" />
        <h3 className="text-sm font-semibold text-white">Escuchado Recientemente</h3>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {history.slice(0, 5).map((item) => (
          <div 
            key={item.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors group"
          >
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onPlayProgram?.(item.program)}
              className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Play className="w-3 h-3 text-yellow-500" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {item.program?.title}
              </p>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(item.created_date), { 
                  addSuffix: true,
                  locale: es 
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}