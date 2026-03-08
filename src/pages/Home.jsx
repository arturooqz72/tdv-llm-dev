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
      } catch {
        return [];
      }
    },
  });

  const { data: videos = [], isLoading, refetch } = useQuery({
    queryKey: ["videos", filter],
    queryFn: async () => {
      try {
        return await base44.entities.Video.list("-created_date", 100);
      } catch {
        return [];
      }
    },
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


      {/* RADIO + BIENVENIDA */}
      <section className="w-full px-4 md:px-6 lg:px-8 pb-6 md:pb-8">
        <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* PLAYER */}
          <Card className="bg-[#111827]/90 border-cyan-500/20 text-white rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-400">
                <Radio className="w-5 h-5" />
                Radio Team Desvelados 24/7
              </CardTitle>
            </CardHeader>

            <CardContent>

              <iframe
                src="https://radio.team-desveladoslldm.com/public/tdv_lldm/embed"
                width="100%"
                height="200"
                frameBorder="0"
                allow="autoplay"
                className="rounded-xl"
              />

            </CardContent>
          </Card>


          {/* BIENVENIDA */}
          <Card className="bg-[#111827]/90 border-cyan-500/20 text-white rounded-3xl">

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

        </div>
      </section>


      {/* STREAMS */}
      <section className="w-full px-4 md:px-6 lg:px-8 pb-6 md:pb-8">
        <div className="w-full max-w-[1600px] mx-auto">
          <FeaturedStreams />
        </div>
      </section>


      {/* LLDMPLAY */}
      {/* ESTA SECCIÓN NO SE TOCA */}
      {/* (sigue exactamente igual que tu versión original) */}
