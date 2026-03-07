import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";

function maskEmail(email) {
  if (!email || !email.includes("@")) return "usuario";
  const [name, domain] = email.split("@");
  const safeName = name.length <= 3 ? name[0] + "***" : name.slice(0, 3) + "***";
  return `${safeName}@${domain}`;
}

function normalizeText(s) {
  return (s || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function getLocalYMD(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function EscuchaYGanaResultados() {
  const [loading, setLoading] = useState(true);
  const [allRows, setAllRows] = useState([]);

  const [contest, setContest] = useState(null); // {correct_song_name, is_active}
  const [sourceMode, setSourceMode] = useState("contest_date"); // o "submitted_at_fallback"

  const todayLocal = useMemo(() => getLocalYMD(new Date()), []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1) Leer concurso del día (respuesta correcta + activo/inactivo)
        const contests = await base44.entities.EscuchaYGanaContest.filter({
          contest_date: todayLocal,
        });
        const todayContest = contests?.[0] || null;
        setContest(todayContest);

        // 2) Primero intentar por contest_date (lo correcto)
        let entries = await base44.entities.EscuchaYGanaEntry.filter({
          contest_date: todayLocal,
        });

        // 3) Si no hay, fallback por submitted_at (para registros viejos)
        if (!entries || entries.length === 0) {
          const all = await base44.entities.EscuchaYGanaEntry.list();
          const filtered = (all || []).filter((e) => {
            if (!e?.submitted_at) return false;
            return getLocalYMD(new Date(e.submitted_at)) === todayLocal;
          });
          entries = filtered;
          setSourceMode("submitted_at_fallback");
        } else {
          setSourceMode("contest_date");
        }

        const sorted = (entries || [])
          .filter((e) => e?.submitted_at)
          .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));

        setAllRows(sorted);
      } catch (e) {
        console.error(e);
        setAllRows([]);
        setContest(null);
        setSourceMode("contest_date");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [todayLocal]);

  const correctName = contest?.correct_song_name || "";
  const isActive = !!contest?.is_active;
  const correctNormalized = normalizeText(correctName);

  const correctRows = allRows.filter((r) => {
    if (!correctNormalized) return false;
    return normalizeText(r.song_name) === correctNormalized;
  });

  const topWinners = correctRows.slice(0, 3);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Resultados — Escucha y Gana</h1>

      <Card className="p-6 mb-4">
        <p className="text-lg">
          Participaciones de hoy (<b>{todayLocal}</b>) ordenadas por la hora exacta de envío.
        </p>

        <p className="text-sm text-gray-600 mt-2">
          Nota: por privacidad, el correo se muestra parcialmente oculto.
        </p>

        <div className="mt-3 text-sm text-gray-300">
          <div>
            Fuente:{" "}
            <b>
              {sourceMode === "contest_date"
                ? "contest_date (modo normal)"
                : "submitted_at (fallback para registros viejos)"}
            </b>
          </div>

          <div className="mt-1">
            Estado del concurso:{" "}
            <b className={isActive ? "text-green-300" : "text-yellow-300"}>
              {isActive ? "ACTIVO" : "INACTIVO"}
            </b>
          </div>

          <div className="mt-1">
            Respuesta correcta:{" "}
            <b>
              {correctName
                ? isActive
                  ? "🔒 Oculta mientras está activo"
                  : correctName
                : "Aún no configurada"}
            </b>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-3">Ganadores (primero correcto)</h2>

        {loading ? (
          <p>Cargando…</p>
        ) : !correctName ? (
          <p>El admin aún no ha configurado la respuesta correcta del día.</p>
        ) : topWinners.length === 0 ? (
          <p>Aún no hay respuestas correctas registradas hoy.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4">Lugar</th>
                  <th className="py-2 pr-4">Usuario</th>
                  <th className="py-2 pr-4">Hora</th>
                </tr>
              </thead>
              <tbody>
                {topWinners.map((r, idx) => {
                  const time = new Date(r.submitted_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  return (
                    <tr key={r.id || idx} className="border-b">
                      <td className="py-2 pr-4 font-bold">
                        {idx === 0 ? "🥇 1" : idx === 1 ? "🥈 2" : "🥉 3"}
                      </td>
                      <td className="py-2 pr-4">{maskEmail(r.user_email)}</td>
                      <td className="py-2 pr-4">{time}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-3">Todas las participaciones de hoy</h2>

        {loading ? (
          <p>Cargando…</p>
        ) : allRows.length === 0 ? (
          <p>No hay participaciones registradas hoy.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Usuario</th>
                  <th className="py-2 pr-4">Hora</th>
                  <th className="py-2 pr-4">Respuesta</th>
                  <th className="py-2 pr-4">¿Correcta?</th>
                </tr>
              </thead>
              <tbody>
                {allRows.map((r, idx) => {
                  const time = new Date(r.submitted_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });

                  const ok =
                    correctNormalized &&
                    normalizeText(r.song_name) === correctNormalized &&
                    !isActive; // mientras activo, no mostramos si es correcta

                  return (
                    <tr key={r.id || idx} className="border-b">
                      <td className="py-2 pr-4 font-bold">{idx + 1}</td>
                      <td className="py-2 pr-4">{maskEmail(r.user_email)}</td>
                      <td className="py-2 pr-4">{time}</td>
                      <td className="py-2 pr-4">{r.song_name}</td>
                      <td className="py-2 pr-4">{ok ? "✅" : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
