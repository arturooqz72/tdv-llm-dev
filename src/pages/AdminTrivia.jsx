import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const TRIVIA_ADMIN_STORAGE_KEY = 'tdv_trivia_admin_config';

function readTriviaConfig() {
  try {
    if (typeof window === 'undefined') return { trivia_concurso_activo: false };

    const raw = localStorage.getItem(TRIVIA_ADMIN_STORAGE_KEY);
    if (!raw) return { trivia_concurso_activo: false };

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { trivia_concurso_activo: false };
    }

    return {
      trivia_concurso_activo: parsed.trivia_concurso_activo === true,
    };
  } catch {
    return { trivia_concurso_activo: false };
  }
}

function saveTriviaConfig(config) {
  try {
    if (typeof window === 'undefined') return;

    localStorage.setItem(
      TRIVIA_ADMIN_STORAGE_KEY,
      JSON.stringify({
        trivia_concurso_activo: config.trivia_concurso_activo === true,
      })
    );
  } catch (error) {
    console.error('Error guardando configuración de trivia:', error);
  }
}

export default function AdminTrivia() {
  const { user: currentUser, loading } = useAuth();
  const [concursoActivo, setConcursoActivo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    const config = readTriviaConfig();
    setConcursoActivo(config.trivia_concurso_activo);
    setConfigLoaded(true);
  }, []);

  const toggleConcurso = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;

    setSaving(true);
    try {
      const nuevoEstado = !concursoActivo;
      saveTriviaConfig({ trivia_concurso_activo: nuevoEstado });
      setConcursoActivo(nuevoEstado);
    } catch (error) {
      console.error(error);
      alert('Error al cambiar el estado del concurso');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !configLoaded) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-6 bg-gray-800 border-cyan-500">
          <p className="text-white">Cargando...</p>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-6 bg-gray-800 border-cyan-500">
          <p className="mb-3 text-white">Debes iniciar sesión para acceder.</p>
        </Card>
      </div>
    );
  }

  if (currentUser.role !== 'admin') {
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
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-red-400" />
        <h1 className="text-3xl font-bold text-white">Panel Admin — Trivia</h1>
      </div>

      <Card className="p-6 bg-gray-800 border-cyan-500">
        <h2 className="text-xl font-semibold mb-4 text-white">Control del Concurso</h2>

        <div className="mb-6">
          <p className="mb-4 text-gray-300">
            Estado actual:{' '}
            <span className={concursoActivo ? 'text-green-400' : 'text-red-400'} style={{ fontWeight: 'bold' }}>
              {concursoActivo ? 'Concurso ACTIVO' : 'Concurso DESACTIVADO'}
            </span>
          </p>

          <Button
            onClick={toggleConcurso}
            disabled={saving}
            className={`${
              concursoActivo
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {saving ? 'Guardando...' : concursoActivo ? 'Desactivar Concurso' : 'Activar Concurso'}
          </Button>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">
            <strong className="text-white">Nota:</strong> Este panel ya usa la sesión actual con useAuth().
            El estado del concurso quedó guardándose temporalmente en almacenamiento local del navegador
            mientras terminamos de retirar dependencias antiguas.
          </p>
        </div>
      </Card>
    </div>
  );
}
