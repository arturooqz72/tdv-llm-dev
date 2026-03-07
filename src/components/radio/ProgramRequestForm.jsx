import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProgramRequestForm({ currentUser, currentProgram }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendComment = async () => {
    if (!comment.trim()) return;
    
    setSending(true);
    try {
      await base44.entities.RadioQA.create({
        program_id: currentProgram.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email.split('@')[0],
        question: comment.trim(),
        is_answered: false,
        is_highlighted: false
      });
      
      setComment('');
      alert('✓ Comentario enviado correctamente');
    } catch (error) {
      console.error('Error al enviar comentario:', error);
      alert('Error al enviar el comentario. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const handleSendRequest = async () => {
    if (!question.trim()) return;
    
    setSending(true);
    try {
      await base44.entities.RadioQA.create({
        program_id: 'general',
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email.split('@')[0],
        question: `[SOLICITUD] ${question.trim()}`,
        is_answered: false,
        is_highlighted: false
      });
      
      // Notificar a admins
      const admins = await base44.entities.User.filter({ role: 'admin' });
      for (const admin of admins) {
        await base44.entities.Notification.create({
          user_email: admin.email,
          type: 'program_request',
          message: `📻 Nueva solicitud de programa de ${currentUser.full_name || currentUser.email.split('@')[0]}`,
          from_user: currentUser.email,
          is_read: false
        });
      }
      
      setQuestion('');
      setOpen(false);
      alert('✓ Solicitud enviada al equipo de radio');
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      alert('Error al enviar la solicitud. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-yellow-600 text-yellow-500 hover:bg-yellow-600 hover:text-black"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Comentar / Solicitar
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 text-white border-yellow-600">
        <DialogHeader>
          <DialogTitle className="text-xl text-yellow-500">Interactúa con la Radio</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="comment" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="comment">Comentar Programa</TabsTrigger>
            <TabsTrigger value="request">Solicitar Programa</TabsTrigger>
          </TabsList>

          <TabsContent value="comment" className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-3">
                Deja tu comentario sobre "{currentProgram?.title || 'el programa actual'}"
              </p>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe tu comentario aquí..."
                rows={4}
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <Button
              onClick={handleSendComment}
              disabled={!comment.trim() || sending}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Comentario
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="request" className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-3">
                Solicita un programa o tema específico que te gustaría escuchar en la radio
              </p>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ejemplo: Me gustaría escuchar más programas sobre alabanza moderna"
                rows={4}
                className="bg-gray-800 text-white border-gray-700"
              />
            </div>
            <Button
              onClick={handleSendRequest}
              disabled={!question.trim() || sending}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Solicitud
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}