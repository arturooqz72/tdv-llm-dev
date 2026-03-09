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

export default function AdminEscuchaYGana() {
  const { user, isLoadingAuth } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [recordId, setRecordId] = useState(null);
  const [correctSongName, setCorrectSongName] = useState("");
  const [isActive, setIsActive] = useState(false);

  const [status, setStatus] = useState({ type: "", message: "" });

  const todayLocal = useMemo(() => getTodayLocal(), []);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const loadContest = async () => {
      if (!user || !isAdmin) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("escucha_y_gana_contests")
          .select("*")
          .eq("contest_date", todayLocal)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error(error);
          setStatus({
            type: "error",
            message: "No se pudo cargar la configuración.",
          });
        }

        if (data) {
          setRecordId(data.id);
          setCorrectSongName(data.correct_song_name || "");
          setIsActive(data.is_active || false);
        }
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
    };

    if (!isLoadingAuth) {
      loadContest();
    }
  }, [user, isAdmin, todayLocal, isLoadingAuth]);

  const save = async (nextActive) => {
    setStatus({ type: "", message: "" });

    if (!isAdmin) {
      setStatus({ type: "error", message: "Acceso denegado." });
      return;
    }

    const cleaned = cleanText(correctSongName);

    if (!cleaned) {
      setStatus({
        type: "error",
        message: "Escribe el nombre correcto del canto.",
      });
      return;
    }

    setSaving(true);

    try {
      if (recordId) {
        const { error } = await supabase
          .from("escucha_y_gana_contests")
          .update({
            correct_song_name: cleaned,
            is_active: nextActive,
          })
          .eq("id", recordId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("escucha_y_gana_contests")
          .insert({
            contest_date: todayLocal,
            correct_song_name: cleaned,
            is_active: nextActive,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        setRecordId(data.id);
      }

      setIsActive(nextActive);

      setStatus({
        type: "ok",
        message: nextActive
          ? "✅ Concurso ACTIVADO."
          : "✅ Concurso DESACTIVADO.",
      });
    } catch (e) {
      console.error(e);
      setStatus({
        type: "error",
        message: "❌ Error guardando configuración.",
      });
    }

    setSaving(false);
  };

  if (isLoadingAuth || loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-6">
          <p>Cargando configuración...</p>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-6">
          <p>Debes iniciar sesión.</p>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-6">
          <p>Acceso solo para administradores.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">
        Admin — Escucha y Gana
      </h1>

      <Card className="p-6 mb-4">
        <p>
          Fecha del concurso: <b>{todayLocal}</b>
        </p>
        <p>
          Estado actual:{" "}
          <b style={{ color: isActive ? "green" : "orange" }}>
            {isActive ? "ACTIVO" : "INACTIVO"}
          </b>
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">
          Respuesta correcta del día
        </h2>

        <input
          type="text"
          value={correctSongName}
          onChange={(e) => setCorrectSongName(e.target.value)}
          placeholder="Ej: Tiempo de Participar"
          className="w-full p-2 border rounded mb-4"
        />

        {status.message && (
          <div
            className="mb-4 p-3 rounded"
            style={{
              background: status.type === "ok" ? "#e6ffed" : "#ffecec",
            }}
          >
            {status.message}
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => save(true)}
            disabled={saving}
            className="bg-green-600 text-white"
          >
            {saving ? "Guardando..." : "Guardar y ACTIVAR"}
          </Button>

          <Button
            onClick={() => save(false)}
            disabled={saving}
            className="bg-yellow-500 text-black"
          >
            {saving ? "Guardando..." : "Guardar y DESACTIVAR"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
