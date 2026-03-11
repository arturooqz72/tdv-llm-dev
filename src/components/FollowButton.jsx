import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

export default function FollowButton({
  targetUserEmail,
  currentUser,
  isFollowing = false,
  loading = false,
  onToggleFollow,
}) {
  if (!currentUser || currentUser.email === targetUserEmail) {
    return null;
  }

  return (
    <Button
      onClick={onToggleFollow}
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
