import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";

import VideoCard from "@/components/video/VideoCard";
import ShareButton from "@/components/ShareButton";
import FeaturedStreams from "@/components/FeaturedStreams";
import TuRadioPersonalSection from "@/components/radio/TuRadioPersonalSection";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Sparkles,
  Users,
  Upload,
  Play,
  Pause,
  Music,
  Radio,
  Video,
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
                Disfruta nuestra radio 24/7, videos, juegos bíblicos, concursos
                y espacios para convivir con la comunidad.
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

      {/* TU RADIO PERSONAL */}
      <section className="w-full px-4 md:px-6 lg:px-8 pb-6 md:pb-8">
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">
            <div className="xl:col-span-8">
              <div className="bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-2xl py-3 px-6 text-center mb-4">
                <h2 className="text-black font-bold text-lg md:text-xl flex items-center justify-center gap-2">
                  <Music className="w-5 h-5" />
                  Tu Radio Personal
                </h2>
              </div>

              <div className="rounded-3xl border border-cyan-500/20 bg-[#111827]/90 p-4 md:p-6">
                <TuRadioPersonalSection
                  programs={allPrograms}
                  allPrograms={allPrograms}
                />
              </div>
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

                  <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/10 px-4 py-4">
                    <p className="leading-relaxed">
                      Explora la comunidad, escucha la radio y comparte contenido
                      con Team Desvelados LLDM.
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
