import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function EscuchaYGana() {
  const [currentUser, setCurrentUser] = useState(null);
  const [songName, setSongName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [alreadySubmittedToday, setAlreadySubmittedToday] = useState(false);

  const isAdmin = !!currentUser?.role && currentUser.role === "admin";

  const todayLocal = useMemo(() => {
    const d = new Date(); // hora local del navegador
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`; // YYYY-MM-DD local
  }, []);

  const isSameLocalDay = (isoString) => {
    if (!isoString) return false;
    const d = new Date(isoString);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}` === todayLocal;
  };

  // ✅ Cargar usuario
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      }
    };
    loadUser();
  }, []);

  // ✅ Verificar si ya participó HOY (solo usuarios normales; admin no se bloquea)
  useEffect(() => {
    const checkToday = async () => {
      setAlreadySubmittedToday(false);

      if (!currentUser?.email) return;

      // Admin puede participar múltiples veces (modo verificación)
      if (isAdmin) return;

      try {
        const entries = await base44.entities.EscuchaYGanaEntry.filter({
          user_email: currentUser.email,
        });

        const hasToday = (entries || []).some((e) => {
          if (e.contest_date && e.contest_date === todayLocal) return true;
          return isSameLocalDay(e.submitted_at);
        });

        if (hasToday) {
          setAlreadySubmittedToday(true);
          setStatus({
            type: "warning",
            message: "⚠️ Ya participaste hoy. Vuelve a intentarlo mañana.",
          });
        }
      } catch (e) {
        console.error(e);
      }
    };

    checkToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.email, todayLocal, isAdmin]);

  const onSubmit = async () => {
    setStatus({ type: "", message: "" });

    if (!currentUser) {
      setStatus({ type: "error", message: "Debes iniciar sesión para participar." });
      return;
    }

    // Solo usuarios normales se bloquean por día
    if (!isAdmin && alreadySubmittedToday) {
      setStatus({
        type: "warning",
        message: "⚠️ Ya participaste hoy. Vuelve a intentarlo mañana.",
      });
      return;
    }

    const cleaned = songName.trim().replace(/\s+/g, " ");
    if (!cleaned) {
      setStatus({ type: "error", message: "Escribe el nombre del canto." });
      return;
    }

    try {
      setSubmitting(true);

      // ✅ Verificación final anti-doble (solo usuarios normales)
      if (!isAdmin) {
        const entries = await base44.entities.EscuchaYGanaEntry.filter({
          user_email: currentUser.email,
        });

        const hasToday = (entries || []).some((e) => {
          if (e.contest_date && e.contest_date === todayLocal) return true;
          return isSameLocalDay(e.submitted_at);
        });

        if (hasToday) {
          setAlreadySubmittedToday(true);
          setStatus({
            type: "warning",
            message: "⚠️ Ya participaste hoy. Vuelve a intentarlo mañana.",
          });
          return;
        }
      }

      // ✅ Guardar participación (admin también guarda; solo que no se bloquea)
      await base44.entities.EscuchaYGanaEntry.create({
        user_email: currentUser.email,
        song_name: cleaned,
        submitted_at: new Date().toISOString(),
        contest_date: todayLocal,
      });

      // Si no es admin, marcar como ya participó hoy
      if (!isAdmin) setAlreadySubmittedToday(true);

      setStatus({
        type: "ok",
        message: isAdmin
          ? "✅ (ADMIN) Respuesta registrada para verificación."
          : "✅ Tu respuesta fue registrada. ¡Gracias por participar!",
      });

      setSongName("");
    } catch (e) {
      console.error(e);
      setStatus({
        type: "error",
        message:
          "❌ No se pudo enviar tu respuesta. Intenta de nuevo. (Si persiste, recarga la página.)",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputDisabled = submitting || !currentUser || (!isAdmin && alreadySubmittedToday);
  const buttonDisabled = submitting || !currentUser || (!isAdmin && alreadySubmittedToday);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
        Escucha y Gana — Radio
      </h1>

      <Card className="p-6 mb-6 bg-[#0f172a]">
        <h2 className="text-2xl font-semibold mb-2 text-cyan-400">Dinámica</h2>
        <p className="text-lg mb-4 text-gray-300">
          En cualquier momento puede sonar la canción del concurso. Cuando la escuches, entra aquí
          y escribe el nombre exacto mientras esté sonando.
        </p>

        <h2 className="text-2xl font-semibold mb-2 text-cyan-400">Reglas</h2>
        <ul className="text-lg mb-2 list-disc ml-6 text-gray-300">
          <li>Solo miembros registrados pueden participar.</li>
          <li>Solo una participación por día.</li>
          <li>La respuesta debe enviarse mientras la canción esté sonando.</li>
          <li>El sistema registra la hora exacta.</li>
        </ul>

        <p className="text-sm text-gray-400 mt-3">
          ⚠️ Solo se aceptan respuestas enviadas mientras la canción esté sonando.
        </p>

        {isAdmin && (
          <p className="text-sm text-cyan-300 mt-3">
            ✅ Modo verificación: como ADMIN puedes enviar varias veces para probar.
          </p>
        )}
      </Card>

      <Card className="p-6 bg-[#0f172a]">
        <h2 className="text-xl font-semibold mb-4 text-cyan-400">Enviar respuesta</h2>

        {!currentUser && (
          <div className="mb-4 p-3 rounded border border-yellow-300 bg-yellow-50 text-sm text-black">
            Para participar, inicia sesión y conviértete en miembro.
            <div className="mt-2">
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                className="bg-cyan-500 hover:bg-cyan-600 text-black"
              >
                Iniciar sesión
              </Button>
            </div>
          </div>
        )}

        <input
          type="text"
          value={songName}
          onChange={(e) => setSongName(e.target.value)}
          placeholder="Nombre del canto"
          className="w-full p-2 border rounded mb-4"
          disabled={inputDisabled}
        />

        {status.message && (
          <div
            className={`mb-4 p-3 rounded text-sm ${
              status.type === "ok"
                ? "bg-green-50 border border-green-200 text-green-800"
                : status.type === "warning"
                ? "bg-yellow-50 border border-yellow-200 text-yellow-900"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {status.message}
          </div>
        )}

        <Button
          onClick={onSubmit}
          disabled={buttonDisabled}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full"
        >
          {submitting
            ? "Enviando..."
            : !currentUser
            ? "Inicia sesión para participar"
            : !isAdmin && alreadySubmittedToday
            ? "Ya participaste hoy"
            : "Enviar respuesta"}
        </Button>
      </Card>
    </div>
  );
}