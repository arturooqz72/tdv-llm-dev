import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

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
  Pause,
  Music,
  Radio,
  Video,
  Disc3,
  Headphones,
  Mic2,
  ArrowRight,
  Waves,
  Volume2,
  ExternalLink,
} from "lucide-react";

const RADIO_BASE = "https://radio.team-desveladoslldm.com";
const STATION = "tdv_lldm-christian_radio";
const RADIO_PAGE_URL = "http://radio24-7.team-desveladoslldm.com/";
const HERO_IMAGE = "/tdv-hero-100.png";

const STREAMS = [
  `${RADIO_BASE}/listen/${STATION}/radio.mp3`,
  `${RADIO_BASE}/listen/${STATION}/radio.aac`,
];

export default function Home() {
  const { user: currentUser, isAuthenticated } = useAuth();

  const safeUser = isAuthenticated ? currentUser : null;

  const audioRef = useRef(null);
  const [routeIndex, setRouteIndex] = useState(0);
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [radioVolume, setRadioVolume] = useState(0.7);

  const { data: videos = [], isLoading, refetch } = useQuery({
    queryKey: ["videos-home"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("videos")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;
        return data || [];
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

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = radioVolume;
  }, [radioVolume]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleToggleRadio = async () => {
    if (!audioRef.current) return;

    try {
      if (isRadioPlaying) {
        audioRef.current.pause();
        setIsRadioPlaying(false);
      } else {
        audioRef.current.src = STREAMS[routeIndex];
        audioRef.current.volume = radioVolume;
        await audioRef.current.play();
        setIsRadioPlaying(true);
      }
    } catch (error) {
      console.error("Error reproduciendo radio:", error);
      setIsRadioPlaying(false);
    }
  };

  const handleChangeRoute = async () => {
    const nextIndex = routeIndex === 0 ? 1 : 0;
    setRouteIndex(nextIndex);

    if (!audioRef.current) return;

    try {
      const wasPlaying = isRadioPlaying;
      audioRef.current.pause();
      audioRef.current.src = STREAMS[nextIndex];
      audioRef.current.load();

      if (wasPlaying) {
        await audioRef.current.play();
        setIsRadioPlaying(true);
      }
    } catch (error) {
      console.error("Error cambiando ruta:", error);
      setIsRadioPlaying(false);
    }
  };

  const handleRadioError = async () => {
    const fallbackIndex = routeIndex === 0 ? 1 : 0;

    if (!audioRef.current) return;

    try {
      audioRef.current.pause();
      audioRef.current.src = STREAMS[fallbackIndex];
      audioRef.current.load();
      setRouteIndex(fallbackIndex);

      if (isRadioPlaying) {
        await audioRef.current.play();
      }
    } catch (error) {
      console.error("Error en rutas de radio:", error);
      setIsRadioPlaying(false);
    }
  };

  const openRadioPage = () => {
    window.open(RADIO_PAGE_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#e9f9ff] via-[#f5fcff] to-[#ffffff] text-slate-800">
      <audio
        ref={audioRef}
        preload="none"
        onPause={() => setIsRadioPlaying(false)}
        onPlay={() => setIsRadioPlaying(true)}
        onError={handleRadioError}
      />

      <section className="w-full px-4 md:px-6 lg:px-8 pt-6 md:pt-10 pb-6 md:pb-10">
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-cyan-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,250,255,0.98),rgba(233,249,255,1))] shadow-xl">
            <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-cyan-200/40 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />

            <div className="relative grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 p-5 md:p-8 lg:p-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-sm text-cyan-700 shadow-sm mb-4">
                  <Sparkles className="w-4 h-4" />
                  Comunidad · Radio · Videos · LLDMPlay
                </div>

                <h1 className="text-3xl md:text-5xl xl:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                  Team Desvelados
                  <span className="block text-cyan-700">LLDM</span>
                </h1>

                <p className="mt-4 text-slate-600 text-sm md:text-lg leading-relaxed max-w-2xl">
                  Un espacio moderno para disfrutar radio 24/7, videos,
                  contenido espiritual, concursos y convivencia con la comunidad.
                </p>

                <p className="mt-4 text-cyan-700 text-base md:text-2xl font-bold">
                  Celebrando 100 años de esperanza, fe y salvación LLDM
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <ShareButton />

                  <Link to={createPageUrl("Videos")}>
                    <Button
                      variant="outline"
                      className="border-cyan-300 bg-white text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 rounded-xl font-semibold shadow-sm"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Ver Videos
                    </Button>
                  </Link>

                  <Link to={createPageUrl("MyAudios")}>
                    <Button className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl font-bold shadow-sm">
                      <Disc3 className="w-4 h-4 mr-2" />
                      LLDMPlay
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-[28px] border border-cyan-200 bg-white p-3 md:p-4 shadow-lg">
                  <img
                    src={HERO_IMAGE}
                    alt="Team Desvelados LLDM"
                    className="w-full max-w-[520px] mx-auto h-auto object-contain rounded-[22px]"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 md:px-6 lg:px-8 pb-6 md:pb-8">
        <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          <Card className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.12),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(241,249,255,0.98),rgba(234,246,255,1))] border-cyan-200 text-slate-800 rounded-3xl shadow-xl">
            <div className="absolute -top-16 -left-16 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-blue-300/20 blur-3xl" />

            <CardContent className="relative p-5 md:p-7">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm text-cyan-700 mb-4">
                    <Radio className="w-4 h-4" />
                    Radio en vivo 24/7
                  </div>

                  <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                    Radio Team Desvelados
                    <br />
                    24/7
                  </h2>

                  <p className="mt-4 text-cyan-700 text-sm md:text-lg font-medium">
                    Transmisión continua · Música · Cantos · Programas
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={openRadioPage}
                  className="shrink-0 border-cyan-300 bg-white text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 rounded-2xl font-semibold"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Radio
                </Button>
              </div>

              <div className="rounded-[28px] border border-cyan-200 bg-white/75 backdrop-blur-sm p-4 md:p-6 shadow-sm">
                <div className="grid grid-cols-[96px_1fr] md:grid-cols-[140px_1fr] gap-4 md:gap-6 items-center">
                  <div className="h-24 w-24 md:h-36 md:w-36 rounded-full border-4 border-cyan-300 bg-cyan-50 flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.10)]">
                    <Radio className="w-10 h-10 md:w-16 md:h-16 text-cyan-500" />
                  </div>

                  <div>
                    <h3 className="text-2xl md:text-4xl font-black leading-tight text-slate-900">
                      Radio Team Desvelados
                      <br />
                      24/7
                    </h3>

                    <p className="mt-2 text-slate-600 text-base md:text-xl">
                      {isRadioPlaying ? "Reproduciendo" : "Pausado"} · Ruta{" "}
                      {routeIndex + 1}/2
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Button
                        onClick={handleToggleRadio}
                        className="h-14 md:h-16 px-6 md:px-10 bg-cyan-500 hover:bg-cyan-400 text-white font-black text-xl rounded-2xl shadow-lg"
                      >
                        {isRadioPlaying ? (
                          <Pause className="w-6 h-6 mr-3" />
                        ) : (
                          <Play className="w-6 h-6 mr-3" />
                        )}
                        {isRadioPlaying ? "Pausar" : "Reproducir"}
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleChangeRoute}
                        className="h-14 md:h-16 px-5 md:px-8 bg-slate-100 hover:bg-slate-200 text-slate-800 text-lg rounded-2xl"
                      >
                        Cambiar Ruta
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={openRadioPage}
                        className="h-14 md:h-16 w-14 md:w-16 p-0 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl"
                      >
                        <ExternalLink className="w-7 h-7" />
                      </Button>
                    </div>

                    <div className="mt-6 flex items-center gap-4">
                      <Volume2 className="w-7 h-7 text-cyan-700 shrink-0" />

                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={radioVolume}
                        onChange={(e) => setRadioVolume(Number(e.target.value))}
                        className="w-full accent-cyan-500"
                      />

                      <span className="text-2xl font-bold text-slate-800 w-[72px] text-right">
                        {Math.round(radioVolume * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/85 border-cyan-200 text-slate-800 rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-700">
                <Sparkles className="w-5 h-5" />
                Bienvenido a Team Desvelados LLDM
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                Disfruta nuestra radio 24/7, videos, juegos bíblicos, concursos,
                LLDMPlay y espacios para convivir con la comunidad.
              </p>

              {safeUser ? (
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3">
                  <p className="text-sm text-cyan-700">
                    Sesión iniciada como{" "}
                    <span className="font-bold text-slate-900">
                      {safeUser?.name || safeUser?.email || "Usuario"}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-cyan-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-sm text-slate-600 mb-3">
                    Inicia sesión para acceder a chats, subir contenido y usar
                    funciones especiales.
                  </p>

                  <Link to={createPageUrl("Login")}>
                    <Button className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl">
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

      <section className="w-full px-4 md:px-6 lg:px-8 pb-6 md:pb-8">
        <div className="w-full max-w-[1600px] mx-auto">
          <FeaturedStreams />
        </div>
      </section>

      <section className="w-full px-4 md:px-6 lg:px-8 pb-6 md:pb-8">
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">
            <div className="xl:col-span-8">
              <Link to={createPageUrl("MyAudios")} className="block group">
                <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(241,249,255,0.98),rgba(234,246,255,1))] p-5 md:p-7 shadow-xl transition duration-300 group-hover:scale-[1.01] group-hover:border-emerald-300">
                  <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-emerald-300/20 blur-3xl" />
                  <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />

                  <div className="relative grid grid-cols-1 lg:grid-cols-[1.25fr_320px] gap-6 items-center">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700 mb-4">
                        <Headphones className="w-4 h-4" />
                        Audio espiritual para la comunidad
                      </div>

                      <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">
                        LLDMPlay
                      </h2>

                      <p className="text-slate-600 text-sm md:text-lg leading-relaxed max-w-2xl">
                        Predicaciones, Cantos LLDM, Instrumental, Testimonios,
                        Podcast, Debates, Temas y más contenido para edificación
                        espiritual.
                      </p>

                      <div className="flex flex-wrap gap-2 mt-5">
                        <span className="rounded-full bg-white/90 border border-slate-200 px-3 py-1 text-xs md:text-sm text-slate-700">
                          Predicaciones
                        </span>
                        <span className="rounded-full bg-white/90 border border-slate-200 px-3 py-1 text-xs md:text-sm text-slate-700">
                          Cantos LLDM
                        </span>
                        <span className="rounded-full bg-white/90 border border-slate-200 px-3 py-1 text-xs md:text-sm text-slate-700">
                          Testimonios
                        </span>
                        <span className="rounded-full bg-white/90 border border-slate-200 px-3 py-1 text-xs md:text-sm text-slate-700">
                          Podcast
                        </span>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center rounded-2xl bg-emerald-400 px-5 py-3 text-slate-950 font-bold shadow-lg">
                          <Disc3 className="w-5 h-5 mr-2" />
                          Abrir LLDMPlay
                        </div>

                        <div className="inline-flex items-center text-emerald-700 font-medium">
                          Entrar ahora
                          <ArrowRight className="w-4 h-4 ml-2 transition group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="rounded-[30px] border border-white/60 bg-white/70 backdrop-blur-xl p-5 shadow-sm">
                        <div className="rounded-[24px] bg-gradient-to-br from-emerald-100 via-cyan-50 to-blue-100 border border-white p-5">
                          <div className="flex items-center justify-between mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                              <Disc3 className="w-7 h-7 text-emerald-600" />
                            </div>
                            <div className="h-12 w-12 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg">
                              <Play className="w-5 h-5 ml-0.5" />
                            </div>
                          </div>

                          <h3 className="text-2xl font-bold text-slate-900">
                            LLDMPlay
                          </h3>
                          <p className="text-slate-600 text-sm mt-2">
                            La biblioteca de audio de la comunidad
                          </p>

                          <div className="mt-5 space-y-3">
                            <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 border border-slate-200">
                              <div className="flex items-center gap-3">
                                <Mic2 className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm text-slate-800">
                                  Predicaciones
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">
                                Audio
                              </span>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 border border-slate-200">
                              <div className="flex items-center gap-3">
                                <Music className="w-4 h-4 text-cyan-600" />
                                <span className="text-sm text-slate-800">
                                  Cantos LLDM
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">
                                Audio
                              </span>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 border border-slate-200">
                              <div className="flex items-center gap-3">
                                <Waves className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-slate-800">
                                  Instrumental
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">
                                Audio
                              </span>
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
              <Card className="h-full bg-white/85 border-cyan-200 text-slate-800 rounded-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-cyan-700">
                    Contenido disponible
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between rounded-2xl bg-cyan-50 px-4 py-3 border border-cyan-100">
                    <span>Videos cargados</span>
                    <span className="font-bold text-cyan-700">
                      {videos.length}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <p className="leading-relaxed">
                      Ahora también puedes entrar a{" "}
                      <span className="font-bold text-slate-900">LLDMPlay</span>{" "}
                      para escuchar contenido espiritual de la comunidad en un
                      estilo moderno y fácil de explorar.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 md:px-6 lg:px-8 pb-24 md:pb-10">
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between gap-4 mb-5 md:mb-6">
            <h2 className="text-cyan-700 text-xl md:text-2xl font-bold">
              Videos recientes
            </h2>

            <Link to={createPageUrl("Videos")}>
              <Button
                variant="outline"
                className="border-cyan-300 bg-white text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 rounded-xl font-semibold"
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
            <Card className="bg-white/85 border-cyan-200 text-slate-800 rounded-3xl shadow-xl">
              <CardContent className="py-10 text-center">
                <p className="text-slate-600 mb-4">
                  Aún no hay videos disponibles.
                </p>

                <Link to={createPageUrl("Videos")}>
                  <Button className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl">
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
