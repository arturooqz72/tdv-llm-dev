import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function StreamReminderButton({ stream, currentUser }) {
  const queryClient = useQueryClient();

  const { data: reminder, isLoading } = useQuery({
    queryKey: ['stream-reminder', stream.id, currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      const reminders = await base44.entities.StreamReminder.filter({
        user_email: currentUser.email,
        stream_id: stream.id
      });
      return reminders[0] || null;
    },
    enabled: !!currentUser && !!stream.id
  });

  const setReminderMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.StreamReminder.create({
        user_email: currentUser.email,
        stream_id: stream.id,
        minutes_before: 15
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream-reminder'] });
    }
  });

  const removeReminderMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.StreamReminder.delete(reminder.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream-reminder'] });
    }
  });

  const handleToggleReminder = async () => {
    if (!currentUser) {
      base44.auth.redirectToLogin();
      return;
    }

    if (reminder) {
      removeReminderMutation.mutate();
    } else {
      setReminderMutation.mutate();
    }
  };

  if (!currentUser) return null;

  const isActive = !!reminder;
  const isPending = setReminderMutation.isPending || removeReminderMutation.isPending;

  return (
    <Button
      size="sm"
      variant={isActive ? "default" : "outline"}
      onClick={handleToggleReminder}
      disabled={isPending || isLoading}
      className={isActive ? "bg-yellow-500 hover:bg-yellow-600 text-black" : ""}
    >
      {isPending ? (
        <>
          <Bell className="w-4 h-4 mr-2 animate-pulse" />
          Procesando...
        </>
      ) : isActive ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Recordatorio Activado
        </>
      ) : (
        <>
          <Bell className="w-4 h-4 mr-2" />
          Recordar
        </>
      )}
    </Button>
  );
}