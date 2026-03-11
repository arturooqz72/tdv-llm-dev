import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, ArrowLeft, AlertTriangle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function GoLive() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#11162a] to-[#0b1020] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Card className="border border-cyan-500/20 bg-white/5 backdrop-blur-sm shadow-2xl rounded-3xl">
          <CardContent className="p-8 md:p-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-400/30">
                <Video className="h-7 w-7 text-cyan-300" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-white">Transmitir en Vivo</h1>
                <p className="text-sm text-cyan-100/80">
                  Módulo temporalmente desactivado mientras terminamos la limpieza de Base44.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-300" />
                <div>
                  <p className="font-semibold text-amber-200">
                    Esta página fue puesta en modo seguro
                  </p>
                  <p className="text-sm text-amber-100/80 mt-1">
                    Se quitó la lógica anterior para evitar que la aplicación se quede en blanco.
                    Después la conectamos correctamente al sistema nuevo.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-200">
              <p>
                Aquí después podemos volver a conectar:
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">Crear transmisión</p>
                  <p className="text-slate-300 mt-1">
                    Formulario para título, descripción y URL del stream.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">Invitar participantes</p>
                  <p className="text-slate-300 mt-1">
                    Lista de invitados y co-anfitriones con Supabase.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">Programar transmisión</p>
                  <p className="text-slate-300 mt-1">
                    Fecha y hora para eventos futuros.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">Notificaciones</p>
                  <p className="text-slate-300 mt-1">
                    Avisos a usuarios cuando una transmisión esté activa.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate(createPageUrl('Home'))}
                className="h-12 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="h-12 rounded-2xl border-cyan-400/30 bg-transparent text-cyan-200 hover:bg-cyan-500/10"
              >
                Regresar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
