import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Heart } from 'lucide-react';
import ReportButton from '@/components/ReportButton';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CommentThread({
  comment,
  currentUser,
  videoId,
  videoOwnerId,
  onCommentAdded,
  level = 0
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [liked, setLiked] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const createdDate = comment.created_at || comment.created_date;

  const loadReplies = async () => {
    if (!showReplies) {
      setLoadingReplies(true);
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReplies(data || []);
      } catch (error) {
        console.error('Error cargando respuestas:', error);
      } finally {
        setLoadingReplies(false);
      }
    }

    setShowReplies(!showReplies);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser || submittingReply) return;

    setSubmittingReply(true);

    try {
      const payload = {
        video_id: videoId,
        user_email: currentUser.email,
        user_name: currentUser.name || currentUser.email.split('@')[0],
        content: replyText.trim(),
        parent_comment_id: comment.id,
        likes_count: 0,
        replies_count: 0,
      };

      const { data: newReply, error: createError } = await supabase
        .from('comments')
        .insert([payload])
        .select()
        .single();

      if (createError) throw createError;

      const { error: updateError } = await supabase
        .from('comments')
        .update({
          replies_count: (comment.replies_count || 0) + 1,
        })
        .eq('id', comment.id);

      if (updateError) throw updateError;

      setReplyText('');
      setShowReplyForm(false);
      setReplies([newReply, ...replies]);
      setShowReplies(true);

      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error al responder comentario:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleLikeComment = async () => {
    if (!currentUser || liked) return;

    try {
      const nextLikes = (comment.likes_count || 0) + 1;

      const { error } = await supabase
        .from('comments')
        .update({ likes_count: nextLikes })
        .eq('id', comment.id);

      if (error) throw error;

      setLiked(true);
      comment.likes_count = nextLikes;
    } catch (error) {
      console.error('Error al dar like al comentario:', error);
    }
  };

  return (
    <div className={`${level > 0 ? 'ml-8 mt-3' : ''}`}>
      <div className="group pb-4 border-b border-gray-100 last:border-0">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {comment.user_name?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-gray-900">
                    {comment.user_name}
                  </p>

                  <span className="text-xs text-gray-500">
                    {createdDate
                      ? formatDistanceToNow(new Date(createdDate), {
                          addSuffix: true,
                          locale: es,
                        })
                      : ''}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mt-1 break-words">
                  {comment.content}
                </p>

                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={handleLikeComment}
                    className={`flex items-center gap-1 text-xs ${
                      liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    } transition-colors`}
                  >
                    <Heart className={`w-3 h-3 ${liked ? 'fill-current' : ''}`} />
                    {(comment.likes_count || 0) > 0 && (
                      <span>{comment.likes_count}</span>
                    )}
                  </button>

                  {currentUser && level < 2 && (
                    <button
                      onClick={() => setShowReplyForm(!showReplyForm)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Responder
                    </button>
                  )}

                  {(comment.replies_count || 0) > 0 && (
                    <button
                      onClick={loadReplies}
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      {loadingReplies
                        ? 'Cargando...'
                        : `${showReplies ? 'Ocultar' : 'Ver'} ${comment.replies_count} ${
                            comment.replies_count === 1 ? 'respuesta' : 'respuestas'
                          }`}
                    </button>
                  )}
                </div>
              </div>

              {currentUser && currentUser.email !== comment.user_email && (
                <ReportButton
                  contentType="comment"
                  contentId={comment.id}
                  reportedUserEmail={comment.user_email}
                  contentPreview={`Comentario: ${comment.content}`}
                  variant="ghost"
                  size="sm"
                />
              )}
            </div>
          </div>
        </div>

        {showReplyForm && currentUser && (
          <div className="mt-3 ml-11">
            <form onSubmit={handleSubmitReply} className="space-y-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Responder a ${comment.user_name}...`}
                className="resize-none text-sm"
                rows={2}
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                  disabled={!replyText.trim() || submittingReply}
                >
                  <Send className="w-3 h-3 mr-1" />
                  {submittingReply ? 'Enviando...' : 'Responder'}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowReplyForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {showReplies && replies.length > 0 && (
          <div className="mt-3">
            {replies.map((reply) => (
              <CommentThread
                key={reply.id}
                comment={reply}
                currentUser={currentUser}
                videoId={videoId}
                videoOwnerId={videoOwnerId}
                onCommentAdded={onCommentAdded}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
