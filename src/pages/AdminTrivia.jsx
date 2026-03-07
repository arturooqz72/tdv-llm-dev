import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export default function AdminTrivia() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [concursoActivo, setConcursoActivo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        if (user?.role === 'admin') {
          // Cargar estado del concurso (puedes guardarlo en User o crear una entidad)
          setConcursoActivo(user.trivia_concurso_activo || false);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const toggleConcurso = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;

    setSaving(true);
    try {
      const nuevoEstado = !concursoActivo;
      await base44.auth.updateMe({ trivia_concurso_activo: nuevoEstado });
      setConcursoActivo(nuevoEstado);
    } catch (error) {
      console.error(error);
      alert('Error al cambiar el estado del concurso');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
            <strong className="text-white">Nota:</strong> Cuando el concurso está activo, los usuarios pueden
            participar en la Trivia Bíblica y sus puntajes se registrarán para el ranking.
          </p>
        </div>
      </Card>
    </div>
  );
}