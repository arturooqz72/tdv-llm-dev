import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Download,
  Check,
  X,
  Play,
  Trash2,
  Filter
} from 'lucide-react';

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

export default function AdminSaludos() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState({});
  const [allGreetings, setAllGreetings] = useState([]);

  useEffect(() => {
    const user = readStoredUser();
    setCurrentUser(user);

    if (!user || user.role !== 'admin') {
      window.location.href = '/';
      return;
    }

    setLoading(false);
  }, []);

  const handleStatusChange = async (greeting, newStatus) => {
    setAllGreetings((prev) =>
      prev.map((item) =>
        item.id === greeting.id
          ? {
              ...item,
              status: newStatus,
              admin_note: adminNotes[greeting.id] || item.admin_note || '',
              ...(newStatus === 'played' ? { played_at: new Date().toISOString() } : {})
            }
          : item
      )
    );

    setAdminNotes((prev) => ({ ...prev, [greeting.id]: '' }));
  };

  const handleDownload = (audioUrl, userName) => {
    if (!audioUrl) return;

    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `saludo-${userName || 'usuario'}-${Date.now()}.webm`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (greetingId) => {
    setAllGreetings((prev) => prev.filter((item) => item.id !== greetingId));
  };

  const filteredGreetings = useMemo(() => {
    return allGreetings.filter((greeting) => {
      if (filter === 'all') return true;
      return greeting.status === filter;
    });
  }, [allGreetings, filter]);

  const countByStatus = (status) => {
    return allGreetings.filter((g) => g.status === status).length;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pendiente', color: 'bg-yellow-500' },
      approved: { text: 'Aprobado', color: 'bg-green-500' },
      rejected: { text: 'Rechazado', color: 'bg-red-500' },
      played: { text: 'Reproducido', color: 'bg-blue-500' }
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400">Acceso restringido a administradores</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        Administrar Saludos
      </h1>

      <Card className="bg-gray-900 border-cyan-500/30 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-cyan-400" />

            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              className={filter === 'all' ? 'bg-cyan-500' : ''}
            >
              Todos ({allGreetings.length})
            </Button>

            <Button
              onClick={() => setFilter('pending')}
              variant={filter === 'pending' ? 'default' : 'outline'}
              className={filter === 'pending' ? 'bg-yellow-500' : ''}
            >
              Pendientes ({countByStatus('pending')})
            </Button>

            <Button
              onClick={() => setFilter('approved')}
              variant={filter === 'approved' ? 'default' : 'outline'}
              className={filter === 'approved' ? 'bg-green-500' : ''}
            >
              Aprobados ({countByStatus('approved')})
            </Button>

            <Button
              onClick={() => setFilter('played')}
              variant={filter === 'played' ? 'default' : 'outline'}
              className={filter === 'played' ? 'bg-blue-500' : ''}
            >
              Reproducidos ({countByStatus('played')})
            </Button>

            <Button
              onClick={() => setFilter('rejected')}
              variant={filter === 'rejected' ? 'default' : 'outline'}
              className={filter === 'rejected' ? 'bg-red-500' : ''}
            >
              Rechazados ({countByStatus('rejected')})
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredGreetings.length === 0 ? (
          <Card className="bg-gray-900 border-cyan-500/30">
            <CardContent className="py-12">
              <p className="text-gray-400 text-center">
                No hay saludos en esta categoría. Esta sección quedó temporalmente desconectada mientras terminamos de retirar la dependencia anterior.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredGreetings.map((greeting) => (
            <Card key={greeting.id} className="bg-gray-900 border-cyan-500/30">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">
                        {greeting.user_name}
                      </h3>
                      <p className="text-gray-400 text-sm">{greeting.user_email}</p>

                      {greeting.message && (
                        <p className="text-cyan-400 mt-2">{greeting.message}</p>
                      )}

                      <p className="text-gray-500 text-xs mt-1">
                        Enviado: {greeting.created_date ? new Date(greeting.created_date).toLocaleString('es-MX') : 'Sin fecha'}
                      </p>

                      {greeting.played_at && (
                        <p className="text-blue-400 text-xs">
                          Reproducido: {new Date(greeting.played_at).toLocaleString('es-MX')}
                        </p>
                      )}
                    </div>

                    {getStatusBadge(greeting.status)}
                  </div>

                  <audio
                    src={greeting.audio_url}
                    controls
                    className="w-full"
                  />

                  <Textarea
                    placeholder="Agregar nota administrativa (opcional)"
                    value={adminNotes[greeting.id] || greeting.admin_note || ''}
                    onChange={(e) =>
                      setAdminNotes((prev) => ({
                        ...prev,
                        [greeting.id]: e.target.value
                      }))
                    }
                    className="bg-gray-800 border-cyan-500/30 text-white"
                    rows={2}
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleDownload(greeting.audio_url, greeting.user_name)}
                      className="bg-cyan-500 hover:bg-cyan-600"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>

                    {greeting.status !== 'approved' && (
                      <Button
                        onClick={() => handleStatusChange(greeting, 'approved')}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Aprobar
                      </Button>
                    )}

                    {greeting.status !== 'rejected' && (
                      <Button
                        onClick={() => handleStatusChange(greeting, 'rejected')}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Rechazar
                      </Button>
                    )}

                    {greeting.status === 'approved' && greeting.status !== 'played' && (
                      <Button
                        onClick={() => handleStatusChange(greeting, 'played')}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Marcar como Reproducido
                      </Button>
                    )}

                    <Button
                      onClick={() => {
                        if (window.confirm('¿Eliminar este saludo?')) {
                          handleDelete(greeting.id);
                        }
                      }}
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>

                  {greeting.admin_note && (
                    <div className="bg-gray-800 p-3 rounded border-l-4 border-yellow-500">
                      <p className="text-yellow-400 text-sm font-semibold">Nota Admin:</p>
                      <p className="text-gray-300 text-sm">{greeting.admin_note}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
