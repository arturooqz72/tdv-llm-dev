import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Music, Brain, BookOpen, Crown, Medal, Sparkles } from 'lucide-react';
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
        const ahorcadoData = await base44.entities.RankingGlobal.filter(
          { juego: "Ahorcado" },
          "-puntos"
        );
        setAhorcado(ahorcadoData);

        const memoramaData = await base44.entities.RankingGlobal.filter(
          { juego: "Memorama" },
          "-puntos"
        );
        setMemorama(memoramaData);

        const triviaPracticaData = await base44.entities.RankingGlobal.filter(
          { juego: "Trivia" },
          "-puntos"
        );
        setTriviaPractica(triviaPracticaData);

        const triviaConcursoData = await base44.entities.RankingTriviaConcurso.list("-puntos");
        setTriviaConcurso(triviaConcursoData);

        const escuchaData = await base44.entities.EscuchaYGanaContest.list("-submitted_at");
        setEscuchaYGana(escuchaData);
      } catch (error) {
        console.error("Error cargando rankings:", error);
      }
    };

    cargarRankings();
  }, []);

  const getMedalIcon = (posicion) => {
    if (posicion === 0) return <Crown className="w-8 h-8 text-yellow-500" />;
    if (posicion === 1) return <Medal className="w-8 h-8 text-slate-400" />;
    if (posicion === 2) return <Medal className="w-8 h-8 text-amber-600" />;
    return <span className="text-xl font-bold text-gray-500">#{posicion + 1}</span>;
  };

  const renderRanking = (titulo, icono, data, extraRenderer = null) => (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        {icono}
        <h2 className="text-3xl font-bold text-gray-900">{titulo}</h2>
      </div>

      {data.length === 0 && (
        <Card className="bg-white border border-sky-200 p-6 text-center mb-6 shadow-sm rounded-2xl">
          <p className="text-gray-600">Aún no hay jugadores en este ranking</p>
        </Card>
      )}

      {data.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {data.slice(0, 3).map((jugador, index) => (
              <Card
                key={index}
                className={`p-6 text-center rounded-2xl shadow-sm border ${
                  index === 0
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-300'
                    : index === 1
                    ? 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300'
                    : 'bg-gradient-to-br from-orange-50 to-amber-100 border-amber-300'
                }`}
              >
                <div className="mb-4 flex justify-center">{getMedalIcon(index)}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {jugador.nombre || jugador.user_email?.split("@")[0]}
                </h3>
                <p className="text-3xl font-bold text-sky-600 mb-1">
                  {jugador.puntos ?? 0}
                </p>
                <p className="text-sm text-gray-600">puntos</p>

                {extraRenderer && extraRenderer(jugador)}
              </Card>
            ))}
          </div>

          {data.length > 3 && (
            <Card className="bg-white border border-sky-200 shadow-sm rounded-2xl">
              <div className="divide-y divide-sky-100">
                {data.slice(3).map((jugador, index) => (
                  <div
                    key={index + 3}
                    className="p-4 flex justify-between items-center hover:bg-sky-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 text-center">
                        {getMedalIcon(index + 3)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {jugador.nombre || jugador.user_email?.split("@")[0]}
                        </h4>
                        {extraRenderer && extraRenderer(jugador)}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-sky-600">
                        {jugador.puntos ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">puntos</p>
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
    <div className="min-h-screen bg-gradient-to-b from-white via-sky-50 to-blue-100 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link to={createPageUrl('Explore')}>
          <Button
            className="mb-8 w-full py-5 text-xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-2xl shadow-lg flex items-center justify-center gap-3 hover:from-violet-700 hover:to-blue-700"
          >
            <span className="text-3xl">👉</span>
            <span>Volver a Juegos</span>
          </Button>
        </Link>

        {renderRanking("Ahorcado", <Trophy className="w-8 h-8 text-yellow-500" />, ahorcado)}

        {renderRanking("Memorama", <Brain className="w-8 h-8 text-violet-500" />, memorama)}

        {renderRanking("Trivia (Práctica)", <BookOpen className="w-8 h-8 text-blue-500" />, triviaPractica)}

        {renderRanking("Trivia (Concurso)", <Sparkles className="w-8 h-8 text-emerald-500" />, triviaConcurso)}

        {renderRanking(
          "Escucha y Gana (Concurso)",
          <Music className="w-8 h-8 text-pink-500" />,
          escuchaYGana,
          (jugador) => (
            <div className="text-xs text-gray-600 mt-2">
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
