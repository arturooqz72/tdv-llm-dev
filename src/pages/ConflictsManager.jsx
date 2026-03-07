import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const USER_STORAGE_KEY = 'tdv_current_user';

function readStoredUser() {
  try {
    if (typeof window === 'undefined') return null;

    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    return parsed;
  } catch {
    return null;
  }
}

export default function ConflictsManager() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [conflicts] = useState([]);
  const [allPrograms] = useState([]);

  useEffect(() => {
    const user = readStoredUser();
    setCurrentUser(user);

    if (!user || user?.role !== 'admin') {
      window.location.href = '/';
      return;
    }

    setIsLoading(false);
  }, []);

  if (!currentUser || isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-white">Gestión de Conflictos</h1>
          </div>
          <p className="text-gray-400">Administra conflictos de programación detectados</p>
        </div>

        {conflicts.length === 0 ? (
          <Card className="bg-gray-800 border-yellow-600">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No hay conflictos pendientes
              </h3>
              <p className="text-gray-400">
                Esta sección quedó temporalmente desconectada mientras terminamos de retirar dependencias antiguas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {conflicts.map((conflict) => {
              const prog1 = allPrograms.find((p) => p.id === conflict.program1_id);
              const prog2 = allPrograms.find((p) => p.id === conflict.program2_id);

              if (!prog1 || !prog2) return null;

              return (
                <Card key={conflict.id} className="bg-gray-800 border-2 border-red-600">
                  <CardHeader>
                    <CardTitle className="text-white">Conflicto de Programación</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300">
                      Vista temporal de conflictos.
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
