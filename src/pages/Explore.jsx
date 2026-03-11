import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Copy, Check, Share2, Sparkles } from "lucide-react";

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
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleCopy();
        }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-cyan-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors shadow-sm"
      >
        {copied ? (
          <Check className="w-3 h-3 text-emerald-500" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
        {copied ? "¡Copiado!" : "Copiar link"}
      </button>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleShare();
        }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-cyan-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors shadow-sm"
      >
        <Share2 className="w-3 h-3" />
        Compartir
      </button>
    </div>
  );
}

function GameCard({
  title,
  description,
  page,
  buttonText = "Jugar",
  accent = "cyan",
}) {
  const accentStyles = {
    cyan: {
      cardBorder: "border-cyan-200",
      badgeBg: "bg-cyan-50",
      badgeText: "text-cyan-700",
      titleText: "text-slate-900",
      button:
        "bg-cyan-500 hover:bg-cyan-400 text-white",
    },
    red: {
      cardBorder: "border-rose-200",
      badgeBg: "bg-rose-50",
      badgeText: "text-rose-700",
      titleText: "text-rose-700",
      button:
        "bg-rose-500 hover:bg-rose-400 text-white",
    },
    green: {
      cardBorder: "border-emerald-200",
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-700",
      titleText: "text-emerald-700",
      button:
        "bg-emerald-500 hover:bg-emerald-400 text-white",
    },
  };

  const styles = accentStyles[accent] || accentStyles.cyan;

  return (
    <Card
      className={`p-6 rounded-3xl border ${styles.cardBorder} bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      <div
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold mb-4 ${styles.badgeBg} ${styles.badgeText}`}
      >
        <Sparkles className="w-3 h-3" />
        Juego bíblico
      </div>

      <h2 className={`text-xl font-bold mb-3 ${styles.titleText}`}>{title}</h2>

      <p className="text-slate-600 mb-4 leading-relaxed">{description}</p>

      <Link to={createPageUrl(page)}>
        <Button className={`w-full rounded-xl font-semibold shadow-sm ${styles.button}`}>
          {buttonText}
        </Button>
      </Link>

      <ShareButtons page={page} title={title} />
    </Card>
  );
}

export default function Explore() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e9f9ff] via-[#f5fcff] to-[#ffffff] py-12 px-4 flex justify-center">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-4 py-1.5 text-sm text-cyan-700 shadow-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Diversión · Biblia · Comunidad
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Juegos <span className="text-cyan-700">Disponibles</span>
          </h1>

          <p className="mt-3 text-slate-600 text-base md:text-lg max-w-2xl mx-auto">
            Explora juegos bíblicos para aprender, compartir y convivir con la
            comunidad de Team Desvelados LLDM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GameCard
            title="Memorama Bíblico"
            description="Encuentra las parejas de versículos."
            page="Memorama"
          />

          <GameCard
            title="Trivia Bíblica"
            description="Responde preguntas de conocimiento bíblico."
            page="TriviaBiblica"
          />

          <GameCard
            title="Adivina la Palabra"
            description="Completa la palabra bíblica correcta."
            page="AdivinaLaPalabra"
          />

          <GameCard
            title="Ahorcado Bíblico"
            description="Adivina la palabra antes de perder."
            page="Ahorcado"
          />

          <GameCard
            title="¿Quién lo dijo?"
            description="Adivina quién dijo la frase bíblica."
            page="QuienLoDijo"
          />

          <GameCard
            title="Adivina el Versículo"
            description="Completa la palabra faltante."
            page="AdivinaVersiculo"
            buttonText="Entrar"
          />

          <GameCard
            title="Adivina el Versículo — Difícil"
            description="Versículos más largos y menos tiempo."
            page="AdivinaVersiculoDificil"
            buttonText="Jugar Modo Difícil"
            accent="red"
          />

          <GameCard
            title="Ranking General"
            description="Consulta los puntajes más altos."
            page="RankingJuegos"
            buttonText="Ver Ranking"
            accent="green"
          />
        </div>
      </div>
    </div>
  );
}
