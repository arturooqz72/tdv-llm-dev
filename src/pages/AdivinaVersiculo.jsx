import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import GameShareButtons from '@/components/games/GameShareButtons';

export default function AdivinaVersiculo() {
  return (
    <div className="min-h-screen py-12 px-4 flex justify-center">
      <div className="max-w-xl w-full">

        <div className="text-center mb-6">
          <Link to={createPageUrl('Explore')}>
            <Button className="mb-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold shadow-lg">
              <span className="text-2xl mr-2">👉</span>
              Volver a Juegos
            </Button>
          </Link>
          
          {/* Título */}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Adivina el Versículo
          </h1>
          <GameShareButtons page="AdivinaVersiculo" title="Adivina el Versículo" />
        </div>

        {/* Descripción */}
        <p className="text-gray-300 text-center mb-8">
          Completa la palabra faltante del versículo bíblico antes de que el tiempo se acabe.
          Pon a prueba tu memoria y tu rapidez.
        </p>

        {/* Card principal */}
        <Card className="p-6 bg-[#0f172a] border border-blue-900/40">

          <h2 className="text-2xl font-semibold text-white mb-4 text-center">
            Selecciona un modo de juego
          </h2>

          {/* Botón Modo Normal */}
          <Link to={createPageUrl("AdivinaVersiculoPlay")}>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-4 mb-4">
              Modo Normal
            </Button>
          </Link>

          {/* Botón Modo Difícil */}
          <Link to={createPageUrl("AdivinaVersiculoDificil")}>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-4">
              Modo Difícil
            </Button>
          </Link>

        </Card>
      </div>
    </div>
  );
}