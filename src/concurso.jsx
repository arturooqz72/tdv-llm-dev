import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Concurso() {
  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* TÍTULO PRINCIPAL */}
      <h1 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
        Concursos Team Desvelados LLDM
      </h1>

      <p className="text-lg mb-6 text-center text-gray-300">
        Participa, gana premios y apoya la plataforma.
      </p>

      {/* CARD 1 - REQUISITO */}
      <Card className="p-6 mb-6 bg-[#0f172a]">
        <h2 className="text-2xl font-semibold mb-2 text-cyan-400">
          Requisito principal
        </h2>

        <p className="text-lg mb-4 text-gray-300">
          Solo miembros registrados pueden participar en los concursos.
        </p>

        <Link to="/register">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Registrarme para participar
          </Button>
        </Link>
      </Card>

      {/* CARD 2 - JUEGA Y GANA */}
      <Card className="p-6 mb-6 bg-[#0f172a]">
        <h2 className="text-2xl font-semibold mb-2 text-cyan-400">
          1. Juega y Gana — Trivia Bíblica
        </h2>

        <p className="text-lg mb-4 text-gray-300">
          250 preguntas bíblicas, 3 segundos por pregunta, premios por puntaje.
        </p>

        <Link to="/concurso/juega-y-gana">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Entrar a Juega y Gana
          </Button>
        </Link>
      </Card>

      {/* CARD 3 - ESCUCHA Y GANA */}
      <Card className="p-6 mb-6 bg-[#0f172a]">
        <h2 className="text-2xl font-semibold mb-2 text-cyan-400">
          2. Escucha y Gana — Radio
        </h2>

        <p className="text-lg mb-4 text-gray-300">
          Escucha la canción de invitación de Team Desvelados y sé de los primeros en responder.
        </p>

        <Link to="/concurso/escucha-y-gana">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Entrar a Escucha y Gana
          </Button>
        </Link>
      </Card>

      {/* CARD 4 - GANADORES */}
      <Card className="p-6 bg-[#0f172a]">
        <h2 className="text-2xl font-semibold mb-2 text-cyan-400">
          Ganadores
        </h2>

        <p className="text-lg mb-4 text-gray-300">
          Consulta los ganadores de ambos concursos.
        </p>

        <Link to="/ganadores">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Ver Ganadores
          </Button>
        </Link>
      </Card>

    </div>
  );
}
