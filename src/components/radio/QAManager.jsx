import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Star, Send } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ReportButton from '@/components/ReportButton';

export default function QAManager({ programId, currentUser }) {
  const queryClient = useQueryClient();

  const { data: questions = [] } = useQuery({
    queryKey: ['qa', programId],
    queryFn: () => base44.entities.RadioQA.filter({ program_id: programId }, '-created_date'),
    enabled: !!programId,
    refetchInterval: 5000
  });

  const answerMutation = useMutation({
    mutationFn: async ({ questionId, answer }) => {
      return await base44.entities.RadioQA.update(questionId, {
        answer,
        is_answered: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa', programId] });
    }
  });

  const highlightMutation = useMutation({
    mutationFn: async ({ questionId, isHighlighted }) => {
      return await base44.entities.RadioQA.update(questionId, {
        is_highlighted: !isHighlighted
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa', programId] });
    }
  });

  const [answerText, setAnswerText] = useState({});

  const handleAnswer = (questionId) => {
    if (!answerText[questionId]?.trim()) return;
    
    answerMutation.mutate({
      questionId,
      answer: answerText[questionId].trim()
    });

    setAnswerText({ ...answerText, [questionId]: '' });
  };

  const unanswered = questions.filter(q => !q.is_answered);
  const answered = questions.filter(q => q.is_answered);

  return (
    <div className="space-y-6">
      {/* Unanswered Questions */}
      {unanswered.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Preguntas Pendientes ({unanswered.length})</h3>
          <div className="space-y-4">
            {unanswered.map(question => (
              <Card key={question.id} className="bg-gray-800 border-yellow-600">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-sm font-medium">
                          {question.user_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{question.user_name}</p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(question.created_date), "d 'de' MMMM, HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <p className="text-white">{question.question}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ReportButton
                        contentType="radio_qa"
                        contentId={question.id}
                        reportedUserEmail={question.user_email}
                        contentPreview={`Pregunta radio: ${question.question}`}
                        variant="ghost"
                        size="sm"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => highlightMutation.mutate({ 
                          questionId: question.id, 
                          isHighlighted: question.is_highlighted 
                        })}
                      >
                        <Star className={`w-4 h-4 ${question.is_highlighted ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Escribe tu respuesta..."
                      value={answerText[question.id] || ''}
                      onChange={(e) => setAnswerText({ ...answerText, [question.id]: e.target.value })}
                      className="bg-gray-900 text-white border-gray-700"
                      rows={3}
                    />
                    <Button
                      onClick={() => handleAnswer(question.id)}
                      disabled={!answerText[question.id]?.trim()}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Responder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Answered Questions */}
      {answered.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Preguntas Respondidas ({answered.length})</h3>
          <div className="space-y-4">
            {answered.map(question => (
              <Card key={question.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-medium">
                          {question.user_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{question.user_name}</p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(question.created_date), "d 'de' MMMM, HH:mm", { locale: es })}
                          </p>
                        </div>
                        {question.is_highlighted && (
                          <Badge className="bg-yellow-600 text-white">Destacada</Badge>
                        )}
                      </div>
                      <p className="text-white mb-3">{question.question}</p>
                      <div className="bg-gray-900 rounded-lg p-3 border-l-4 border-yellow-600">
                        <p className="text-sm text-gray-400 mb-1">Tu respuesta:</p>
                        <p className="text-white">{question.answer}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {questions.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay preguntas aún
            </h3>
            <p className="text-gray-400">
              Los oyentes podrán hacer preguntas durante tus transmisiones
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}