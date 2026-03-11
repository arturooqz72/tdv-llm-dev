import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Heart, RotateCcw, Lightbulb } from 'lucide-react';
import GameShareButtons from '@/components/games/GameShareButtons';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import confetti from 'canvas-confetti';
import { useAuth } from '@/lib/AuthContext';

const palabrasAhorcado = [
  { palabra: 'JESUS', pista: 'Autor y consumador de la fe' },
  { palabra: 'BIBLIA', pista: 'Escrituras sagradas' },
  { palabra: 'ORACION', pista: 'Hablar con Dios' },
  { palabra: 'FE', pista: 'Certeza de lo que se espera' },
  { palabra: 'AMOR', pista: 'Vinculo perfecto' },
  { palabra: 'GRACIA', pista: 'Favor de Dios' },
  { palabra: 'SALVACION', pista: 'Liberación del pecado' },
  { palabra: 'CRUZ', pista: 'Instrumento donde murió Jesús' },
  { palabra: 'CIELO', pista: 'Morada celestial' },
  { palabra: 'ANGEL', pista: 'Mensajero de Dios' },
  { palabra: 'TEMPLO', pista: 'Casa de oración' },
  { palabra: 'PROFETA', pista: 'Hombre enviado por Dios' },
  { palabra: 'MILAGRO', pista: 'Hecho sobrenatural' },
  { palabra: 'GLORIA', pista: 'Esplendor divino' },
  { palabra: 'PERDON', pista: 'Acto de misericordia' },
  { palabra: 'BAUTISMO', pista: 'Mandamiento para perdón de pecados' },
  { palabra: 'ALELUYA', pista: 'Expresión de alabanza' },
  { palabra: 'EVANGELIO', pista: 'Buenas nuevas' }
];

const letras = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
const SCORE_STORAGE_KEY = 'tdv_ranking_ahorcado_local';

function readStoredScores() {
  try {
    const raw = localStorage.getItem(SCORE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredScores(scores) {
  localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(scores));
}

export default function Ahorcado() {
  const { user: currentUser } = useAuth();

  const [palabraActual, setPalabraActual] = useState(null);
  const [letrasAdivinadas, setLetrasAdivinadas] = useState([]);
  const [intentosRestantes, setIntentosRestantes] = useState(6);
  const [puntuacion, setPuntuacion] = useState(0);
  const [juegoTerminado, setJuegoTerminado] = useState(false);
  const [ganado, setGanado] = useState(false);
  const [palabrasJugadas, setPalabrasJugadas] = useState(0);

  useEffect(() => {
    iniciarNuevaPalabra();
  }, []);

  const iniciarNuevaPalabra = () => {
    const palabraAleatoria =
      palabrasAhorcado[Math.floor(Math.random() * palabrasAhorcado.length)];
    setPalabraActual(palabraAleatoria);
    setLetrasAdivinadas([]);
    setIntentosRestantes(6);
    setJuegoTerminado(false);
    setGanado(false);
  };

  const manejarLetra = (letra) => {
    if (letrasAdivinadas.includes(letra) || juegoTerminado || !palabraActual) return;

    const nuevasLetrasAdivinadas = [...letrasAdivinadas, letra];
    setLetrasAdivinadas(nuevasLetrasAdivinadas);

    if (!palabraActual.palabra.includes(letra)) {
      const nuevosIntentos = intentosRestantes - 1;
      setIntentosRestantes(nuevosIntentos);

      if (nuevosIntentos === 0) {
        setJuegoTerminado(true);
        setGanado(false);
      }
    } else {
      const palabraCompleta = palabraActual.palabra.split('').every(
        (l) => nuevasLetrasAdivinadas.includes(l) || l === ' '
      );

      if (palabraCompleta) {
        setJuegoTerminado(true);
        setGanado(true);
        setPuntuacion((prev) => prev + intentosRestantes * 10);
        setPalabrasJugadas((prev) => prev + 1);

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const reiniciarJuego = () => {
    setPuntuacion(0);
    setPalabrasJugadas(0);
    iniciarNuevaPalabra();
  };

  const guardarPuntuacion = async () => {
    if (!currentUser || puntuacion === 0) return;

    try {
      const scores = readStoredScores();
      const existingIndex = scores.findIndex(
        (item) => item.userEmail === currentUser.email
      );

      const nombreUsuario =
        currentUser.name || currentUser.full_name || currentUser.email;

      if (existingIndex >= 0) {
        const registroActual = scores[existingIndex];

        if (puntuacion > Number(registroActual.puntos || 0)) {
          scores[existingIndex] = {
            ...registroActual,
            juego: 'Ahorcado',
            userId: currentUser.id,
            userEmail: currentUser.email,
            nombre: nombreUsuario,
            puntos: puntuacion,
            updated_at: new Date().toISOString()
          };
          saveStoredScores(scores);
          alert('¡Puntuación actualizada localmente exitosamente!');
        } else {
          alert('Tu puntuación anterior guardada localmente es mayor.');
        }
      } else {
        scores.push({
          juego: 'Ahorcado',
          userId: currentUser.id,
          userEmail: currentUser.email,
          nombre: nombreUsuario,
          puntos: puntuacion,
          updated_at: new Date().toISOString()
        });
        saveStoredScores(scores);
        alert('¡Puntuación guardada localmente exitosamente!');
      }
    } catch (error) {
      console.error('Error guardando puntuación:', error);
      alert('Error al guardar la puntuación. Inténtalo de nuevo.');
    }
  };

  const dibujarAhorcado = () => {
    const partes = [
      <circle key="head" cx="140" cy="60" r="20" stroke="white" strokeWidth="3" fill="none" />,
      <line key="body" x1="140" y1="80" x2="140" y2="130" stroke="white" strokeWidth="3" />,
      <line key="leftArm" x1="140" y1="90" x2="120" y2="110" stroke="white" strokeWidth="3" />,
      <line key="rightArm" x1="140" y1="90" x2="160" y2="110" stroke="white" strokeWidth="3" />,
      <line key="leftLeg" x1="140" y1="130" x2="120" y2="160" stroke="white" strokeWidth="3" />,
      <line key="rightLeg" x1="140" y1="130" x2="160" y2="160" stroke="white" strokeWidth="3" />
    ];

    const errores = 6 - intentosRestantes;
    return partes.slice(0, errores);
  };

  if (!palabraActual) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Link to={createPageUrl('Explore')}>
            <Button className="mb-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold shadow-lg">
              <span className="text-2xl mr-2">👉</span>
              Volver a Juegos
            </Button>
          </Link>

          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-red-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Ahorcado Bíblico
            </h1>
            <Trophy className="w-8 h-8 text-red-400" />
          </div>

          <p className="text-gray-300">Adivina la palabra letra por letra</p>
          <GameShareButtons page="Ahorcado" title="Ahorcado Bíblico" />
        </div>

        <div className="flex justify-center gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700 px-6 py-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">{puntuacion} puntos</span>
            </div>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 px-6 py-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              <span className="text-white font-semibold">{intentosRestantes} vidas</span>
            </div>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 px-6 py-3">
            <span className="text-white font-semibold">Palabras: {palabrasJugadas}</span>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <h3 className="text-white font-semibold mb-4 text-center">Ahorcado</h3>
            <svg viewBox="0 0 200 200" className="w-full h-64">
              <line x1="20" y1="180" x2="100" y2="180" stroke="white" strokeWidth="3" />
              <line x1="40" y1="180" x2="40" y2="20" stroke="white" strokeWidth="3" />
              <line x1="40" y1="20" x2="140" y2="20" stroke="white" strokeWidth="3" />
              <line x1="140" y1="20" x2="140" y2="40" stroke="white" strokeWidth="3" />
              {dibujarAhorcado()}
            </svg>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="flex items-start gap-2 mb-6">
              <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-sm text-gray-400 mb-1">Pista:</h3>
                <p className="text-lg text-white font-semibold">{palabraActual.pista}</p>
              </div>
            </div>

            <div className="flex justify-center gap-2 mb-8 flex-wrap">
              {palabraActual.palabra.split('').map((letra, index) => (
                <div
                  key={index}
                  className="w-12 h-16 flex items-center justify-center border-b-4 border-cyan-400"
                >
                  <span className="text-3xl font-bold text-white">
                    {letrasAdivinadas.includes(letra) || letra === ' ' ? letra : ''}
                  </span>
                </div>
              ))}
            </div>

            {juegoTerminado && (
              <div
                className={`p-4 rounded-lg text-center mb-4 ${
                  ganado
                    ? 'bg-green-500/20 border border-green-500'
                    : 'bg-red-500/20 border border-red-500'
                }`}
              >
                {ganado ? (
                  <>
                    <p className="text-green-400 font-bold text-xl mb-2">¡Ganaste! 🎉</p>
                    <p className="text-white">+{intentosRestantes * 10} puntos</p>
                  </>
                ) : (
                  <>
                    <p className="text-red-400 font-bold text-xl mb-2">Perdiste 😢</p>
                  </>
                )}

                <Button
                  onClick={iniciarNuevaPalabra}
                  className="mt-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold"
                >
                  Siguiente Palabra
                </Button>
              </div>
            )}
          </Card>
        </div>

        <Card className="bg-gray-800/50 border-gray-700 p-6">
          <h3 className="text-white font-semibold mb-4 text-center">Selecciona una letra</h3>
          <div className="grid grid-cols-7 sm:grid-cols-9 gap-2">
            {letras.map((letra) => (
              <Button
                key={letra}
                onClick={() => manejarLetra(letra)}
                disabled={letrasAdivinadas.includes(letra) || juegoTerminado}
                className={`h-12 font-bold ${
                  letrasAdivinadas.includes(letra)
                    ? palabraActual.palabra.includes(letra)
                      ? 'bg-green-500 hover:bg-green-500'
                      : 'bg-red-500 hover:bg-red-500'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {letra}
              </Button>
            ))}
          </div>
        </Card>

        <div className="text-center mt-8">
          <Button
            onClick={reiniciarJuego}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reiniciar Juego
          </Button>
        </div>

        <div className="text-center mt-10 space-y-4">
          <Button
            onClick={guardarPuntuacion}
            disabled={!currentUser || puntuacion === 0}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg px-6 py-3"
          >
            Registrar Puntuación
          </Button>

          <div>
            <Link to={createPageUrl('RankingJuegos')}>
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
