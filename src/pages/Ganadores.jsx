import { Card } from "@/components/ui/card";

export default function Ganadores() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Ganadores — Team Desvelados LLDM
      </h1>

      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-2">🥇 Primer Lugar — Oro</h2>
        <p className="text-lg">Nombre: (pendiente)</p>
        <p className="text-lg">Puntos: (pendiente)</p>
        <p className="text-lg">Premio: (pendiente)</p>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-2">🥈 Segundo Lugar — Plata</h2>
        <p className="text-lg">Nombre: (pendiente)</p>
        <p className="text-lg">Puntos: (pendiente)</p>
        <p className="text-lg">Premio: (pendiente)</p>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-2">🥉 Tercer Lugar — Bronce</h2>
        <p className="text-lg">Nombre: (pendiente)</p>
        <p className="text-lg">Puntos: (pendiente)</p>
        <p className="text-lg">Premio: (pendiente)</p>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-2">🎖 Menciones Honoríficas</h2>
        <p className="text-lg">Lista de participantes con 50–99 puntos.</p>
      </Card>
    </div>
  );
}
