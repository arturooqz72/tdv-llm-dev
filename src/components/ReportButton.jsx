import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flag, Loader2 } from 'lucide-react';

export default function ReportButton({ 
  contentType, 
  contentId, 
  reportedUserEmail,
  contentPreview,
  variant = "ghost",
  size = "sm"
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    { value: 'spam', label: 'Spam o contenido no deseado' },
    { value: 'harassment', label: 'Acoso o bullying' },
    { value: 'hate_speech', label: 'Discurso de odio' },
    { value: 'inappropriate', label: 'Contenido inapropiado' },
    { value: 'misinformation', label: 'Desinformación' },
    { value: 'violence', label: 'Violencia o amenazas' },
    { value: 'other', label: 'Otro' }
  ];

  const handleSubmit = async () => {
    if (!reason) {
      alert('Por favor selecciona una razón');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUser = await base44.auth.me();
      
      // Create report
      const report = await base44.entities.Report.create({
        content_type: contentType,
        content_id: contentId,
        reason,
        description,
        reporter_email: currentUser.email,
        reported_user_email: reportedUserEmail
      });

      // Analyze with AI
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un sistema de moderación de contenido para una plataforma religiosa/espiritual.

Analiza el siguiente reporte:
- Tipo de contenido: ${contentType}
- Razón del reporte: ${reason}
- Descripción del reporte: ${description}
- Vista previa del contenido: ${contentPreview}

Evalúa:
1. Severidad (low, medium, high, critical)
2. ¿Es válido el reporte?
3. ¿Requiere acción inmediata?
4. ¿Qué acción recomiendas? (none, warn_user, hide_content, delete_content, ban_user)
5. Explicación breve

Responde en español.`,
        response_json_schema: {
          type: 'object',
          properties: {
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            is_valid: { type: 'boolean' },
            requires_immediate_action: { type: 'boolean' },
            recommended_action: { type: 'string' },
            explanation: { type: 'string' },
            confidence: { type: 'number' }
          }
        }
      });

      // Update report with AI analysis
      await base44.entities.Report.update(report.id, {
        ai_analysis: analysis,
        ai_severity: analysis.severity,
        status: analysis.requires_immediate_action ? 'reviewing' : 'pending'
      });

      // If critical, take immediate action
      if (analysis.severity === 'critical' && analysis.recommended_action === 'hide_content') {
        if (contentType === 'video') {
          // We would mark the video as hidden in a real implementation
          console.log('Auto-hiding critical content');
        }
      }

      alert('Reporte enviado. Nuestro equipo lo revisará pronto.');
      setOpen(false);
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Error al enviar reporte:', error);
      alert('Error al enviar el reporte. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Flag className="w-4 h-4 mr-2" />
          Reportar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reportar Contenido</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Razón del reporte</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecciona una razón" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descripción adicional (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el problema con más detalle..."
              className="mt-2"
              rows={4}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !reason}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Reporte'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}