import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Trash2, Edit, Clock, Search, ShieldAlert, Music, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import EditProgramModal from '@/components/radio/EditProgramModal';
import BulkProgramUploader from '@/components/radio/BulkProgramUploader';

export default function AllPrograms() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [search, setSearch] = useState('');
  const [editingProgram, setEditingProgram] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        // Solo admin o usuarios con permiso
        if (user.role === 'admin' || user.can_manage_programs) {
          setAuthorized(true);
        }
      } catch {
        // No autenticado
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const { data: allPrograms = [], isLoading, refetch } = useQuery({
    queryKey: ['all-programs-admin'],
    queryFn: () => base44.entities.RadioProgram.list('-created_date', 200),
    enabled: authorized,
  });

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este programa?')) return;
    await base44.entities.RadioProgram.delete(id);
    refetch();
  };

  const filtered = allPrograms.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.created_by?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Card className="bg-gray-900 border-red-500 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-gray-400">
              Solo administradores y usuarios autorizados pueden acceder a esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Music className="w-7 h-7 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">Todos los Programas</h1>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                {allPrograms.length}
              </Badge>
            </div>
            <Button
              onClick={() => setShowUploader(!showUploader)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {showUploader ? 'Ocultar Subida' : `Subir Programas${pendingFiles.length > 0 ? ` (${pendingFiles.length})` : ''}`}
            </Button>
          </div>

          {/* Bulk Uploader */}
          {showUploader && (
            <div className="mb-6">
              <BulkProgramUploader 
                currentUser={currentUser}
                files={pendingFiles}
                setFiles={setPendingFiles}
                onSuccess={() => {
                  refetch();
                  setPendingFiles([]);
                  setShowUploader(false);
                }}
              />
            </div>
          )}

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar por título, descripción o creador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white pl-10"
            />
          </div>

          {/* Programs List */}
          {isLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No se encontraron programas</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((program) => (
                <Card key={program.id} className="bg-gray-800/80 border-gray-700 hover:border-cyan-500/50 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <Link to={createPageUrl(`RadioProgramDetail?id=${program.id}`)}>
                          <h3 className="text-white font-semibold truncate hover:text-cyan-400 transition-colors">
                            {program.title}
                          </h3>
                        </Link>
                        {program.description && (
                          <p className="text-gray-400 text-sm truncate">{program.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>Por: {program.created_by?.split('@')[0] || 'Desconocido'}</span>
                          {program.schedule_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {program.schedule_time}
                            </span>
                          )}
                          {program.plays_count > 0 && (
                            <span>▶ {program.plays_count}</span>
                          )}
                          <Badge variant="outline" className={`text-xs ${program.is_active ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
                            {program.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingProgram(program)}
                          className="text-cyan-400 hover:bg-gray-700"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(program.id)}
                          className="text-red-500 hover:bg-gray-700"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingProgram && (
        <EditProgramModal
          program={editingProgram}
          onClose={() => setEditingProgram(null)}
          onSuccess={() => {
            setEditingProgram(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}