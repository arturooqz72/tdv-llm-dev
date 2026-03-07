import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Copy, Check, Share2 } from "lucide-react";

function ShareButtons({ page, title }) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => `${window.location.origin}${createPageUrl(page)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(getUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = getUrl();
    if (navigator.share) {
      await navigator.share({ title, url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopy(); }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-200 hover:bg-cyan-600 hover:text-white transition-colors"
      >
        {copied ? <Check className="w-3 h-3 text-green-300" /> : <Copy className="w-3 h-3" />}
        {copied ? "¡Copiado!" : "Copiar link"}
      </button>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(); }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-200 hover:bg-cyan-600 hover:text-white transition-colors"
      >
        <Share2 className="w-3 h-3" />
        Compartir
      </button>
    </div>
  );
}

export default function Explore() {
  return (
    <div className="min-h-screen py-12 px-4 flex justify-center">
      <div className="max-w-3xl w-full">

        <h1 className="text-4xl font-bold text-center mb-10 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Juegos Disponibles
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Memorama */}
          <Card className="p-6 bg-[#0f172a] border border-blue-900/40">
            <h2 className="text-xl font-semibold text-white mb-3">Memorama Bíblico</h2>
            <p className="text-gray-400 mb-4">Encuentra las parejas de versículos.</p>
            <Link to={createPageUrl("Memorama")}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Jugar</Button>
            </Link>
            <ShareButtons page="Memorama" title="Memorama Bíblico" />
          </Card>

          {/* Trivia Bíblica */}
          <Card className="p-6 bg-[#0f172a] border border-blue-900/40">
            <h2 className="text-xl font-semibold text-white mb-3">Trivia Bíblica</h2>
            <p className="text-gray-400 mb-4">Responde preguntas de conocimiento bíblico.</p>
            <Link to={createPageUrl("TriviaBiblica")}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Jugar</Button>
            </Link>
            <ShareButtons page="TriviaBiblica" title="Trivia Bíblica" />
          </Card>

          {/* Adivina la Palabra */}
          <Card className="p-6 bg-[#0f172a] border border-blue-900/40">
            <h2 className="text-xl font-semibold text-white mb-3">Adivina la Palabra</h2>
            <p className="text-gray-400 mb-4">Completa la palabra bíblica correcta.</p>
            <Link to={createPageUrl("AdivinaLaPalabra")}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Jugar</Button>
            </Link>
            <ShareButtons page="AdivinaLaPalabra" title="Adivina la Palabra" />
          </Card>

          {/* Ahorcado */}
          <Card className="p-6 bg-[#0f172a] border border-blue-900/40">
            <h2 className="text-xl font-semibold text-white mb-3">Ahorcado Bíblico</h2>
            <p className="text-gray-400 mb-4">Adivina la palabra antes de perder.</p>
            <Link to={createPageUrl("Ahorcado")}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Jugar</Button>
            </Link>
            <ShareButtons page="Ahorcado" title="Ahorcado Bíblico" />
          </Card>

          {/* ¿Quién lo dijo? */}
          <Card className="p-6 bg-[#0f172a] border border-blue-900/40">
            <h2 className="text-xl font-semibold text-white mb-3">¿Quién lo dijo?</h2>
            <p className="text-gray-400 mb-4">Adivina quién dijo la frase bíblica.</p>
            <Link to={createPageUrl("QuienLoDijo")}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Jugar</Button>
            </Link>
            <ShareButtons page="QuienLoDijo" title="¿Quién lo dijo?" />
          </Card>

          {/* Adivina el Versículo — Modo Normal */}
          <Card className="p-6 bg-[#0f172a] border border-blue-900/40">
            <h2 className="text-xl font-semibold text-white mb-3">Adivina el Versículo</h2>
            <p className="text-gray-400 mb-4">Completa la palabra faltante.</p>
            <Link to={createPageUrl("AdivinaVersiculo")}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Entrar</Button>
            </Link>
            <ShareButtons page="AdivinaVersiculo" title="Adivina el Versículo" />
          </Card>

          {/* Adivina el Versículo — Modo Difícil */}
          <Card className="p-6 bg-[#0f172a] border border-red-900/40">
            <h2 className="text-xl font-semibold text-red-400 mb-3">Adivina el Versículo — Difícil</h2>
            <p className="text-gray-400 mb-4">Versículos más largos y menos tiempo.</p>
            <Link to={createPageUrl("AdivinaVersiculoDificil")}>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">Jugar Modo Difícil</Button>
            </Link>
            <ShareButtons page="AdivinaVersiculoDificil" title="Adivina el Versículo — Difícil" />
          </Card>

          {/* Ranking */}
          <Card className="p-6 bg-[#0f172a] border border-green-900/40">
            <h2 className="text-xl font-semibold text-green-400 mb-3">Ranking General</h2>
            <p className="text-gray-400 mb-4">Consulta los puntajes más altos.</p>
            <Link to={createPageUrl("RankingJuegos")}>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Ver Ranking</Button>
            </Link>
            <ShareButtons page="RankingJuegos" title="Ranking General" />
          </Card>

        </div>
      </div>
    </div>
  );
}