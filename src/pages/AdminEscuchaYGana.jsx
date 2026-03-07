import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

function getTodayLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function cleanText(s) {
  return (s || "").trim().replace(/\s+/g, " ");
}

export default function AdminEscuchaYGana() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordId, setRecordId] = useState(null);
  const [correctSongName, setCorrectSongName] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const todayLocal = useMemo(() => getTodayLocal(), []);
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    const loadUserAndContest = async () => {
      setLoading(true);
      setStatus({ type: "", message: "" });

      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (user?.role !== "admin") {
          setLoading(false);
          return;
        }

        const contests = await base44.entities.EscuchaYGanaContest.filter({
          contest_date: todayLocal,
        });

        const todayContest = contests?.[0] || null;

        if (todayContest) {
          setRecordId(todayContest.id);
          setCorrectSongName(todayContest.correct_song_name || "");
          setIsActive(!!todayContest.is_active);
        } else {
          setRecordId(null);
          setCorrectSongName("");
          setIsActive(false);
        }
      } catch (e) {
        console.error(e);
        setCurrentUser(null);
        setStatus({
          type: "error",
          message: "No se pudo cargar la configuración. Intenta recargar.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserAndContest();
  }, [todayLocal]);

  const save = async (nextIsActive) => {
    setStatus({ type: "", message: "" });

    if (!isAdmin) {
      setStatus({ type: "error", message: "Acceso denegado. Solo admin." });
      return;
    }

    const cleaned = cleanText(correctSongName);

    if (!cleaned) {
      setStatus({
        type: "error",
        message: "Escribe el nombre correcto del canto (ej: Tiempo de Participar).",
      });
      return;
    }

    try {
      setSaving(true);

      if (recordId) {
        await base44.entities.EscuchaYGanaContest.update(recordId, {
          contest_date: todayLocal,
          correct_song_name: cleaned,
          is_active: !!nextIsActive,
        });
      } else {
        const created = await base44.entities.EscuchaYGanaContest.create({
          contest_date: todayLocal,
          correct_song_name: cleaned,
          is_active: !!nextIsActive,
        });

        setRecordId(created?.id || null);
      }

      setIsActive(!!nextIsActive);

      setStatus({
        type: "ok",
        message: nextIsActive
          ? "✅ Concurso ACTIVADO. Respuesta del día guardada."
          : "✅ Concurso DESACTIVADO. Respuesta del día guardada.",
      });
    } catch (e) {
      console.error(e);
      setStatus({
        type: "error",
        message: "❌ No se pudo guardar. Intenta de nuevo.",
      });
    } finally {
      setSaving(false);
    }
  };

  const activate = () => save(true);
  const deactivate = () => save(false);

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-6 bg-gray-800 border-cyan-500">
          <p className="text-white">Cargando configuración…</p>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-6 bg-gray-800 border-cyan-500">
          <p className="mb-3 text-white">Debes iniciar sesión para acceder.</p>
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-cyan-500 hover:bg-cyan-600 text-black"
          >
            Iniciar sesión
          </Button>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-6 bg-gray-800 border-red-500">
          <p className="text-red-300 font-semibold">Acceso denegado.</p>
          <p className="text-sm text-gray-300 mt-2">Esta página es solo para administradores.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center text-white">Admin — Escucha y Gana</h1>

      <Card className="p-6 mb-4 bg-gray-800 border-cyan-500">
        <div className="flex flex-col gap-2">
          <div className="text-sm text-gray-300">
            Fecha del concurso (local): <b className="text-cyan-400">{todayLocal}</b>
          </div>
          <div className="text-sm text-gray-300">
            Estado actual:{" "}
            <b className={isActive ? "text-green-400" : "text-yellow-400"}>
              {isActive ? "ACTIVO" : "INACTIVO"}
            </b>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800 border-cyan-500">
        <h2 className="text-xl font-semibold mb-3 text-white">Respuesta correcta del día</h2>

        <input
          type="text"
          value={correctSongName}
          onChange={(e) => setCorrectSongName(e.target.value)}
          placeholder='Ej: "Tiempo de Participar"'
          className="w-full p-2 border border-gray-600 rounded mb-4 bg-gray-900 text-white"
          disabled={saving}
        />

        {status.message && (
          <div
            className={`mb-4 p-3 rounded text-sm ${
              status.type === "ok"
                ? "bg-green-900/50 border border-green-500 text-green-200"
                : "bg-red-900/50 border border-red-500 text-red-200"
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={activate}
            disabled={saving}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? "Guardando…" : "Guardar y ACTIVAR"}
          </Button>

          <Button
            onClick={deactivate}
            disabled={saving}
            className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-black"
          >
            {saving ? "Guardando…" : "Guardar y DESACTIVAR"}
          </Button>
        </div>

        <p className="text-sm text-gray-400 mt-4">
          Consejo: escribe el nombre exactamente como quieres que lo pongan. (El sistema de
          resultados puede comparar en minúsculas para evitar errores por mayúsculas.)
        </p>
      </Card>
    </div>
  );
}