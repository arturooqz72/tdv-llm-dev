import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { ArrowLeft } from "lucide-react";
import GameShareButtons from '@/components/games/GameShareButtons';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdivinaVersiculoDificil() {
  // Versículos modo difícil (intermedios + difíciles)
  const preguntasBase = [
    { texto: "Mas buscad primeramente el reino de Dios y su ______.", respuesta: "justicia" },
    { texto: "Y conoceréis la verdad, y la verdad os ______.", respuesta: "hará libres" },
    { texto: "Clama a mí, y yo te responderé, y te enseñaré cosas grandes y ______.", respuesta: "ocultas" },
    { texto: "El justo por su fe ______.", respuesta: "vivirá" },
    { texto: "Sed santos, porque yo soy ______.", respuesta: "santo" },
    { texto: "Seguid la paz con todos, y la ______, sin la cual nadie verá al Señor.", respuesta: "santidad" },
    { texto: "Jehová es bueno, fortaleza en el día de la ______.", respuesta: "angustia" },
    { texto: "El Señor está en medio de ti, poderoso; él ______.", respuesta: "salvará" },
    { texto: "Pero el justo vivirá por su fe; y si retrocediere, no agradará a mi ______.", respuesta: "alma" },
    { texto: "Someteos, pues, a Dios; resistid al diablo, y huirá de ______.", respuesta: "vosotros" },
    { texto: "El que quiera venir en pos de mí, niéguese a sí mismo, tome su ______ y sígame.", respuesta: "cruz" },
    { texto: "Porque muchos son los llamados, y pocos los ______.", respuesta: "escogidos" },
    { texto: "La lámpara del cuerpo es el ______.", respuesta: "ojo" },
    { texto: "Porque raíz de todos los males es el amor al ______.", respuesta: "dinero" },
    { texto: "La oración eficaz del justo puede ______.", respuesta: "mucho" },
    { texto: "El que perseverare hasta el fin, éste será ______.", respuesta: "salvo" },
    { texto: "Porque no nos ha dado Dios espíritu de cobardía, sino de poder, amor y ______.", respuesta: "dominio propio" },
    { texto: "El que encubre sus pecados no prosperará; mas el que los confiesa y se ______ alcanzará misericordia.", respuesta: "aparta" },
    { texto: "Lámpara es a mis pies tu palabra, y lumbrera a mi ______.", respuesta: "camino" },
    { texto: "Porque para mí el vivir es Cristo, y el morir es ______.", respuesta: "ganancia" },
  ];

  // Mezclar aleatoriamente UNA SOLA VEZ
  const [preguntas] = useState(() => [...preguntasBase].sort(() => Math.random() - 0.5));

  const [index, setIndex] = useState(0);
  const [respuesta, setRespuesta] = useState("");
  const [puntos, setPuntos] = useState(0);
  const [tiempo, setTiempo] = useState(10);
  const [correctas, setCorrectas] = useState(0);
  const [incorrectas, setIncorrectas] = useState(0);
  const [estado, setEstado] = useState("jugando");

  // Animación del card
  const [animCard, setAnimCard] = useState("opacity-0 translate-y-3");

  useEffect(() => {
    setTimeout(() => {
      setAnimCard("opacity-100 translate-y-0 transition-all duration-500");
    }, 50);
  }, [index]);

  // Timer
  useEffect(() => {
    if (estado !== "jugando") return;

    if (tiempo === 0) {
      manejarRespuesta(false);
      return;
    }

    const timer = setTimeout(() => {
      setTiempo(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [tiempo, estado]);

  const manejarRespuesta = (esCorrecto) => {
    if (esCorrecto) {
      setPuntos((p) => p + 20);
      setCorrectas((c) => c + 1);
      setEstado("correcto");
    } else {
      setPuntos((p) => p - 10);
      setIncorrectas((i) => i + 1);
      setEstado("incorrecto");
    }

    setTimeout(() => {
      if (index + 1 < preguntas.length) {
        setIndex((i) => i + 1);
        setRespuesta("");
        setTiempo(10);
        setEstado("jugando");
      } else {
        guardarPuntaje();
        setEstado("terminado");
      }
    }, 1200);
  };

  const guardarPuntaje = async () => {
    try {
      const user = await base44.auth.me();
      // Comentado temporalmente - no hay entidad GameScore
      console.log("Puntaje:", puntos);
    } catch (error) {
      console.log("Error guardando puntaje:", error);
    }
  };

  const enviar = () => {
    const correcta = preguntas[index].respuesta.toLowerCase().trim();
    const usuario = respuesta.toLowerCase().trim();
    manejarRespuesta(usuario === correcta);
  };

  if (estado === "terminado") {
    return (
      <div className="p-6 max-w-xl mx-auto text-center animate-fadeIn">
        <h1 className="text-3xl font-bold text-red-400 mb-4">¡Modo Difícil Terminado!</h1>
        <p className="text-gray-300 text-xl mb-2">Puntaje final: {puntos}</p>
        <p className="text-gray-400 mb-6">Correctas: {correctas} — Incorrectas: {incorrectas}</p>

        <Button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white text-lg px-6 py-4 active:scale-95 transition-all"
        >
          Jugar de nuevo
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto text-center">

      <Link to={createPageUrl('Explore')}>
        <Button className="mb-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold shadow-lg">
          <span className="text-2xl mr-2">👉</span>
          Volver a Juegos
        </Button>
      </Link>

      <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent animate-fadeIn">
        Adivina el Versículo — Modo Difícil
      </h1>
      <GameShareButtons page="AdivinaVersiculoDificil" title="Adivina el Versículo — Difícil" />

      <div className="flex justify-between text-gray-300 mb-4">
        <span>Puntos: {puntos}</span>
        <span className={`transition-all ${tiempo <= 3 ? "text-red-400 scale-110" : ""}`}>
          ⏱️ Tiempo: {tiempo}s
        </span>
      </div>

      <Card className={`p-6 bg-[#1a0f0f] border border-red-900/40 mb-6 transform transition-all duration-500 ${animCard}`}>
        <p className="text-gray-200 text-lg mb-4">{preguntas[index].texto}</p>

        <input
          type="text"
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
          className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700"
          placeholder="Escribe la palabra faltante..."
        />

        <Button
          onClick={enviar}
          className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white text-lg py-4 active:scale-95 transition-all"
        >
          Responder
        </Button>

        {estado === "correcto" && <p className="text-green-400 mt-4 font-semibold animate-pop">¡Correcto!</p>}
        {estado === "incorrecto" && <p className="text-red-400 mt-4 font-semibold animate-shake">Incorrecto</p>}
      </Card>
    </div>
  );
}