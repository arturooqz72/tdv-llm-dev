import React from 'react';
import { cn } from '@/lib/utils';

export default function OnlineIndicator({ lastSeen, className = '' }) {
  const isOnline = () => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now - lastSeenDate) / 1000 / 60;
    return diffMinutes < 5; // Online if active in last 5 minutes
  };

  const online = isOnline();

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'w-3 h-3 rounded-full border-2 border-white',
          online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        )}
      />
    </div>
  );
}