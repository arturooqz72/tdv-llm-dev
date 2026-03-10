import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import PermissionGuard from "@/components/PermissionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Users,
  Video,
  Music,
  CheckCircle,
  Clock3,
  Loader2,
  Shield,
  AlertTriangle,
} from "lucide-react";

async function getTableCountSafe(tableName, filter = null) {
  try {
    let query = supabase.from(tableName).select("*", { count: "exact", head: true });

    if (filter?.column && filter?.value !== undefined) {
      query = query.eq(filter.column, filter.value);
    }

    const { count, error } = await query;

    if (error) {
      return {
        ok: false,
        table: tableName,
        count: 0,
        error: error.message || `Error en tabla ${tableName}`,
      };
    }

    return {
      ok: true,
      table: tableName,
      count: count || 0,
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      table: tableName,
      count: 0,
      error: err?.message || `Fallo inesperado en ${tableName}`,
    };
  }
}

export default function AdminStats() {
  const { user: currentUser, isLoadingAuth } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-stats-v2"],
    queryFn: async () => {
      const results = await Promise.all([
        getTableCountSafe("profiles"),
        getTableCountSafe("videos"),
        getTableCountSafe("videos", { column: "status", value: "approved" }),
        getTableCountSafe("videos", { column: "status", value: "pending" }),
        getTableCountSafe("videos", { column: "status", value: "rejected" }),
        getTableCountSafe("audios"),
        getTableCountSafe("audios", { column: "status", value: "approved" }),
        getTableCountSafe("audios", { column: "status", value: "pending" }),
        getTableCountSafe("audios", { column: "status", value: "rejected" }),
      ]);

      const [
        totalUsers,
        totalVideos,
        approvedVideos,
        pendingVideos,
        rejectedVideos,
        totalAudios,
        approvedAudios,
        pendingAudios,
        rejectedAudios,
      ] = results;

      return {
        stats: {
          totalUsers: totalUsers.count,
          totalVideos: totalVideos.count,
          approvedVideos: approvedVideos.count,
          pendingVideos: pendingVideos.count,
          rejectedVideos: rejectedVideos.count,
          totalAudios: totalAudios.count,
          approvedAudios: approvedAudios.count,
          pendingAudios: pendingAudios.count,
          rejectedAudios: rejectedAudios.count,
          updatedAt: new Date().toISOString(),
        },
        tableResults: {
          profiles: totalUsers,
          videos: totalVideos,
          videosApproved: approvedVideos,
          videosPending: pendingVideos,
          videosRejected: rejectedVideos,
          audios: totalAudios,
          audiosApproved: approvedAudios,
          audiosPending: pendingAudios,
          audiosRejected: rejectedAudios,
        },
      };
    },
    staleTime: 30000,
    retry: 0,
  });

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <PermissionGuard requireRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Estadísticas</h1>
              <p className="text-gray-400 text-sm">Panel limpio conectado a Supabase</p>
              {currentUser?.email && (
                <p className="text-xs text-gray-500 mt-1">
                  Administrador: {currentUser.email}
                </p>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
              <Shield className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-400 font-semibold">Error cargando estadísticas</p>
              <p className="text-gray-400 text-sm mt-2">
                {error.message || "No se pudieron cargar los datos."}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                <StatCard
                  title="Usuarios"
                  value={data?.stats?.totalUsers ?? 0}
                  icon={Users}
                  subtitle="Total registrados"
                />
                <StatCard
                  title="Videos"
                  value={data?.stats?.totalVideos ?? 0}
                  icon={Video}
                  subtitle="Total cargados"
                />
                <StatCard
                  title="Audios"
                  value={data?.stats?.totalAudios ?? 0}
                  icon={Music}
                  subtitle="Total cargados"
                />
                <StatCard
                  title="Última actualización"
                  value={new Date(data?.stats?.updatedAt || Date.now()).toLocaleTimeString()}
                  icon={BarChart3}
                  subtitle={new Date(data?.stats?.updatedAt || Date.now()).toLocaleDateString()}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="bg-gray-900/70 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Video className="w-5 h-5 text-cyan-400" />
                      Resumen de Videos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <MiniStatRow
                        label="Aprobados"
                        value={data?.stats?.approvedVideos ?? 0}
                        icon={CheckCircle}
                        valueClassName="text-green-400"
                      />
                      <MiniStatRow
                        label="Pendientes"
                        value={data?.stats?.pendingVideos ?? 0}
                        icon={Clock3}
                        valueClassName="text-yellow-400"
                      />
                      <MiniStatRow
                        label="Rechazados"
                        value={data?.stats?.rejectedVideos ?? 0}
                        icon={Shield}
                        valueClassName="text-red-400"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/70 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Music className="w-5 h-5 text-cyan-400" />
                      Resumen de Audios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <MiniStatRow
                        label="Aprobados"
                        value={data?.stats?.approvedAudios ?? 0}
                        icon={CheckCircle}
                        valueClassName="text-green-400"
                      />
                      <MiniStatRow
                        label="Pendientes"
                        value={data?.stats?.pendingAudios ?? 0}
                        icon={Clock3}
                        valueClassName="text-yellow-400"
                      />
                      <MiniStatRow
                        label="Rechazados"
                        value={data?.stats?.rejectedAudios ?? 0}
                        icon={Shield}
                        valueClassName="text-red-400"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gray-900/70 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    Diagnóstico de tablas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.values(data?.tableResults || {}).map((item) => (
                      <div
                        key={`${item.table}-${item.error || "ok"}`}
                        className="flex items-start justify-between gap-4 rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-3"
                      >
                        <div>
                          <p className="text-white font-medium">{item.table}</p>
                          {item.ok ? (
                            <p className="text-xs text-green-400">Consulta correcta</p>
                          ) : (
                            <p className="text-xs text-red-400">{item.error}</p>
                          )}
                        </div>
                        <div className={item.ok ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                          {item.ok ? item.count : "Error"}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}

function StatCard({ title, value, icon: Icon, subtitle }) {
  return (
    <Card className="bg-gray-900/70 border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStatRow({ label, value, icon: Icon, valueClassName = "text-white" }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-gray-300">{label}</span>
      </div>
      <span className={`font-bold ${valueClassName}`}>{value}</span>
    </div>
  );
}
