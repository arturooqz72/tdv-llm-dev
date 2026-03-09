import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

function maskEmail(email) {
  if (!email || !email.includes("@")) return "usuario";
  const [name, domain] = email.split("@");
  const safeName = name.length <= 3 ? `${name[0]}***` : `${name.slice(0, 3)}***`;
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
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [allRows, setAllRows] = useState([]);
  const [contest, setContest] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });

  const todayLocal = useMemo(() => getLocalYMD(new Date()), []);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setStatus({ type: "", message: "" });

      try {
        const { data: contestData, error: contestError } = await supabase
          .from("escucha_y_gana_contests")
          .select("*")
          .eq("contest_date", todayLocal)
          .maybeSingle();

        if (contestError) {
          throw contestError;
        }

        setContest(contestData || null);

        const { data: entriesData, error: entriesError } = await supabase
          .from("escucha_y_gana_entries")
          .select("*")
          .eq("contest_date", todayLocal)
          .order("submitted_at", { ascending: true });

        if (entriesError) {
          throw entriesError;
        }

        setAllRows(entriesData || []);
      } catch (e) {
        console.error(e);
        setContest(null);
        setAllRows([]);
        setStatus({
          type: "error",
          message: "No se pudieron cargar los resultados.",
        });
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
      <h1 className="text-3xl font-bold mb-4 text-center">
        Resultados — Escucha y Gana
      </h1>

      <Card className="p-6 mb-4">
        <p className="text-lg">
          Participaciones de hoy (<b>{todayLocal}</b>) ordenadas por la hora exacta de envío.
        </p>

        <p className="text-sm text-gray-600 mt-2">
          Nota: por privacidad, el correo se muestra parcialmente oculto.
        </p>

        <div className="mt-3 text-sm text-gray-700">
          <div>
            Estado del concurso:{" "}
            <b className={isActive ? "text-green-600" : "text-yellow-600"}>
              {isActive ? "ACTIVO" : "INACTIVO"}
            </b>
          </div>

          <div className="mt-1">
            Respuesta correcta:{" "}
            <b>
              {correctName
                ? isActive && !isAdmin
                  ? "🔒 Oculta mientras está activo"
                  : correctName
                : "Aún no configurada"}
            </b>
          </div>
        </div>

        {status.message && (
          <div
            className="mt-4 p-3 rounded"
            style={{
              background: status.type === "error" ? "#ffecec" : "#e6ffed",
            }}
          >
            {status.message}
          </div>
        )}
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-3">Ganadores (primero correcto)</h2>

        {loading ? (
          <p>Cargando...</p>
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
          <p>Cargando...</p>
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

                  const isCorrect =
                    correctNormalized &&
                    normalizeText(r.song_name) === correctNormalized;

                  const showCorrect = !isActive || isAdmin;

                  return (
                    <tr key={r.id || idx} className="border-b">
                      <td className="py-2 pr-4 font-bold">{idx + 1}</td>
                      <td className="py-2 pr-4">{maskEmail(r.user_email)}</td>
                      <td className="py-2 pr-4">{time}</td>
                      <td className="py-2 pr-4">{r.song_name}</td>
                      <td className="py-2 pr-4">
                        {showCorrect ? (isCorrect ? "✅" : "—") : "🔒"}
                      </td>
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
