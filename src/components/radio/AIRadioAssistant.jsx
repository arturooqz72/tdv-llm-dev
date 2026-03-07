import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Sparkles, X, Music, Calendar, Info, Loader2 } from 'lucide-react';

export default function AIRadioAssistant({ currentUser, onProgramRequest }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: '¡Hola! Soy tu asistente de radio virtual. Puedo ayudarte a:\n\n• Solicitar programas o canciones\n• Recomendarte contenido basado en tus gustos\n• Responder preguntas sobre la programación\n• Crear playlists personalizadas\n\n¿En qué puedo ayudarte?'
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Get context for the AI
      const [programs, stations, events, userStats] = await Promise.all([
        base44.entities.RadioProgram.filter({ is_active: true }, '-created_date', 20),
        base44.entities.RadioStation.list(),
        base44.entities.RadioEvent.filter({ status: 'scheduled' }, 'event_date', 10),
        currentUser ? base44.entities.RadioListenerStats.filter({ user_email: currentUser.email }, '-created_date', 20) : []
      ]);

      // Build context for AI
      const context = {
        available_programs: programs.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          schedule_time: p.schedule_time,
          days: p.days,
          station_id: p.station_id
        })),
        stations: stations.map(s => ({
          id: s.id,
          name: s.name,
          genre: s.genre
        })),
        upcoming_events: events.map(e => ({
          title: e.title,
          event_date: e.event_date,
          type: e.type
        })),
        user_listening_history: userStats.map(s => ({
          program_id: s.program_id,
          liked: s.liked
        }))
      };

      // Determine intent and respond
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un asistente de radio virtual amigable y servicial. El usuario dice: "${userMessage}"

Contexto de la radio:
${JSON.stringify(context, null, 2)}

Analiza la solicitud del usuario y responde de manera natural y útil. Si el usuario:
- Solicita un programa o canción: Explica cómo pueden solicitar contenido y sugiere programas similares disponibles
- Pregunta sobre horarios: Proporciona información específica sobre la programación
- Pide recomendaciones: Sugiere programas basados en su historial
- Pregunta general: Responde con información sobre la comunidad y radio

Responde en español, de manera amigable y concisa (máximo 200 palabras).`,
        add_context_from_internet: false
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response
      }]);

      // Check if user is requesting a program
      if (userMessage.toLowerCase().includes('solicitar') || 
          userMessage.toLowerCase().includes('quiero') ||
          userMessage.toLowerCase().includes('pedir')) {
        setMessages(prev => [...prev, {
          role: 'system',
          content: 'quick_actions',
          actions: [{
            type: 'request_program',
            label: 'Enviar Solicitud Formal',
            data: userMessage
          }]
        }]);
      }

    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Lo siento, tuve un problema al procesar tu solicitud. ¿Podrías intentarlo de nuevo?'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all animate-pulse"
      >
        <Bot className="w-7 h-7 text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-gray-900 border-2 border-purple-500 rounded-2xl shadow-2xl flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-white" />
          <div>
            <h3 className="text-white font-bold">Asistente IA</h3>
            <p className="text-xs text-purple-100">Siempre listo para ayudar</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx}>
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-purple-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%]">
                  {msg.content}
                </div>
              </div>
            ) : msg.role === 'system' && msg.content === 'quick_actions' ? (
              <div className="flex flex-wrap gap-2">
                {msg.actions?.map((action, i) => (
                  <Button
                    key={i}
                    onClick={() => {
                      if (action.type === 'request_program') {
                        onProgramRequest?.(action.data);
                        setIsOpen(false);
                      }
                    }}
                    size="sm"
                    className="bg-yellow-500 text-black hover:bg-yellow-600"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {action.label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-white px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%] whitespace-pre-line">
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-white px-4 py-2 rounded-2xl rounded-tl-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Pensando...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-gray-800">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Badge 
            className="cursor-pointer bg-purple-600 hover:bg-purple-700 whitespace-nowrap"
            onClick={() => setInput('¿Qué programas tienen hoy?')}
          >
            <Calendar className="w-3 h-3 mr-1" />
            Programación
          </Badge>
          <Badge 
            className="cursor-pointer bg-pink-600 hover:bg-pink-700 whitespace-nowrap"
            onClick={() => setInput('Recomiéndame algo para escuchar')}
          >
            <Music className="w-3 h-3 mr-1" />
            Recomendaciones
          </Badge>
          <Badge 
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
            onClick={() => setInput('Quiero solicitar un programa')}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Solicitar
          </Badge>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe tu mensaje..."
            className="bg-gray-800 border-gray-700 text-white"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}