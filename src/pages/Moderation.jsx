import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Ban,
  ExternalLink
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';
import PermissionGuard from '@/components/PermissionGuard';

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

export default function ModerationPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [reports, setReports] = useState([]);
  const [pendingVideos, setPendingVideos] = useState([]);
  const [pendingAudios, setPendingAudios] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [allUsers] = useState([]);

  useEffect(() => {
    const user = readStoredUser();

    if (!user || user.role !== 'admin') {
      alert('No tienes permisos para acceder a esta página');
      window.location.href = '/';
      return;
    }

    setCurrentUser(user);
    setIsLoading(false);
  }, []);

  const handleResolve = async (report, action) => {
    const actionText =
      action === 'delete'
        ? 'Contenido eliminado'
        : action === 'dismiss'
          ? 'Reporte descartado'
          : 'Advertencia enviada';

    setReports((prev) =>
      prev.map((item) =>
        item.id === report.id
          ? {
              ...item,
              status: 'resolved',
              action_taken: actionText,
              reviewed_by: currentUser?.email || 'admin'
            }
          : item
      )
    );

    if (action === 'delete') {
      if (report.content_type === 'video') {
        setPendingVideos((prev) => prev.filter((item) => item.id !== report.content_id));
      } else if (report.content_type === 'audio') {
        setPendingAudios((prev) => prev.filter((item) => item.id !== report.content_id));
      }
    }
  };

  const handleApproveContent = (contentType, contentId) => {
    if (contentType === 'video') {
      setPendingVideos((prev) => prev.filter((item) => item.id !== contentId));
    } else if (contentType === 'audio') {
      setPendingAudios((prev) => prev.filter((item) => item.id !== contentId));
    }
  };

  const handleRejectContent = (contentType, contentId) => {
    if (contentType === 'video') {
      setPendingVideos((prev) => prev.filter((item) => item.id !== contentId));
    } else if (contentType === 'audio') {
      setPendingAudios((prev) => prev.filter((item) => item.id !== contentId));
    }
  };

  const handleBlockUser = (email, reason) => {
    setBlockedUsers((prev) => [
      {
        id: `${Date.now()}`,
        user_email: email,
        blocked_by: currentUser?.email || 'admin',
        reason,
        created_date: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const handleUnblockUser = (blockId) => {
    setBlockedUsers((prev) => prev.filter((item) => item.id !== blockId));
  };

  const severityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    reviewing: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-gray-600'
  };

  const pendingReports = useMemo(
    () => reports.filter((r) => r.status === 'pending' || r.status === 'reviewing'),
    [reports]
  );

  const resolvedReports = useMemo(
    () => reports.filter((r) => r.status === 'resolved' || r.status === 'dismissed'),
    [reports]
  );

  const criticalReports = useMemo(
    () => reports.filter((r) => r.ai_severity === 'critical' || r.ai_severity === 'high'),
    [reports]
  );

  if (!currentUser) return null;

  return (
    <PermissionGuard permission="can_moderate_content">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Moderación</h1>
              <p className="text-gray-600">Gestión de reportes y contenido</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Contenido Pendiente</p>
                    <p className="text-3xl font-bold text-gray-900">{pendingVideos.length + pendingAudios.length}</p>
                  </div>
                  <Eye className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Reportes Pendientes</p>
                    <p className="text-3xl font-bold text-gray-900">{pendingReports.length}</p>
                  </div>
                  <Flag className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Críticos/Urgentes</p>
                    <p className="text-3xl font-bold text-gray-900">{criticalReports.length}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resueltos</p>
                    <p className="text-3xl font-bold text-gray-900">{resolvedReports.length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="content" className="space-y-4">
            <TabsList>
              <TabsTrigger value="content">
                Contenido Pendiente ({pendingVideos.length + pendingAudios.length})
              </TabsTrigger>
              <TabsTrigger value="reports">
                Reportes ({pendingReports.length})
              </TabsTrigger>
              <TabsTrigger value="critical">
                Críticos ({criticalReports.length})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resueltos ({resolvedReports.length})
              </TabsTrigger>
              <TabsTrigger value="blocked">
                Usuarios Bloqueados ({blockedUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="space-y-6">
                {pendingVideos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Videos Pendientes</h3>
                    <div className="space-y-4">
                      {pendingVideos.map((video) => (
                        <Card key={video.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    Pendiente de Aprobación
                                  </Badge>
                                  {video.religion && <Badge variant="outline">{video.religion}</Badge>}
                                  {video.tags && video.tags.length > 0 &&
                                    video.tags.map((tag) => (
                                      <Badge key={tag} variant="secondary">{tag}</Badge>
                                    ))}
                                </div>
                                <CardTitle className="text-lg">{video.title}</CardTitle>
                                <p className="text-sm text-gray-600 mt-1">
                                  Subido por: {video.created_by}
                                </p>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            {video.description && (
                              <p className="text-sm text-gray-700">{video.description}</p>
                            )}

                            <div className="flex gap-2 flex-wrap">
                              <Button
                                onClick={() => window.open(video.video_url, '_blank')}
                                variant="outline"
                                size="sm"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Video
                              </Button>

                              <Button
                                onClick={() => handleApproveContent('video', video.id)}
                                className="bg-green-600 hover:bg-green-700"
                                size="sm"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Aprobar
                              </Button>

                              <Button
                                onClick={() => {
                                  window.prompt('Razón del rechazo (opcional):');
                                  handleRejectContent('video', video.id);
                                }}
                                variant="destructive"
                                size="sm"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Rechazar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {pendingAudios.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Audios Pendientes</h3>
                    <div className="space-y-4">
                      {pendingAudios.map((audio) => (
                        <Card key={audio.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    Pendiente de Aprobación
                                  </Badge>
                                  {audio.category && <Badge variant="outline">{audio.category}</Badge>}
                                  {audio.tags && audio.tags.length > 0 &&
                                    audio.tags.map((tag) => (
                                      <Badge key={tag} variant="secondary">{tag}</Badge>
                                    ))}
                                </div>
                                <CardTitle className="text-lg">{audio.title}</CardTitle>
                                <p className="text-sm text-gray-600 mt-1">
                                  Subido por: {audio.created_by}
                                </p>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            {audio.description && (
                              <p className="text-sm text-gray-700">{audio.description}</p>
                            )}

                            <audio controls className="w-full">
                              <source src={audio.audio_url} />
                            </audio>

                            <div className="flex gap-2 flex-wrap">
                              <Button
                                onClick={() => handleApproveContent('audio', audio.id)}
                                className="bg-green-600 hover:bg-green-700"
                                size="sm"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Aprobar
                              </Button>

                              <Button
                                onClick={() => {
                                  window.prompt('Razón del rechazo (opcional):');
                                  handleRejectContent('audio', audio.id);
                                }}
                                variant="destructive"
                                size="sm"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Rechazar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {pendingVideos.length === 0 && pendingAudios.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                      <p className="text-gray-600">
                        No hay contenido pendiente de aprobación. Esta sección quedó temporalmente desconectada mientras terminamos la migración.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                ))
              ) : pendingReports.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <p className="text-gray-600">No hay reportes pendientes</p>
                  </CardContent>
                </Card>
              ) : (
                pendingReports.map((report) => (
                  <Card key={report.id} className="border-l-4 border-l-orange-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={severityColors[report.ai_severity || 'low']}>
                              {report.ai_severity?.toUpperCase() || 'NO ANALIZADO'}
                            </Badge>
                            <Badge className={statusColors[report.status]}>
                              {report.status}
                            </Badge>
                            <Badge variant="outline">
                              {report.content_type}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">
                            Razón: {String(report.reason || '').replace('_', ' ')}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            Reportado por: {report.reporter_email}
                          </p>
                          <p className="text-sm text-gray-600">
                            Usuario reportado: {report.reported_user_email}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {report.description && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{report.description}</p>
                        </div>
                      )}

                      {report.ai_analysis && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Análisis de IA
                          </h4>
                          <p className="text-sm text-gray-700 mb-2">
                            {report.ai_analysis.explanation}
                          </p>
                          <div className="flex gap-2 text-xs flex-wrap">
                            <Badge variant="outline">
                              Confianza: {Math.round((report.ai_analysis.confidence || 0) * 100)}%
                            </Badge>
                            <Badge variant="outline">
                              Acción recomendada: {report.ai_analysis.recommended_action}
                            </Badge>
                            {report.ai_analysis.is_valid !== undefined && (
                              <Badge variant={report.ai_analysis.is_valid ? "destructive" : "default"}>
                                {report.ai_analysis.is_valid ? 'Reporte válido' : 'Posible falso positivo'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {report.content_type === 'video' && (
                          <Button
                            onClick={() => window.open(createPageUrl(`VideoDetail?id=${report.content_id}`), '_blank')}
                            variant="outline"
                            size="sm"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ver Video
                          </Button>
                        )}

                        <Button
                          onClick={() => handleResolve(report, 'delete')}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar Contenido
                        </Button>

                        <Button
                          onClick={() => handleResolve(report, 'warn')}
                          variant="outline"
                          size="sm"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Advertir Usuario
                        </Button>

                        <Button
                          onClick={() => handleResolve(report, 'dismiss')}
                          variant="outline"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Descartar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="critical" className="space-y-4">
              {criticalReports.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <p className="text-gray-600">No hay reportes críticos</p>
                  </CardContent>
                </Card>
              ) : (
                criticalReports.map((report) => (
                  <Card key={report.id} className="border-l-4 border-l-red-500">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-red-100 text-red-800">
                          CRÍTICO
                        </Badge>
                        <Badge className={statusColors[report.status]}>
                          {report.status}
                        </Badge>
                      </div>
                      <CardTitle>Razón: {report.reason}</CardTitle>
                    </CardHeader>

                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Usuario: {report.reported_user_email}
                      </p>

                      {report.ai_analysis && (
                        <div className="p-4 bg-red-50 rounded-lg mb-4">
                          <p className="text-sm">{report.ai_analysis.explanation}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleResolve(report, 'delete')}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar Ahora
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              {resolvedReports.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-600">No hay reportes resueltos</p>
                  </CardContent>
                </Card>
              ) : (
                resolvedReports.map((report) => (
                  <Card key={report.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={statusColors[report.status]}>
                          {report.status}
                        </Badge>
                        <Badge variant="outline">
                          {report.content_type}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">
                        {report.reason}
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Acción: {report.action_taken}
                      </p>
                      <p className="text-sm text-gray-600">
                        Revisado por: {report.reviewed_by}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="blocked" className="space-y-4">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Bloquear Usuario</CardTitle>
                </CardHeader>

                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const email = String(formData.get('email') || '').trim();
                      const reason = String(formData.get('reason') || '').trim();

                      if (!email || !reason) {
                        alert('Por favor completa todos los campos');
                        return;
                      }

                      const alreadyBlocked = blockedUsers.find(
                        (b) => b.user_email.toLowerCase() === email.toLowerCase()
                      );

                      if (alreadyBlocked) {
                        alert('El usuario ya está bloqueado');
                        return;
                      }

                      handleBlockUser(email, reason);
                      e.target.reset();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email del Usuario</label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="usuario@ejemplo.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Razón del Bloqueo</label>
                      <textarea
                        name="reason"
                        required
                        placeholder="Describe la razón del bloqueo..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <Button type="submit" className="bg-red-600 hover:bg-red-700">
                      <Ban className="w-4 h-4 mr-2" />
                      Bloquear Usuario
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {blockedUsers.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <p className="text-gray-600">No hay usuarios bloqueados</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {blockedUsers.map((blocked) => (
                    <Card key={blocked.id} className="border-l-4 border-l-red-500">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-red-100 text-red-800">
                                <Ban className="w-3 h-3 mr-1" />
                                BLOQUEADO
                              </Badge>
                            </div>
                            <CardTitle className="text-lg">{blocked.user_email}</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              Bloqueado por: {blocked.blocked_by}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(blocked.created_date).toLocaleString('es-MX')}
                            </p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm font-semibold text-red-900 mb-1">Razón del bloqueo:</p>
                          <p className="text-sm text-gray-700">{blocked.reason}</p>
                        </div>

                        <Button
                          onClick={() => {
                            if (window.confirm(`¿Desbloquear a ${blocked.user_email}?`)) {
                              handleUnblockUser(blocked.id);
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Desbloquear Usuario
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PermissionGuard>
  );
}
