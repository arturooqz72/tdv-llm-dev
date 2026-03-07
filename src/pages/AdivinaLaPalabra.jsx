import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { HelpCircle, CheckCircle, XCircle, Trophy, RotateCcw, ArrowLeft, Lightbulb } from 'lucide-react';
import GameShareButtons from '@/components/games/GameShareButtons';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import confetti from 'canvas-confetti';

const palabras = [
  { palabra: "FE", pista: "Creencia firme en algo sin necesidad de pruebas" },
  { palabra: "GRACIA", pista: "Favor inmerecido de Dios hacia el hombre" },
  { palabra: "AMOR", pista: "Sentimiento supremo que Dios tiene por la humanidad" },
  { palabra: "ORACION", pista: "Comunicación directa con Dios" },
  { palabra: "SALVACION", pista: "Liberación del pecado" },
  { palabra: "PERDON", pista: "Acto de dejar ir una ofensa" },
  { palabra: "BIBLIA", pista: "Escrituras sagradas" },
  { palabra: "JESUS", pista: "Autor y consumador de la fe" },
  { palabra: "ESPIRITU", pista: "Fuerza que da vida" },
  { palabra: "CIELO", pista: "Morada celestial" },
  { palabra: "ANGEL", pista: "Mensajero de Dios" },
  { palabra: "MILAGRO", pista: "Hecho sobrenatural" },
  { palabra: "PROFETA", pista: "Hombre enviado por Dios" },
  { palabra: "APOSTOL", pista: "Enviado a predicar" },
  { palabra: "TEMPLO", pista: "Casa de oración" },
  { palabra: "RESURRECCION", pista: "Volver a la vida" },
  { palabra: "BAUTISMO", pista: "Mandamiento de fe" },
  { palabra: "ALELUYA", pista: "Expresión de alabanza" },
  { palabra: "AMEN", pista: "Así sea" },
  { palabra: "GLORIA", pista: "Esplendor divino" },
  { palabra: "SANTIDAD", pista: "Pureza espiritual" },
  { palabra: "REDENCION", pista: "Ser liberado del pecado" },
  { palabra: "EVANGELIO", pista: "Buenas nuevas" },
  { palabra: "PACTO", pista: "Acuerdo solemne" },
  { palabra: "MOISES", pista: "Libertador de Israel" },
  { palabra: "DAVID", pista: "Rey que venció a Goliat" },
  { palabra: "MARIA", pista: "Mujer de fe" },
  { palabra: "PEDRO", pista: "Discípulo valiente" },
  { palabra: "PABLO", pista: "Predicador incansable" },
  { palabra: "ADAN", pista: "Primer hombre" },
  { palabra: "NOE", pista: "Constructor del arca" },
  { palabra: "ABRAHAM", pista: "Padre de la fe" },
  { palabra: "SALMO", pista: "Cántico espiritual" },
  { palabra: "GENESIS", pista: "Principio de todo" },
  { palabra: "APOCALIPSIS", pista: "Revelación final" },
  { palabra: "JUDA", pista: "Tribu importante" },
  { palabra: "BELEN", pista: "Ciudad de nacimiento" },
  { palabra: "JERUSALEN", pista: "Ciudad santa" },
  { palabra: "PASCUA", pista: "Celebración de liberación" },
  { palabra: "PENTECOSTES", pista: "Día de bendición" },
  { palabra: "ISAIAS", pista: "Profeta mayor" },
  { palabra: "DANIEL", pista: "Hombre fiel" },
  { palabra: "JONAS", pista: "Profeta del gran pez" },
  { palabra: "SANSON", pista: "Hombre fuerte" },
  { palabra: "RUT", pista: "Mujer virtuosa" },
  { palabra: "ESTER", pista: "Reina valiente" },
  { palabra: "JOB", pista: "Hombre paciente" },
  { palabra: "SALOMON", pista: "Rey sabio" }
];

export default function AdivinaLaPalabra() {
  const [currentUser, setCurrentUser] = useState(null);
  const [palabraActual, setPalabraActual] = useState(0);
  const [respuesta, setRespuesta] = useState('');
  const [puntuacion, setPuntuacion] = useState(0);
  const [mostrarResultado, setMostrarResultado] = useState(null);
  const [juegoTerminado, setJuegoTerminado] = useState(false);
  const [palabrasAleatorias, setPalabrasAleatorias] = useState([]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.log('Usuario no autenticado');
      }
    };
    loadUser();
    inicializarJuego();
  }, []);

  const inicializarJuego = () => {
    const shuffled = [...palabras].sort(() => Math.random() - 0.5).slice(0, 20);
    setPalabrasAleatorias(shuffled);
    setPalabraActual(0);
    setPuntuacion(0);
    setRespuesta('');
    setMostrarResultado(null);
    setJuegoTerminado(false);
  };

  const normalizarTexto = (texto) => {
    return texto
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const verificarRespuesta = () => {
    if (!respuesta.trim()) return;

    const esCorrecta = normalizarTexto(respuesta) === normalizarTexto(palabrasAleatorias[palabraActual].palabra);
    
    setMostrarResultado(esCorrecta);

    if (esCorrecta) {
      setPuntuacion(puntuacion + 10);
    }

    setTimeout(() => {
      if (palabraActual < palabrasAleatorias.length - 1) {
        setPalabraActual(palabraActual + 1);
        setRespuesta('');
        setMostrarResultado(null);
      } else {
        setJuegoTerminado(true);
        if (puntuacion >= palabrasAleatorias.length * 7) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !mostrarResultado) {
      verificarRespuesta();
    }
  };

  const guardarPuntuacion = async () => {
    if (!currentUser || puntuacion === 0) return;

    try {
      const registros = await base44.entities.RankingGlobal.filter({
        juego: "Trivia",
        userId: currentUser.id
      });

      if (registros.length > 0) {
        const registroActual = registros[0];
        if (puntuacion > registroActual.puntos) {
          await base44.entities.RankingGlobal.update(registroActual.id, {
            puntos: puntuacion,
            nombre: currentUser.full_name || currentUser.email
          });
          alert("¡Puntuación actualizada exitosamente!");
        } else {
          alert("Tu puntuación anterior es mayor");
        }
      } else {
        await base44.entities.RankingGlobal.create({
          juego: "Trivia",
          userId: currentUser.id,
          nombre: currentUser.full_name || currentUser.email,
          puntos: puntuacion
        });
        alert("¡Puntuación registrada exitosamente!");
      }
    } catch (error) {
      console.error("Error guardando puntuación:", error);
      alert("Error al guardar la puntuación. Inténtalo de nuevo.");
    }
  };

  if (juegoTerminado) {
    const porcentaje = (puntuacion / (palabrasAleatorias.length * 10)) * 100;
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="bg-gray-800/50 border-gray-700 p-8 text-center">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">¡Juego Terminado!</h2>
            <p className="text-2xl text-cyan-400 mb-2">
              Puntuación: {puntuacion} de {palabrasAleatorias.length * 10}
            </p>
            <p className="text-xl text-gray-300 mb-6">
              {porcentaje >= 70 ? '¡Excelente conocimiento! 🎉' : 
               porcentaje >= 50 ? '¡Bien hecho! 📖' : 
               '¡Sigue practicando! 💪'}
            </p>

            <div className="mt-6 space-y-4">
              <Button
                onClick={guardarPuntuacion}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg px-6 py-3"
              >
                Registrar Puntuación
              </Button>
              <div>
                <Link to={createPageUrl("RankingJuegos")}>
                  <Button className="bg-cyan-600 hover:bg-cyan-700 text-white text-lg px-6 py-3">
                    Ver Ranking
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={inicializarJuego}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Jugar de Nuevo
              </Button>
              <Link to={createPageUrl('Explore')}>
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Menú de Juegos
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (palabrasAleatorias.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">Cargando...</p>
      </div>
    );
  }

  const palabra = palabrasAleatorias[palabraActual];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to={createPageUrl('Explore')}>
            <Button className="mb-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold shadow-lg">
              <span className="text-2xl mr-2">👉</span>
              Volver a Juegos
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Adivina la Palabra
            </h1>
            <HelpCircle className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-gray-300">Descubre la palabra oculta usando la pista</p>
          <GameShareButtons page="AdivinaLaPalabra" title="Adivina la Palabra" />
        </div>

        {/* Progreso */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-white font-semibold">
            Palabra {palabraActual + 1} de {palabrasAleatorias.length}
          </span>
          <span className="text-cyan-400 font-semibold text-xl">
            💎 {puntuacion} puntos
          </span>
        </div>

        {/* Pista */}
        <Card className="bg-gray-800/50 border-gray-700 p-8 mb-6">
          <div className="flex items-start gap-3 mb-6">
            <Lightbulb className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-sm text-gray-400 mb-2">Pista:</h3>
              <p className="text-xl text-white font-semibold">
                {palabra.pista}
              </p>
            </div>
          </div>

          {/* Input de respuesta */}
          <div className="space-y-4">
            <Input
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu respuesta aquí..."
              disabled={mostrarResultado !== null}
              className="text-lg h-14 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              autoFocus
            />

            {/* Resultado SIN mostrar la respuesta */}
            {mostrarResultado !== null && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                mostrarResultado 
                  ? 'bg-green-500/20 border border-green-500' 
                  : 'bg-red-500/20 border border-red-500'
              }`}>
                {mostrarResultado ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="text-green-400 font-bold">¡Correcto! +10 puntos</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-400" />
                    <div>
                      <p className="text-red-400 font-bold">Incorrecto</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Botón verificar */}
          {mostrarResultado === null && (
            <Button
              onClick={verificarRespuesta}
              disabled={!respuesta.trim()}
              className="w-full mt-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold h-12"
            >
              Verificar Respuesta
            </Button>
          )}
        </Card>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-10">
          <div
            className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((palabraActual + 1) / palabrasAleatorias.length) * 100}%` }}
          />
        </div>

        {/* Botones de ranking */}
        <div className="text-center mt-4 space-y-4">
          <Button
            onClick={guardarPuntuacion}
            disabled={!currentUser || puntuacion === 0}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg px-6 py-3"
          >
            Registrar Puntuación
          </Button>
          <div>
            <Link to={createPageUrl("RankingJuegos")}>
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white text-lg px-6 py-3">
                Ver Ranking
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
