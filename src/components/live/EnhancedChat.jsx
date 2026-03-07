import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Pin, Smile, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const EMOJIS = ['👍', '❤️', '😂', '🙏', '✨', '🔥', '👏', '🎉'];

export default function EnhancedChat({ streamId, currentUser, isCreator }) {
  const [comment, setComment] = useState('');
  const chatEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['stream-chat', streamId],
    queryFn: () => base44.entities.LiveStreamChat.filter({ stream_id: streamId }, 'created_date', 100),
    enabled: !!streamId,
    refetchInterval: 2000
  });

  useEffect(() => {
    if (!streamId) return;

    const unsubscribe = base44.entities.LiveStreamChat.subscribe((event) => {
      if (event.type === 'create' && event.data.stream_id === streamId) {
        queryClient.invalidateQueries({ queryKey: ['stream-chat', streamId] });
      }
    });

    return unsubscribe;
  }, [streamId, queryClient]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message) => {
      return await base44.entities.LiveStreamChat.create({
        stream_id: streamId,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email.split('@')[0],
        message: message.trim(),
        is_highlighted: false,
        reactions: {}
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream-chat', streamId] });
    }
  });

  const highlightMessageMutation = useMutation({
    mutationFn: async ({ messageId, isHighlighted }) => {
      return await base44.entities.LiveStreamChat.update(messageId, {
        is_highlighted: !isHighlighted
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream-chat', streamId] });
    }
  });

  const reactToMessageMutation = useMutation({
    mutationFn: async ({ messageId, emoji }) => {
      // Create reaction
      await base44.entities.ChatReaction.create({
        message_id: messageId,
        user_email: currentUser.email,
        emoji
      });

      // Get all reactions for this message
      const reactions = await base44.entities.ChatReaction.filter({ message_id: messageId });
      const reactionCounts = reactions.reduce((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
      }, {});

      // Update message with reaction counts
      return await base44.entities.LiveStreamChat.update(messageId, {
        reactions: reactionCounts
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream-chat', streamId] });
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId) => {
      return await base44.entities.LiveStreamChat.delete(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream-chat', streamId] });
    }
  });

  const handleDeleteMessage = (msg) => {
    if (!currentUser || msg.user_email !== currentUser.email) return;
    if (!confirm('¿Eliminar este mensaje?')) return;
    deleteMessageMutation.mutate(msg.id);
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !currentUser || !streamId) return;

    sendMessageMutation.mutate(comment.trim());
    setComment('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden h-[600px] flex flex-col">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="flex items-center gap-2 text-white">
          <Smile className="w-5 h-5" />
          <h3 className="font-semibold">Chat en vivo</h3>
          <span className="ml-auto text-sm">({chatMessages.length})</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-10">Sé el primero en comentar</p>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`group relative ${
                msg.is_highlighted
                  ? 'bg-yellow-50 -mx-2 px-2 py-1 rounded-lg border-l-4 border-yellow-500'
                  : ''
              }`}
            >
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  {msg.user_name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-gray-900 truncate">{msg.user_name}</p>
                    {msg.is_highlighted && <Pin className="w-3 h-3 text-yellow-600 flex-shrink-0" />}

                    {currentUser && msg.user_email === currentUser.email && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg)}
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400"
                        title="Eliminar mensaje"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 break-words">{msg.message}</p>

                  {/* Reactions */}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {msg.reactions &&
                      Object.entries(msg.reactions).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => reactToMessageMutation.mutate({ messageId: msg.id, emoji })}
                          className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-all"
                        >
                          <span>{emoji}</span>
                          <span className="text-gray-600">{count}</span>
                        </button>
                      ))}

                    {/* Add reaction button */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-all">
                          <Smile className="w-3 h-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" side="top">
                        <div className="flex gap-1">
                          {EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => reactToMessageMutation.mutate({ messageId: msg.id, emoji })}
                              className="hover:bg-gray-100 p-2 rounded transition-all text-lg"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Highlight button for creator */}
                {isCreator && (
                  <button
                    onClick={() =>
                      highlightMessageMutation.mutate({
                        messageId: msg.id,
                        isHighlighted: msg.is_highlighted
                      })
                    }
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pin className={`w-4 h-4 ${msg.is_highlighted ? 'text-yellow-600' : 'text-gray-400'}`} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-gray-100">
        <form onSubmit={handleSendComment} className="flex gap-2">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escribe un comentario..."
            disabled={!currentUser}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!comment.trim() || !currentUser}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}