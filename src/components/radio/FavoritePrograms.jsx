import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Heart, Play } from 'lucide-react';

export default function FavoritePrograms({ currentUser, onPlayProgram }) {
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorite-programs', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      
      const likes = await base44.entities.RadioProgramLike.filter(
        { user_email: currentUser.email },
        '-created_date',
        20
      );
      
      const programs = await Promise.all(
        likes.map(like => 
          base44.entities.RadioProgram.filter({ id: like.program_id }).then(p => p[0])
        )
      );
      
      return programs.filter(Boolean);
    },
    enabled: !!currentUser?.email,
    staleTime: 60000
  });

  if (!currentUser || isLoading || favorites.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="w-4 h-4 text-pink-500 fill-current" />
        <h3 className="text-sm font-semibold text-white">Programas Favoritos</h3>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {favorites.slice(0, 5).map((program) => (
          <div 
            key={program.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors group"
          >
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onPlayProgram?.(program)}
              className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Play className="w-3 h-3 text-pink-500" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {program.title}
              </p>
              {program.description && (
                <p className="text-xs text-gray-400 truncate">
                  {program.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}