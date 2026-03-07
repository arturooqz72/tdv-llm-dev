import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FavoriteProgramButton({ programId, currentUser, className, size = "sm" }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      if (!currentUser || !programId) return;
      
      const favorites = await base44.entities.RadioProgramLike.filter({
        user_email: currentUser.email,
        program_id: programId
      });
      
      setIsFavorite(favorites.length > 0);
    };
    
    checkFavorite();
  }, [programId, currentUser]);

  const toggleFavorite = async (e) => {
    e?.stopPropagation();
    if (!currentUser) {
      base44.auth.redirectToLogin();
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        const favorites = await base44.entities.RadioProgramLike.filter({
          user_email: currentUser.email,
          program_id: programId
        });
        
        if (favorites.length > 0) {
          await base44.entities.RadioProgramLike.delete(favorites[0].id);
        }
        setIsFavorite(false);
      } else {
        await base44.entities.RadioProgramLike.create({
          user_email: currentUser.email,
          program_id: programId
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !programId) return null;

  return (
    <Button
      onClick={toggleFavorite}
      disabled={loading}
      size={size}
      variant={isFavorite ? 'default' : 'ghost'}
      className={cn(
        'gap-2',
        isFavorite 
          ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600' 
          : 'text-gray-400 hover:text-pink-500 hover:bg-pink-500/10',
        className
      )}
      title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
      {size !== 'icon' && (isFavorite ? 'Favorito' : 'Me gusta')}
    </Button>
  );
}