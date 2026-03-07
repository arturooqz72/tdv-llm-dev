import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function JuegaYGana() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
  Juega y Gana — Trivia Bíblica
</h1>


      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-2">Dinámica</h2>
        <p className="text-lg mb-4">
          250 preguntas bíblicas, 3 segundos por pregunta, +1 correcta, -1 incorrecta.
        </p>

        <h2 className="text-2xl font-semibold mb-2">Premios</h2>
        <ul className="text-lg mb-4 list-disc ml-6">
          <li>🥇 Oro: 200+ puntos</li>
          <li>🥈 Plata: 150–199 puntos</li>
          <li>🥉 Bronce: 100–149 puntos</li>
          <li>🎖 Mención: 50–99 puntos</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-2">Reglas</h2>
        <ul className="text-lg mb-4 list-disc ml-6">
          <li>Solo miembros registrados pueden participar.</li>
          <li>No se puede pausar.</li>
          <li>No se puede regresar preguntas.</li>
          <li>Solo la primera partida cuenta para el concurso.</li>
          <li>Puntos negativos no bajan de 0.</li>
        </ul>
      </Card>

      <Link to={createPageUrl("TriviaBiblica")}>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
          Jugar Trivia Bíblica
        </Button>
      </Link>
    </div>
  );
}
