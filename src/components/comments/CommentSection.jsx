import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send } from 'lucide-react';
import CommentThread from './CommentThread';

export default function CommentSection({ 
  videoId, 
  videoOwnerId,
  currentUser,
  initialCommentsCount = 0
}) {
  const [comment, setComment] = useState('');

  const { data: comments = [], refetch } = useQuery({
    queryKey: ['comments', videoId],
    queryFn: async () => {
      // Only fetch top-level comments (no parent)
      const allComments = await base44.entities.Comment.filter({ video_id: videoId }, '-created_date');
      return allComments.filter(c => !c.parent_comment_id);
    },
    enabled: !!videoId
  });

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !currentUser) return;

    await base44.entities.Comment.create({
      video_id: videoId,
      user_email: currentUser.email,
      user_name: currentUser.full_name || currentUser.email.split('@')[0],
      content: comment
    });

    // Update video comments count
    await base44.entities.Video.update(videoId, {
      comments_count: (initialCommentsCount || 0) + 1
    });

    // Notify video owner
    if (videoOwnerId !== currentUser.email) {
      const prefs = await base44.entities.NotificationPreference.filter({
        user_email: videoOwnerId
      });
      
      const shouldNotify = prefs.length === 0 || prefs[0].new_comments !== false;
      
      if (shouldNotify) {
        await base44.entities.Notification.create({
          user_email: videoOwnerId,
          type: 'new_comment',
          message: `${currentUser.full_name || currentUser.email.split('@')[0]} comentó en tu video`,
          related_id: videoId,
          from_user: currentUser.email,
          from_user_name: currentUser.full_name || currentUser.email.split('@')[0]
        });
      }
    }

    setComment('');
    refetch();
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        Comentarios ({comments.length})
      </h2>

      {/* Comment Form */}
      {currentUser ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escribe tu comentario respetuoso..."
            className="mb-3 resize-none"
            rows={3}
          />
          <Button 
            type="submit" 
            className="bg-gradient-to-r from-purple-600 to-pink-600"
            disabled={!comment.trim()}
          >
            <Send className="w-4 h-4 mr-2" />
            Publicar
          </Button>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-purple-50 rounded-xl text-center">
          <p className="text-sm text-purple-900">
            Inicia sesión para comentar
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {comments.map((c) => (
          <CommentThread
            key={c.id}
            comment={c}
            currentUser={currentUser}
            videoId={videoId}
            videoOwnerId={videoOwnerId}
            onCommentAdded={refetch}
          />
        ))}
        
        {comments.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Sé el primero en comentar
          </p>
        )}
      </div>
    </div>
  );
}