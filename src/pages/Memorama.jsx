import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Clock, RotateCcw, Sparkles, ArrowLeft } from 'lucide-react';
import GameShareButtons from '@/components/games/GameShareButtons';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import confetti from 'canvas-confetti';
import { base44 } from '@/api/base44Client';

const emojis = ['📜', '🕊️', '🌿', '🌟', '🔥', '❤️', '📘', '🪔'];

export default function Memorama() {
  const [currentUser, setCurrentUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameWon, setGameWon] = useState(false);

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
    initializeGame();
  }, []);

  useEffect(() => {
    let interval;
    if (isPlaying && !gameWon) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameWon]);

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      setGameWon(true);
      setIsPlaying(false);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [matched, cards]);

  const initializeGame = () => {
    const shuffledCards = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji }));
    setCards(shuffledCards);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setTime(0);
    setIsPlaying(false);
    setGameWon(false);
  };

  const handleCardClick = (index) => {
    if (!isPlaying) setIsPlaying(true);
    
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) {
      return;
    }

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped;
      
      if (cards[first].emoji === cards[second].emoji) {
        setMatched([...matched, first, second]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const guardarPuntuacion = async () => {
    if (!currentUser || moves === 0) return;

    const puntos = Math.max(100 - (moves * 5) - Math.floor(time / 10), 10);

    try {
      const registros = await base44.entities.RankingGlobal.filter({
        juego: "Memorama",
        userId: currentUser.id
      });

      if (registros.length > 0) {
        const registroActual = registros[0];
        if (puntos > registroActual.puntos) {
          await base44.entities.RankingGlobal.update(registroActual.id, {
            puntos: puntos,
            nombre: currentUser.full_name || currentUser.email
          });
          alert("¡Puntuación actualizada exitosamente!");
        } else {
          alert("Tu puntuación anterior es mayor");
        }
      } else {
        await base44.entities.RankingGlobal.create({
          juego: "Memorama",
          userId: currentUser.id,
          nombre: currentUser.full_name || currentUser.email,
          puntos: puntos
        });
        alert("¡Puntuación registrada exitosamente!");
      }
    } catch (error) {
      console.error("Error guardando puntuación:", error);
      alert("Error al guardar la puntuación. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to={createPageUrl('Explore')}>
            <Button className="mb-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold shadow-lg">
              <span className="text-2xl mr-2">👉</span>
              Volver a Juegos
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Memorama
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-gray-300">¡Encuentra las parejas!</p>
          <GameShareButtons page="Memorama" title="Memorama Bíblico" />
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700 px-6 py-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-semibold">{formatTime(time)}</span>
            </div>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700 px-6 py-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">{moves} movimientos</span>
            </div>
          </Card>
        </div>

        {/* Game Won Message */}
        {gameWon && (
          <div className="text-center mb-8 animate-bounce">
            <h2 className="text-3xl font-bold text-yellow-400 mb-2">🎉 ¡Felicidades! 🎉</h2>
            <p className="text-white text-lg">
              Completaste el juego en {moves} movimientos y {formatTime(time)}
            </p>
          </div>
        )}

        {/* Game Board */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {cards.map((card, index) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(index)}
              disabled={flipped.includes(index) || matched.includes(index)}
              className={`aspect-square rounded-xl transition-all duration-300 transform hover:scale-105 ${
                flipped.includes(index) || matched.includes(index)
                  ? 'bg-gradient-to-br from-cyan-500 to-cyan-600'
                  : 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700'
              } ${matched.includes(index) ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-center w-full h-full text-5xl">
                {flipped.includes(index) || matched.includes(index) ? card.emoji : '?'}
              </div>
            </button>
          ))}
        </div>

        {/* Reset Button */}
        <div className="text-center mb-10">
          <Button
            onClick={initializeGame}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Nuevo Juego
          </Button>
        </div>

        {/* Botones de ranking */}
        <div className="text-center mt-4 space-y-4">
          <Button
            onClick={guardarPuntuacion}
            disabled={!currentUser || moves === 0}
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