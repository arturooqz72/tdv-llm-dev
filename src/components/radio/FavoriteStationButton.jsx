import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FavoriteStationButton({ stationId, currentUser, className }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      if (!currentUser || !stationId) return;
      
      const favorites = await base44.entities.FavoriteStation.filter({
        user_email: currentUser.email,
        station_id: stationId
      });
      
      setIsFavorite(favorites.length > 0);
    };
    
    checkFavorite();
  }, [stationId, currentUser]);

  const toggleFavorite = async () => {
    if (!currentUser) {
      base44.auth.redirectToLogin();
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        const favorites = await base44.entities.FavoriteStation.filter({
          user_email: currentUser.email,
          station_id: stationId
        });
        
        if (favorites.length > 0) {
          await base44.entities.FavoriteStation.delete(favorites[0].id);
        }
        setIsFavorite(false);
      } else {
        await base44.entities.FavoriteStation.create({
          user_email: currentUser.email,
          station_id: stationId
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !stationId) return null;

  return (
    <Button
      onClick={toggleFavorite}
      disabled={loading}
      size="sm"
      variant={isFavorite ? 'default' : 'outline'}
      className={cn(
        'gap-2',
        isFavorite 
          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black' 
          : 'border-yellow-600 text-yellow-500 hover:bg-yellow-600 hover:text-black',
        className
      )}
    >
      <Star className={cn('w-4 h-4', isFavorite && 'fill-current')} />
      {isFavorite ? 'Favorita' : 'Agregar a Favoritas'}
    </Button>
  );
}