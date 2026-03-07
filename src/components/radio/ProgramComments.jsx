import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReportButton from '@/components/ReportButton';

export default function ProgramComments({ program, currentUser }) {
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['program-comments', program.id],
    queryFn: () => base44.entities.RadioProgramComment.filter({ program_id: program.id }, '-created_date'),
    enabled: !!program.id
  });

  useEffect(() => {
    const checkLike = async () => {
      if (!currentUser) return;
      const likes = await base44.entities.RadioProgramLike.filter({
        program_id: program.id,
        user_email: currentUser.email
      });
      setLiked(likes.length > 0);
    };
    checkLike();
  }, [program.id, currentUser]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !currentUser) return;

    const newComment = await base44.entities.RadioProgramComment.create({
      program_id: program.id,
      user_email: currentUser.email,
      user_name: currentUser.full_name || currentUser.email.split('@')[0],
      content: comment,
      reply_to: replyTo
    });

    // Notify original commenter if this is a reply
    if (replyTo) {
      const originalComments = await base44.entities.RadioProgramComment.filter({ id: replyTo });
      const originalComment = originalComments[0];
      
      if (originalComment && originalComment.user_email !== currentUser.email) {
        await base44.entities.Notification.create({
          user_email: originalComment.user_email,
          type: 'comment_reply',
          message: `${currentUser.full_name || currentUser.email.split('@')[0]} respondió a tu comentario`,
          related_id: program.id,
          from_user: currentUser.email,
          from_user_name: currentUser.full_name || currentUser.email.split('@')[0],
          action_url: `RadioProgramDetail?id=${program.id}`
        });
      }
    }

    setComment('');
    setReplyTo(null);
    refetchComments();
  };

  const handleLike = async () => {
    if (!currentUser) {
      base44.auth.redirectToLogin();
      return;
    }

    if (liked) {
      const likes = await base44.entities.RadioProgramLike.filter({
        program_id: program.id,
        user_email: currentUser.email
      });
      if (likes.length > 0) {
        await base44.entities.RadioProgramLike.delete(likes[0].id);
      }
      setLiked(false);
    } else {
      await base44.entities.RadioProgramLike.create({
        program_id: program.id,
        user_email: currentUser.email
      });
      setLiked(true);
    }
  };

  // Contar likes
  const { data: likesCount = 0 } = useQuery({
    queryKey: ['program-likes-count', program.id],
    queryFn: async () => {
      const likes = await base44.entities.RadioProgramLike.filter({ program_id: program.id });
      return likes.length;
    },
    refetchInterval: 5000
  });

  return (
    <div className="bg-gray-800 rounded-xl border border-yellow-600 p-6">
      {/* Like Button */}
      <div className="mb-6">
        <Button
          onClick={handleLike}
          size="lg"
          className={cn(
            "w-full gap-2 rounded-full",
            liked 
              ? "bg-gradient-to-r from-red-500 to-pink-500 text-white" 
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          )}
        >
          <Heart className={cn("w-5 h-5", liked && "fill-current")} />
          {liked ? 'Te gusta' : 'Me gusta'} ({likesCount})
        </Button>
      </div>

      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-yellow-500" />
        Comentarios ({comments.length})
      </h2>

      {/* Comment Form */}
      {currentUser ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          {replyTo && (
            <div className="mb-2 p-2 bg-gray-700 rounded-lg flex items-center justify-between">
              <span className="text-sm text-gray-300">Respondiendo...</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setReplyTo(null)}
                className="text-gray-400"
              >
                Cancelar
              </Button>
            </div>
          )}
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={replyTo ? "Escribe tu respuesta..." : "Comparte tu opinión sobre este programa..."}
            className="mb-3 resize-none bg-gray-900 text-white border-gray-700"
            rows={3}
          />
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-600 hover:to-yellow-700"
            disabled={!comment.trim()}
          >
            <Send className="w-4 h-4 mr-2" />
            {replyTo ? 'Responder' : 'Publicar Comentario'}
          </Button>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-700 rounded-xl text-center">
          <p className="text-sm text-gray-300 mb-3">
            Inicia sesión para comentar y dar like
          </p>
          <Button 
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"
          >
            Iniciar Sesión
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {comments.map((c) => (
          <div key={c.id} className="pb-4 border-b border-gray-700 last:border-0">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-black text-xs font-semibold flex-shrink-0">
                {c.user_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-yellow-500">
                    {c.user_name}
                  </p>
                  {currentUser && currentUser.email !== c.user_email && (
                    <ReportButton
                      contentType="comment"
                      contentId={c.id}
                      reportedUserEmail={c.user_email}
                      contentPreview={`Comentario en programa: ${c.content}`}
                      variant="ghost"
                      size="sm"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-300 mt-1 break-words">
                  {c.content}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-xs text-gray-500">
                    {new Date(c.created_date).toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {currentUser && currentUser.email !== c.user_email && (
                    <button
                      onClick={() => setReplyTo(c.id)}
                      className="text-xs text-yellow-500 hover:text-yellow-400"
                    >
                      Responder
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {comments.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Sé el primero en comentar sobre este programa
          </p>
        )}
      </div>
    </div>
  );
}