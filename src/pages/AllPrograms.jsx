import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AllPrograms() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-gray-900 border-cyan-500">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-cyan-400" />
              </div>

              <h1 className="text-2xl font-bold text-white mb-3">
                Programas de radio internos eliminados
              </h1>

              <p className="text-gray-400 mb-6">
                Esta sección pertenecía al sistema viejo de radio interna y ya fue retirada.
                Ahora la plataforma usa AzuraCast para la radio en vivo y Supabase para audios.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to={createPageUrl('AudioManager')}>
                  <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    Ir a Audio Manager
                  </Button>
                </Link>

                <Link to={createPageUrl('Radio')}>
                  <Button variant="outline" className="border-gray-600 text-gray-300">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a Radio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
