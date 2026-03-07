import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const preguntasBase = [
    { texto: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo ______.", respuesta: "unigénito" },
    { texto: "Jehová es mi pastor; nada me ______.", respuesta: "faltará" },
    { texto: "Todo lo puedo en Cristo que me ______.", respuesta: "fortalece" },
    { texto: "En el principio creó Dios los ______ y la tierra.", respuesta: "cielos" },
    { texto: "Clama a mí, y yo te responderé, y te enseñaré cosas grandes y ______.", respuesta: "ocultas" },
    { texto: "Bienaventurados los pacificadores, porque ellos serán llamados hijos de ______.", respuesta: "Dios" },
    { texto: "El Señor es mi luz y mi ______.", respuesta: "salvación" },
    { texto: "Mas buscad primeramente el reino de Dios y su ______.", respuesta: "justicia" },
    { texto: "El amor cubrirá multitud de ______.", respuesta: "pecados" },
    { texto: "La fe es la certeza de lo que se ______.", respuesta: "espera" },
    { texto: "El justo por su fe ______.", respuesta: "vivirá" },
    { texto: "Someteos, pues, a Dios; resistid al ______ y huirá de vosotros.", respuesta: "diablo" },
    { texto: "El principio de la sabiduría es el ______ de Jehová.", respuesta: "temor" },
    { texto: "Mi paz os dejo, mi paz os ______.", respuesta: "doy" },
    { texto: "Lámpara es a mis pies tu ______.", respuesta: "palabra" },
    { texto: "Orad sin ______.", respuesta: "cesar" },
    { texto: "Dios es nuestro amparo y ______.", respuesta: "fortaleza" },
    { texto: "El que cree en mí, aunque esté muerto, ______.", respuesta: "vivirá" },
    { texto: "El que habita al abrigo del Altísimo morará bajo la sombra del ______.", respuesta: "Omnipotente" },
    { texto: "Confía en Jehová con todo tu ______.", respuesta: "corazón" },
  ];
export default function AdivinaVersiculoPlay() {
  const [current, setCurrent] = useState(null);
  const [options, setOptions] = useState([]);
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(15);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sonidos (opcional - solo si existen)
  const playSound = (type) => {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.play().catch(() => {}); // Ignorar errores si no existe el archivo
    } catch (e) {
      // No hacer nada si falla
    }
  };

  useEffect(() => {
    loadNewVerse();
  }, []);

  useEffect(() => {
    if (timer <= 0) {
      playSound('timeout');
      setMessage("⏳ Tiempo agotado");
      setTimeout(() => loadNewVerse(), 1500);
      return;
    }

    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const loadNewVerse = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    const random = preguntasBase[Math.floor(Math.random() * preguntasBase.length)];
    setCurrent(random);

    const shuffled = [...preguntasBase]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    if (!shuffled.includes(random)) shuffled[0] = random;

    setOptions(shuffled.sort(() => Math.random() - 0.5));
    setMessage("");
    setTimer(15);
  };

  const checkAnswer = (respuesta) => {
    playSound('click');

    if (respuesta === current.respuesta) {
      playSound('correct');
      setMessage("✔ ¡Correcto!");
      setTimeout(() => loadNewVerse(), 1200);
    } else {
      playSound('wrong');
      setMessage("✖ Incorrecto");
      setTimeout(() => loadNewVerse(), 1200);
    }
  };

  return (
    <div className="p-4 text-center select-none">
      <Link to={createPageUrl('Explore')}>
        <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver a Juegos
        </Button>
      </Link>
      
      <h1 className="text-2xl font-bold mb-4 text-white">Adivina el Versículo</h1>

      <div
        className={`p-4 bg-gray-800 rounded shadow transition-all duration-300 ${
          isAnimating ? "scale-95 opacity-50" : "scale-100 opacity-100"
        }`}
      >
        <p className="text-lg font-medium mb-2 text-white">Completa el versículo:</p>
        <p className="italic text-gray-300 mb-4">{current?.texto}</p>

        <p className="text-sm text-cyan-400 mb-2">Tiempo restante: {timer}s</p>

        <div className="grid grid-cols-1 gap-3">
          {options.map((opt, index) => (
            <button
              key={index}
              onClick={() => checkAnswer(opt.respuesta)}
              className="p-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 active:scale-95 transition"
            >
              {opt.respuesta}
            </button>
          ))}
        </div>

        {message && (
          <p className="mt-4 text-lg font-bold animate-pulse text-white">{message}</p>
        )}
      </div>
    </div>
  );
}