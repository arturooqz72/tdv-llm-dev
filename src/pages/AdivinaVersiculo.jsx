import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import GameShareButtons from '@/components/games/GameShareButtons';

export default function AdivinaVersiculo() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-sky-50 to-blue-100 py-12 px-4 flex justify-center">
      <div className="max-w-xl w-full">

        <div className="text-center mb-6">
          <Link to={createPageUrl('Explore')}>
            <Button className="mb-4 bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-lg rounded-2xl">
              <span className="text-2xl mr-2">👉</span>
              Volver a Juegos
            </Button>
          </Link>

          <h1 className="text-4xl font-bold text-sky-600">
            Adivina el Versículo
          </h1>

          <GameShareButtons page="AdivinaVersiculo" title="Adivina el Versículo" />
        </div>

        <p className="text-gray-600 text-center mb-8">
          Completa la palabra faltante del versículo bíblico antes de que el tiempo se acabe.
          Pon a prueba tu memoria y tu rapidez.
        </p>

        <Card className="p-6 bg-white border border-sky-200 shadow-xl rounded-3xl">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
            Selecciona un modo de juego
          </h2>

          <Link to={createPageUrl("AdivinaVersiculoPlay")}>
            <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white text-lg py-4 mb-4 rounded-2xl">
              Modo Normal
            </Button>
          </Link>

          <Link to={createPageUrl("AdivinaVersiculoDificil")}>
            <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white text-lg py-4 rounded-2xl">
              Modo Difícil
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
