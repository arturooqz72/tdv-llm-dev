import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Play, Clock, Music } from 'lucide-react';

export default function PlaylistGenerator({ currentUser, onPlayProgram }) {
  const [isOpen, setIsOpen] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Get user's listening history
      const stats = await base44.entities.RadioListenerStats.filter(
        { user_email: currentUser.email },
        '-created_date',
        50
      );

      // Get all programs
      const allPrograms = await base44.entities.RadioProgram.filter(
        { is_active: true },
        '-plays_count',
        100
      );

      // Use AI to generate personalized playlist
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un experto en crear playlists personalizadas de radio. 

Historial del usuario (programas escuchados y si les gustó):
${JSON.stringify(stats.map(s => ({ 
  program_id: s.program_id, 
  liked: s.liked, 
  completed: s.completed 
})), null, 2)}

Programas disponibles:
${JSON.stringify(allPrograms.map(p => ({
  id: p.id,
  title: p.title,
  description: p.description,
  plays_count: p.plays_count
})), null, 2)}

Crea una playlist de 5-8 programas que le gustarían al usuario basándote en:
1. Programas similares a los que le gustaron
2. Programas populares que no ha escuchado
3. Variedad para mantener el interés

Devuelve SOLO los IDs de los programas en orden de reproducción.`,
        response_json_schema: {
          type: "object",
          properties: {
            program_ids: {
              type: "array",
              items: { type: "string" }
            },
            reasoning: {
              type: "string"
            }
          }
        }
      });

      // Get full program details
      const playlistPrograms = response.program_ids
        .map(id => allPrograms.find(p => p.id === id))
        .filter(Boolean);

      return {
        programs: playlistPrograms,
        reasoning: response.reasoning
      };
    }
  });

  const handleGenerate = async () => {
    const result = await generateMutation.mutateAsync();
    setGeneratedPlaylist(result);
    setIsOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleGenerate}
        disabled={!currentUser || generateMutation.isPending}
        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generar Playlist IA
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-gray-900 text-white border-purple-500 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              Tu Playlist Personalizada
            </DialogTitle>
          </DialogHeader>

          {generatedPlaylist && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
                <p className="text-sm text-gray-400 italic">
                  "{generatedPlaylist.reasoning}"
                </p>
              </div>

              <div className="space-y-3">
                {generatedPlaylist.programs.map((program, idx) => (
                  <Card key={program.id} className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Badge className="bg-purple-500 text-white">
                            #{idx + 1}
                          </Badge>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{program.title}</h4>
                            {program.description && (
                              <p className="text-sm text-gray-400 line-clamp-1">
                                {program.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {program.duration_minutes || 60} min
                              </span>
                              <span className="flex items-center gap-1">
                                <Music className="w-3 h-3" />
                                {program.plays_count || 0} reproducciones
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            onPlayProgram?.(program);
                            setIsOpen(false);
                          }}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                onClick={() => {
                  if (generatedPlaylist.programs[0]) {
                    onPlayProgram?.(generatedPlaylist.programs[0]);
                    setIsOpen(false);
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <Play className="w-4 h-4 mr-2" />
                Reproducir Toda la Playlist
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}