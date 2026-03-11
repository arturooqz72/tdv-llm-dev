import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send } from 'lucide-react';
import CommentThread from './CommentThread';

export default function CommentSection({
  videoId,
  videoOwnerId,
  currentUser,
  initialCommentsCount = 0,
}) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: comments = [], refetch } = useQuery({
    queryKey: ['comments', videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('video_id', videoId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!videoId,
  });

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !currentUser || submitting) return;

    setSubmitting(true);

    try {
      const payload = {
        video_id: videoId,
        user_email: currentUser.email,
        user_name: currentUser.name || currentUser.email.split('@')[0],
        content: comment.trim(),
        likes_count: 0,
        replies_count: 0,
      };

      const { error: insertError } = await supabase
        .from('comments')
        .insert([payload]);

      if (insertError) throw insertError;

      // Actualiza comments_count en videos solo si esa columna existe
      const { data: videoData, error: videoFetchError } = await supabase
        .from('videos')
        .select('id, comments_count')
        .eq('id', videoId)
        .maybeSingle();

      if (!videoFetchError && videoData?.id) {
        await supabase
          .from('videos')
          .update({
            comments_count: Number(videoData.comments_count || 0) + 1,
          })
          .eq('id', videoId);
      }

      setComment('');
      await refetch();
    } catch (error) {
      console.error('Error publicando comentario:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        Comentarios ({comments.length})
      </h2>

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
            disabled={!comment.trim() || submitting}
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? 'Publicando...' : 'Publicar'}
          </Button>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-purple-50 rounded-xl text-center">
          <p className="text-sm text-purple-900">
            Inicia sesión para comentar
          </p>
        </div>
      )}

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
