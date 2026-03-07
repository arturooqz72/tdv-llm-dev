import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

export default function FollowButton({ targetUserEmail, currentUser, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUser || currentUser.email === targetUserEmail) {
        setLoading(false);
        return;
      }

      try {
        const follows = await base44.entities.Follow.filter({
          follower_email: currentUser.email,
          following_email: targetUserEmail
        });
        setIsFollowing(follows.length > 0);
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkFollowStatus();
  }, [currentUser, targetUserEmail]);

  const handleFollowToggle = async () => {
    if (!currentUser || loading) return;

    setLoading(true);
    try {
      if (isFollowing) {
        const follows = await base44.entities.Follow.filter({
          follower_email: currentUser.email,
          following_email: targetUserEmail
        });
        if (follows.length > 0) {
          await base44.entities.Follow.delete(follows[0].id);
        }
        setIsFollowing(false);
      } else {
        await base44.entities.Follow.create({
          follower_email: currentUser.email,
          following_email: targetUserEmail
        });
        setIsFollowing(true);
      }
      if (onFollowChange) onFollowChange();
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.email === targetUserEmail) {
    return null;
  }

  return (
    <Button
      onClick={handleFollowToggle}
      disabled={loading}
      variant={isFollowing ? 'outline' : 'default'}
      className={!isFollowing ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4 mr-2" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      {isFollowing ? 'Dejar de seguir' : 'Seguir'}
    </Button>
  );
}