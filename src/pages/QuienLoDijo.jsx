import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, RefreshCw, ArrowLeft } from "lucide-react";
import GameShareButtons from '@/components/games/GameShareButtons';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const frases = [
  { frase: "Yo y mi casa serviremos al Señor", opciones: ["Moisés", "Josué", "Samuel", "David"], correcta: 1 },
  { frase: "Heme aquí, envíame a mí", opciones: ["Isaías", "Jeremías", "Ezequiel", "Daniel"], correcta: 0 },
  { frase: "El Señor es mi pastor", opciones: ["Salomón", "David", "Job", "Pablo"], correcta: 1 },
  { frase: "¿Quién dicen que soy?", opciones: ["Pedro", "Juan", "Jesús", "Pablo"], correcta: 2 },
  { frase: "Todo lo puedo en Cristo", opciones: ["Pedro", "Pablo", "Juan", "Santiago"], correcta: 1 },
  { frase: "No me llames Noemí, llámame Mara", opciones: ["Rut", "Ester", "Noemí", "Débora"], correcta: 2 },
  { frase: "¿Soy yo acaso guarda de mi hermano?", opciones: ["Caín", "Abel", "Jacob", "Esaú"], correcta: 0 },
  { frase: "Si perezco, que perezca", opciones: ["Sara", "Ester", "Ana", "Marta"], correcta: 1 },

  // 42 nuevas
  { frase: "¿Acaso hay algo imposible para Dios?", opciones: ["Abraham", "Moisés", "Job", "Jeremías"], correcta: 0 },
  { frase: "Habla Señor, que tu siervo escucha", opciones: ["Samuel", "David", "Elías", "Josué"], correcta: 0 },
  { frase: "He peleado la buena batalla", opciones: ["Pedro", "Pablo", "Juan", "Santiago"], correcta: 1 },
  { frase: "No soy digno de desatar la correa de su calzado", opciones: ["Juan el Bautista", "Pedro", "Andrés", "Tomás"], correcta: 0 },
  { frase: "Mi alma engrandece al Señor", opciones: ["María", "Marta", "Elisabet", "Ana"], correcta: 0 },
  { frase: "¿Qué es la verdad?", opciones: ["Pilato", "Herodes", "Caifás", "Félix"], correcta: 0 },
  { frase: "Aquí estoy, porque me llamaste", opciones: ["Samuel", "Isaac", "Jacob", "Daniel"], correcta: 0 },
  { frase: "No tengo plata ni oro", opciones: ["Pedro", "Juan", "Pablo", "Santiago"], correcta: 0 },
  { frase: "Mi casa será llamada casa de oración", opciones: ["Jesús", "Pedro", "Pablo", "Juan"], correcta: 0 },
  { frase: "¿A quién enviaré?", opciones: ["Dios", "Isaías", "Jeremías", "Ezequiel"], correcta: 0 },
  { frase: "No temas, porque yo estoy contigo", opciones: ["Dios", "Isaías", "Josué", "David"], correcta: 0 },
  { frase: "He aquí el Cordero de Dios", opciones: ["Juan el Bautista", "Pedro", "Pablo", "Tomás"], correcta: 0 },
  { frase: "¿Qué quieres que te haga?", opciones: ["Jesús", "Pedro", "Juan", "Pablo"], correcta: 0 },
  { frase: "No se haga mi voluntad, sino la tuya", opciones: ["Jesús", "David", "Daniel", "Pablo"], correcta: 0 },
  { frase: "El Señor peleará por vosotros", opciones: ["Moisés", "Josué", "Gedeón", "David"], correcta: 0 },
  { frase: "¿Hasta cuándo clamaré?", opciones: ["Habacuc", "Jeremías", "Job", "Jonás"], correcta: 0 },
  { frase: "Aquí estoy, envíame", opciones: ["Isaías", "Jeremías", "Ezequiel", "Daniel"], correcta: 0 },
  { frase: "No me avergüenzo del evangelio", opciones: ["Pablo", "Pedro", "Juan", "Santiago"], correcta: 0 },
  { frase: "Jehová dio, Jehová quitó", opciones: ["Job", "David", "Salomón", "Elías"], correcta: 0 },
  { frase: "¿Qué haré con Jesús llamado el Cristo?", opciones: ["Pilato", "Herodes", "Caifás", "Anás"], correcta: 0 },
  { frase: "Mi paz os dejo", opciones: ["Jesús", "Juan", "Pedro", "Pablo"], correcta: 0 },
  { frase: "¿Dónde estás?", opciones: ["Dios", "Adán", "Abraham", "Jacob"], correcta: 0 },
  { frase: "He aquí la sierva del Señor", opciones: ["María", "Ana", "Elisabet", "Marta"], correcta: 0 },
  { frase: "¿Qué es lo que tienes en tu mano?", opciones: ["Dios", "Moisés", "Elías", "Josué"], correcta: 0 },
  { frase: "No temas, cree solamente", opciones: ["Jesús", "Pedro", "Juan", "Pablo"], correcta: 0 },
  { frase: "¿Qué quieres que haga?", opciones: ["Pablo", "Pedro", "Juan", "Tomás"], correcta: 0 },
  { frase: "¿Quién irá por nosotros?", opciones: ["Dios", "Isaías", "Jeremías", "Ezequiel"], correcta: 0 },
  { frase: "He aquí, yo hago cosa nueva", opciones: ["Dios", "Isaías", "Jeremías", "Ezequiel"], correcta: 0 },
  { frase: "¿Por qué me persigues?", opciones: ["Jesús", "Pablo", "Pedro", "Juan"], correcta: 0 },
  { frase: "Mi Dios suplirá todo lo que os falta", opciones: ["Pablo", "Pedro", "Juan", "Santiago"], correcta: 0 },
  { frase: "¿Qué te mandaré hacer?", opciones: ["Dios", "Samuel", "David", "Elías"], correcta: 0 },
  { frase: "No temas, porque yo te redimí", opciones: ["Dios", "Isaías", "Jeremías", "Ezequiel"], correcta: 0 },
  { frase: "¿Qué señal me darás?", opciones: ["Gedeón", "Moisés", "Elías", "Samuel"], correcta: 0 },
  { frase: "¿Qué es lo que has hecho?", opciones: ["Dios", "Adán", "Eva", "Caín"], correcta: 0 },
  { frase: "Mi gracia te basta", opciones: ["Dios", "Jesús", "Pablo", "Pedro"], correcta: 0 },
  { frase: "¿Por qué estás aquí?", opciones: ["Dios", "Elías", "Jonás", "Job"], correcta: 0 },
  { frase: "¿A quién buscáis?", opciones: ["Jesús", "Pedro", "Juan", "Pablo"], correcta: 0 },
  { frase: "No temas, varón muy amado", opciones: ["Gabriel", "Miguel", "Daniel", "Elías"], correcta: 0 },
  { frase: "¿Qué quieres que te dé?", opciones: ["Salomón", "David", "Samuel", "Eliseo"], correcta: 0 },
  { frase: "¿Por qué lloras?", opciones: ["Jesús", "Pedro", "Juan", "Pablo"], correcta: 0 },
  { frase: "¿Qué haces aquí?", opciones: ["Dios", "Elías", "Jonás", "Job"], correcta: 0 },
  { frase: "No temas, yo soy el primero y el último", opciones: ["Jesús", "Juan", "Pablo", "Pedro"], correcta: 0 }
];

export default function QuienLoDijo() {
  const [currentUser, setCurrentUser] = useState(null);
  const [index, setIndex] = useState(0);
  const [puntos, setPuntos] = useState(0);
  const [nivel, setNivel] = useState(1);
  const [seleccion, setSeleccion] = useState(null);
  const [terminado, setTerminado] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.log("Usuario no autenticado");
      }
    };
    loadUser();
  }, []);

  const manejarRespuesta = (i) => {
    setSeleccion(i);

    const esCorrecta = i === frases[index].correcta;
    if (esCorrecta) setPuntos((prev) => prev + 10);

    setTimeout(() => {
      if (index + 1 < frases.length) {
        const nuevoIndex = index + 1;
        setIndex(nuevoIndex);
        setSeleccion(null);

        if ((nuevoIndex + 1) % 3 === 0) setNivel((prev) => prev + 1);
      } else {
        const puntajeFinal = puntos + (esCorrecta ? 10 : 0);
        setPuntos(puntajeFinal);
        setTerminado(true);
        guardarPuntuacion(puntajeFinal);
      }
    }, 900);
  };

  const guardarPuntuacion = async (puntaje) => {
    if (!currentUser) return;

    try {
      await base44.entities.RankingGlobal.create({
        juego: "¿Quién lo dijo?",
        userId: currentUser.id,
        nombre: currentUser.full_name || currentUser.email,
        puntos: puntaje
      });
    } catch (error) {
      console.error("Error guardando puntuación:", error);
    }
  };

  const reiniciar = () => {
    setIndex(0);
    setPuntos(0);
    setNivel(1);
    setSeleccion(null);
    setTerminado(false);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to={createPageUrl('Explore')}>
            <Button className="mb-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold shadow-lg">
              <span className="text-2xl mr-2">👉</span>
              Volver a Juegos
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-yellow-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              ¿Quién lo dijo?
            </h1>
          </div>
          <p className="text-gray-300">Adivina quién dijo estas frases bíblicas</p>
          <GameShareButtons page="QuienLoDijo" title="¿Quién lo dijo?" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-cyan-900/30 border-cyan-500">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-400 mb-1">Nivel</p>
              <p className="text-3xl font-bold text-cyan-400">{nivel}</p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-900/30 border-yellow-500">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-400 mb-1">Puntos</p>
              <p className="text-3xl font-bold text-yellow-400">{puntos}</p>
            </CardContent>
          </Card>
        </div>

        {/* Game Area */}
        {terminado ? (
          <Card className="bg-gradient-to-br from-green-900/30 to-cyan-900/30 border-green-500">
            <CardHeader>
              <div className="flex items-center justify-center gap-3">
                <Trophy className="w-12 h-12 text-yellow-400" />
                <CardTitle className="text-3xl text-center">¡Juego terminado!</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="text-center space-y-6">
              <div>
                <p className="text-gray-400 mb-2">Puntuación final</p>
                <p className="text-5xl font-bold text-yellow-400">{puntos}</p>
              </div>

              <div>
                <p className="text-gray-400 mb-2">Respuestas correctas</p>
                <p className="text-3xl font-bold text-green-400">
                  {puntos / 10} / {frases.length}
                </p>
              </div>

              <Button
                onClick={reiniciar}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-black font-bold px-8 py-6 text-lg"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Jugar de nuevo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gray-800/50 border-cyan-500">
            <CardHeader>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Pregunta {index + 1} de {frases.length}
                </p>
                <CardTitle className="text-2xl font-bold text-white leading-relaxed">
                  "{frases[index].frase}"
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {frases[index].opciones.map((op, i) => (
                  <Button
                    key={i}
                    onClick={() => manejarRespuesta(i)}
                    disabled={seleccion !== null}
                    className={`h-16 text-lg font-semibold transition-all ${
                      seleccion === null
                        ? "bg-gray-700 hover:bg-cyan-600 text-white"
                        : seleccion === i
                        ? i === frases[index].correcta
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {op}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}