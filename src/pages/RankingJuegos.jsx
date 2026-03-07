import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Music, Brain, BookOpen, Crown, Medal, Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RankingJuegos() {
  const [currentUser, setCurrentUser] = useState(null);

  const [ahorcado, setAhorcado] = useState([]);
  const [memorama, setMemorama] = useState([]);
  const [triviaPractica, setTriviaPractica] = useState([]);
  const [triviaConcurso, setTriviaConcurso] = useState([]);
  const [escuchaYGana, setEscuchaYGana] = useState([]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch {}
    };
    loadUser();
  }, []);

  useEffect(() => {
    const cargarRankings = async () => {
      try {
        // ⭐ Ahorcado
        const ahorcadoData = await base44.entities.RankingGlobal.filter(
          { juego: "Ahorcado" },
          "-puntos"
        );
        setAhorcado(ahorcadoData);

        // ⭐ Memorama
        const memoramaData = await base44.entities.RankingGlobal.filter(
          { juego: "Memorama" },
          "-puntos"
        );
        setMemorama(memoramaData);

        // ⭐ Trivia (Práctica)
        const triviaPracticaData = await base44.entities.RankingGlobal.filter(
          { juego: "Trivia" },
          "-puntos"
        );
        setTriviaPractica(triviaPracticaData);

        // ⭐ Trivia (Concurso)
        const triviaConcursoData = await base44.entities.RankingTriviaConcurso.list("-puntos");
        setTriviaConcurso(triviaConcursoData);

        // ⭐ Escucha y Gana (Concurso)
        const escuchaData = await base44.entities.EscuchaYGanaContest.list("-submitted_at");
        setEscuchaYGana(escuchaData);

      } catch (error) {
        console.error("Error cargando rankings:", error);
      }
    };

    cargarRankings();
  }, []);

  const getMedalIcon = (posicion) => {
    if (posicion === 0) return <Crown className="w-8 h-8 text-yellow-400" />;
    if (posicion === 1) return <Medal className="w-8 h-8 text-gray-300" />;
    if (posicion === 2) return <Medal className="w-8 h-8 text-amber-600" />;
    return <span className="text-xl font-bold text-gray-400">#{posicion + 1}</span>;
  };

  const renderRanking = (titulo, icono, data, extraRenderer = null) => (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        {icono}
        <h2 className="text-3xl font-bold text-white">{titulo}</h2>
      </div>

      {data.length === 0 && (
        <Card className="bg-gray-800/50 border-gray-700 p-6 text-center mb-6">
          <p className="text-gray-400">Aún no hay jugadores en este ranking</p>
        </Card>
      )}

      {data.length > 0 && (
        <>
          {/* Top 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {data.slice(0, 3).map((jugador, index) => (
              <Card
                key={index}
                className={`p-6 text-center ${
                  index === 0
                    ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500'
                    : index === 1
                    ? 'bg-gradient-to-br from-gray-400/20 to-gray-500/20 border-gray-400'
                    : 'bg-gradient-to-br from-amber-600/20 to-amber-700/20 border-amber-600'
                }`}
              >
                <div className="mb-4">{getMedalIcon(index)}</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {jugador.nombre || jugador.user_email?.split("@")[0]}
                </h3>
                <p className="text-3xl font-bold text-cyan-400 mb-1">
                  {jugador.puntos ?? 0}
                </p>
                <p className="text-sm text-gray-400">puntos</p>

                {extraRenderer && extraRenderer(jugador)}
              </Card>
            ))}
          </div>

          {/* Resto */}
          {data.length > 3 && (
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="divide-y divide-gray-700">
                {data.slice(3).map((jugador, index) => (
                  <div
                    key={index + 3}
                    className="p-4 flex justify-between items-center hover:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 text-center">
                        {getMedalIcon(index + 3)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">
                          {jugador.nombre || jugador.user_email?.split("@")[0]}
                        </h4>
                        {extraRenderer && extraRenderer(jugador)}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-cyan-400">
                        {jugador.puntos ?? 0}
                      </p>
                      <p className="text-xs text-gray-400">puntos</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">

        <Link to={createPageUrl('Explore')}>
  <Button
    className="mb-8 w-full py-5 text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center gap-3"
  >
    <span className="text-3xl">👉</span>
    <span>Volver a Juegos</span>
  </Button>
</Link>


        {/* AHORCADO */}
        {renderRanking("Ahorcado", <Trophy className="w-8 h-8 text-yellow-400" />, ahorcado)}

        {/* MEMORAMA */}
        {renderRanking("Memorama", <Brain className="w-8 h-8 text-purple-400" />, memorama)}

        {/* TRIVIA PRÁCTICA */}
        {renderRanking("Trivia (Práctica)", <BookOpen className="w-8 h-8 text-blue-400" />, triviaPractica)}

        {/* TRIVIA CONCURSO */}
        {renderRanking("Trivia (Concurso)", <Sparkles className="w-8 h-8 text-green-400" />, triviaConcurso)}

        {/* ESCUCHA Y GANA */}
        {renderRanking(
          "Escucha y Gana (Concurso)",
          <Music className="w-8 h-8 text-pink-400" />,
          escuchaYGana,
          (jugador) => (
            <div className="text-xs text-gray-400 mt-2">
              <p>Canción: {jugador.song_name}</p>
              <p>Fecha: {new Date(jugador.submitted_at).toLocaleString()}</p>
              <p>Correo: {jugador.user_email.replace(/(.{3}).+(@.+)/, "$1***$2")}</p>
            </div>
          )
        )}

      </div>
    </div>
  );
}
