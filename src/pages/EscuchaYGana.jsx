import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export default function EscuchaYGana() {
  const { user, isLoadingAuth } = useAuth();

  const [songName, setSongName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmittedToday, setAlreadySubmittedToday] = useState(false);
  const [contestActive, setContestActive] = useState(false);

  const [status, setStatus] = useState({ type: "", message: "" });

  const todayLocal = useMemo(() => getTodayLocal(), []);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const loadContest = async () => {
      const { data } = await supabase
        .from("escucha_y_gana_contests")
        .select("is_active")
        .eq("contest_date", todayLocal)
        .single();

      if (data) {
        setContestActive(data.is_active);
      }
    };

    loadContest();
  }, [todayLocal]);

  useEffect(() => {
    const checkToday = async () => {
      if (!user || isAdmin) return;

      const { data } = await supabase
        .from("escucha_y_gana_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("contest_date", todayLocal);

      if (data && data.length > 0) {
        setAlreadySubmittedToday(true);
      }
    };

    if (!isLoadingAuth) {
      checkToday();
    }
  }, [user, todayLocal, isAdmin, isLoadingAuth]);

  const onSubmit = async () => {
    setStatus({ type: "", message: "" });

    if (!user) {
      setStatus({
        type: "error",
        message: "Debes iniciar sesión para participar.",
      });
      return;
    }

    if (!contestActive) {
      setStatus({
        type: "warning",
        message: "El concurso no está activo en este momento.",
      });
      return;
    }

    if (!isAdmin && alreadySubmittedToday) {
      setStatus({
        type: "warning",
        message: "Ya participaste hoy.",
      });
      return;
    }

    const cleaned = cleanText(songName);

    if (!cleaned) {
      setStatus({
        type: "error",
        message: "Escribe el nombre del canto.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("escucha_y_gana_entries")
        .insert({
          user_id: user.id,
          user_email: user.email,
          song_name: cleaned,
          contest_date: todayLocal,
        });

      if (error) throw error;

      if (!isAdmin) {
        setAlreadySubmittedToday(true);
      }

      setSongName("");

      setStatus({
        type: "ok",
        message: isAdmin
          ? "Respuesta registrada (modo admin)."
          : "¡Respuesta enviada correctamente!",
      });
    } catch (e) {
      console.error(e);

      setStatus({
        type: "error",
        message: "No se pudo enviar la respuesta.",
      });
    }

    setSubmitting(false);
  };

  const inputDisabled =
    submitting ||
    !contestActive ||
    (!isAdmin && alreadySubmittedToday) ||
    !user;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">
        Escucha y Gana
      </h1>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Dinámica</h2>

        <p className="mb-4">
          Cuando escuches la canción del concurso en la radio,
          entra aquí y escribe el nombre correcto mientras esté sonando.
        </p>

        <h2 className="text-xl font-semibold mb-2">Reglas</h2>

        <ul className="list-disc ml-6">
          <li>Solo miembros registrados pueden participar.</li>
          <li>Solo una participación por día.</li>
          <li>Debes enviar la respuesta mientras suena la canción.</li>
        </ul>

        {isAdmin && (
          <p className="mt-3 text-sm text-blue-500">
            Modo administrador activo (puedes probar varias veces).
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Escribe el nombre del canto
        </h2>

        {!contestActive && (
          <p className="mb-3 text-orange-500">
            El concurso aún no está activo.
          </p>
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
            className="mb-4 p-3 rounded"
            style={{
              background:
                status.type === "ok"
                  ? "#e6ffed"
                  : status.type === "warning"
                  ? "#fff4e5"
                  : "#ffecec",
            }}
          >
            {status.message}
          </div>
        )}

        <Button
          onClick={onSubmit}
          disabled={inputDisabled}
          className="bg-blue-600 text-white w-full"
        >
          {submitting
            ? "Enviando..."
            : !user
            ? "Inicia sesión para participar"
            : !contestActive
            ? "Concurso no activo"
            : alreadySubmittedToday && !isAdmin
            ? "Ya participaste hoy"
            : "Enviar respuesta"}
        </Button>
      </Card>
    </div>
  );
}
