import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";

import VideoCard from "@/components/video/VideoCard";
import ShareButton from "@/components/ShareButton";
import FeaturedStreams from "@/components/FeaturedStreams";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Sparkles,
  Users,
  Upload,
  Play,
  Music,
  Radio,
  Video,
  Disc3,
  Headphones,
  Mic2,
  ArrowRight,
  Waves,
} from "lucide-react";

export default function Home() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [filter] = useState("all");

  const safeUser = isAuthenticated ? currentUser : null;

  const { data: allPrograms = [] } = useQuery({
    queryKey: ["radio-programs-home"],
    queryFn: async () => {
      try {
        return await base44.entities.RadioProgram.filter(
          { is_active: true },
          "-created_date",
          100
        );
      } catch (error) {
        console.error("Error cargando programas de radio:", error);
        return [];
      }
    },
    staleTime: 3600000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  const { data: videos = [], isLoading, refetch } = useQuery({
    queryKey: ["videos", filter, safeUser?.email || "guest"],
    enabled: filter !== "following" || !!safeUser,
    queryFn: async () => {
      try {
        base44.analytics
          .track({
            eventName: "home_filter_used",
            properties: { filter },
          })
          .catch(() => {});

        if (filter === "all") {
          return await base44.entities.Video.list("-created_date", 100);
        }

        if (
          filter === "lldm" ||
          filter === "cristianismo" ||
          filter === "otros"
        ) {
          return await base44.entities.Video.filter(
            { religion: filter },
            "-created_date",
            100
          );
        }

        if (filter === "following" && safeUser?.email) {
          const follows = await base44.entities.Follow.filter({
            follower_email: safeUser.email,
          });

          const followingEmails = follows.map((f) => f.following_email);

          const allVideos = await base44.entities.Video.list(
            "-created_date",
            100
          );

          return allVideos.filter((video) =>
            followingEmails.includes(video.created_by)
          );
        }

        return [];
      } catch (error) {
        console.error("Error cargando videos:", error);
        return [];
      }
    },
    staleTime: 300000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const featuredVideos = useMemo(() => videos.slice(0, 6), [videos]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* HERO */}
      <section className="w-full px-4 md:px-6 lg:px-8 pt-6 md:pt-10 pb-6 md:pb-10">
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="rounded-3xl overflow-hidden border border-cyan-500/20 bg-black/30 shadow-2xl">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6965d0214fc84ccf68275f1d/66c9f4923_banner.jpg"
              alt="Team Desvelados LLDM"
              className="w-full h-auto max-h-[520px] object-cover"
            />

            <div className="px-4 md:px-8 py-5 md:py-8 text-center">
              <p className="text-cyan-400 text-base md:text-2xl font-bold mb-4 md:mb-6">
                Celebrando 100 años de esperanza, fe y salvación LLDM
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <ShareButton />

                <Link to={createPageUrl("Radio")}>
                  <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl">
                    <Radio className="w-4 h-4 mr-2" />
                    Escuchar Radio
                  </Button>
                </Link>

                <Link to={createPageUrl("Videos")}>
                  <Button
                    variant="outline"
                    className="border-cyan-400 text-cyan-300 hover:bg-cyan-500/10 rounded-xl"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Ver Videos
                  </Button>
                </Link>

                <Link to={createPageUrl("MyAudios")}>
                  <Button
                    variant="outline"
                    className="border-emerald-400 text-emerald-300 hover:bg-emerald-500/10 rounded-xl"
                  >
                    <Disc3 className="w-4 h-4 mr-2" />
                    LLDMPlay
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BIENVENIDA / ACCESOS */}
      <section className="w-full px-4 md:px-6 lg:px-8 pb-6 md:pb-8">
        <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          <Card className="xl:col-span-2 bg-[#111827]/90 border-cyan-500/20 text-white rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-400">
                <Sparkles className="w-5 h-5" />
                Bienvenido a Team Desvelados LLDM
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm md:text-base text-slate-200 leading-relaxed">
                Disfruta nuestra radio 24/7, videos, juegos bíblicos, concursos,
                LLDMPlay y espacios para convivir con la comunidad.
              </p>

              {safeUser ? (
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3">
                  <p className="text-sm text-cyan-300">
                    Sesión iniciada como{" "}
                    <span className="font-bold text-white">
                      {safeUser?.name || safeUser?.email || "Usuario"}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 px-4 py-4">
                  <p className="text-sm text-slate-200 mb-3">
                    Inicia sesión para acceder a chats, subir contenido y usar
                    funciones especiales.
                  </p>

                  <Link to={createPageUrl("Login")}>
                    <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl">
                      <Users className="w-4 h-4 mr-2" />
                      Iniciar Sesión
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#111827]/90 border-cyan-500/20 text-white rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-400">
                <Upload className="w-5 h-5" />
                Accesos rápidos
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <Link to={createPageUrl("EnviarSaludos")} className="block">
                <Button className="w-full justify-start bg-[#1f2937] hover:bg-[#273449] text-white rounded-2xl">
                  <Music className="w-4 h-4 mr-2 text-cyan-400" />
                  Enviar Saludos
                </Button>
              </Link>

              <Link to={createPageUrl("Games")} className="block">
                <Button className="w-full justify-start bg-[#1f2937] hover:bg-[#273449] text-white rounded-2xl">
                  <Play className="w-4 h-4 mr-2 text-cyan-400" />
                  Juegos Bíblicos
                </Button>
              </Link>

              <Link to={createPageUrl("Concurso")} className="block">
                <Button className="w-full justify-start bg-[#1f2937] hover:bg-[#273449] text-white rounded-2xl">
                  <Sparkles className="w-4 h-4 mr-2 text-cyan-400" />
                  Concurso
                </Button>
              </Link>

              <Link to={createPageUrl("Radio")} className="block">
                <Button className="w-full justify-start bg-[#1f2937] hover:bg-[#273449] text-white rounded-2xl">
                  <Radio className="w-4 h-4 mr-2 text-cyan-400" />
                  Radio 24/7
                </Button>
              </Link>

              <Link to={createPageUrl("MyAudios")} className="block">
                <Button className="w-full justify-start bg-emerald-500/15 hover:bg-emerald-500/25 text-white border border-emerald-400/20 rounded-2xl">
                  <Disc3 className="w-4 h-4 mr-2 text-emerald-300" />
                  LLDMPlay
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* STREAMS DESTACADOS */}
      <section className="w-full px-4 md:px-6 lg:px-8 pb-6 md:pb-8">
        <div className="w-full max-w-[1600px] mx-auto">
          <FeaturedStreams />
        </div>
      </section>

      {/* LLDMPLAY */}
      <section className="w-full px-4 md:px-6 lg:px-8 pb-6 md:pb-8">
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">
            <div className="xl:col-span-8">
              <Link to={createPageUrl("MyAudios")} className="block group">
                <div className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.25),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_24%),linear-gradient(135deg,rgba(3,7,18,0.96),rgba(17,24,39,0.96),rgba(0,0,0,1))] p-5 md:p-7 shadow-2xl transition duration-300 group-hover:scale-[1.01] group-hover:border-emerald-400/40">
                  <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />
                  <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />

                  <div className="relative grid grid-cols-1 lg:grid-cols-[1.25fr_320px] gap-6 items-center">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300 mb-4">
                        <Headphones className="w-4 h-4" />
                        Audio espiritual para la comunidad
                      </div>

                      <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-3">
                        LLDMPlay
                      </h2>

                      <p className="text-slate-200 text-sm md:text-lg leading-relaxed max-w-2xl">
                        Predicaciones, Cantos LLDM, Instrumental, Testimonios,
                        Podcast, Debates, Temas y más contenido para edificación
                        espiritual.
                      </p>

                      <div className="flex flex-wrap gap-2 mt-5">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs md:text-sm text-white">
                          Predicaciones
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs md:text-sm text-white">
                          Cantos LLDM
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs md:text-sm text-white">
                          Testimonios
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs md:text-sm text-white">
                          Podcast
                        </span>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center rounded-2xl bg-emerald-500 px-5 py-3 text-black font-bold shadow-lg">
                          <Disc3 className="w-5 h-5 mr-2" />
                          Abrir LLDMPlay
                        </div>

                        <div className="inline-flex items-center text-emerald-300 font-medium">
                          Entrar ahora
                          <ArrowRight className="w-4 h-4 ml-2 transition group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                        <div className="rounded-[24px] bg-gradient-to-br from-emerald-500/25 via-cyan-500/10 to-blue-500/20 border border-white/10 p-5">
                          <div className="flex items-center justify-between mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center">
                              <Disc3 className="w-7 h-7 text-emerald-300" />
                            </div>
                            <div className="h-12 w-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg">
                              <Play className="w-5 h-5 ml-0.5" />
                            </div>
                          </div>

                          <h3 className="text-2xl font-bold text-white">
                            LLDMPlay
                          </h3>
                          <p className="text-slate-300 text-sm mt-2">
                            La biblioteca de audio de la comunidad
                          </p>

                          <div className="mt-5 space-y-3">
                            <div className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3 border border-white/10">
                              <div className="flex items-center gap-3">
                                <Mic2 className="w-4 h-4 text-emerald-300" />
                                <span className="text-sm text-white">
                                  Predicaciones
                                </span>
                              </div>
                              <span className="text-xs text-slate-300">Audio</span>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3 border border-white/10">
                              <div className="flex items-center gap-3">
                                <Music className="w-4 h-4 text-cyan-300" />
                                <span className="text-sm text-white">
                                  Cantos LLDM
                                </span>
                              </div>
                              <span className="text-xs text-slate-300">Audio</span>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3 border border-white/10">
                              <div className="flex items-center gap-3">
                                <Waves className="w-4 h-4 text-blue-300" />
                                <span className="text-sm text-white">
                                  Instrumental
                                </span>
                              </div>
                              <span className="text-xs text-slate-300">Audio</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            <div className="xl:col-span-4">
              <Card className="h-full bg-[#111827]/90 border-cyan-500/20 text-white rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-cyan-400">
                    Contenido disponible
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-900/70 px-4 py-3">
                    <span>Programas activos</span>
                    <span className="font-bold text-cyan-300">
                      {allPrograms.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-900/70 px-4 py-3">
                    <span>Videos cargados</span>
                    <span className="font-bold text-cyan-300">
                      {videos.length}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 px-4 py-4">
                    <p className="leading-relaxed">
                      Ahora también puedes entrar a <span className="font-bold text-white">LLDMPlay</span> para
                      escuchar contenido espiritual de la comunidad en un estilo
                      moderno y fácil de explorar.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEOS */}
      <section className="w-full px-4 md:px-6 lg:px-8 pb-24 md:pb-10">
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between gap-4 mb-5 md:mb-6">
            <h2 className="text-cyan-400 text-xl md:text-2xl font-bold">
              Videos recientes
            </h2>

            <Link to={createPageUrl("Videos")}>
              <Button
                variant="outline"
                className="border-cyan-400 text-cyan-300 hover:bg-cyan-500/10 rounded-xl"
              >
                Ver todos
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[9/16] rounded-2xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
            </div>
          ) : featuredVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6">
              {featuredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  currentUser={safeUser}
                  onLikeUpdate={refetch}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-[#111827]/90 border-cyan-500/20 text-white rounded-3xl">
              <CardContent className="py-10 text-center">
                <p className="text-slate-300 mb-4">
                  Aún no hay videos disponibles.
                </p>

                <Link to={createPageUrl("Videos")}>
                  <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl">
                    Ir a Videos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
