import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Home,
  Compass,
  Upload,
  User,
  LogOut,
  X,
  Users,
  Radio,
  Cake,
  Sparkles,
  Shield,
  Music,
  Bell,
  TrendingUp,
  Lightbulb,
  Trophy,
  ChevronDown,
  Mic,
  RefreshCw,
  Disc3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import GlobalMiniPlayer from '@/components/radio/GlobalMiniPlayer';
import GlobalAzuraCastPlayer from '@/components/radio/GlobalAzuraCastPlayer';

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  console.log("CURRENT USER EN LAYOUT:", currentUser);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration('/').then((reg) => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          console.log('[SW] skipWaiting enviado');
        }
        if (reg) {
          reg.addEventListener('updatefound', () => {
            const newSW = reg.installing;
            if (newSW) {
              newSW.addEventListener('statechange', () => {
                if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                  newSW.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js"]'
    );
    if (existingScript) return;

    const script = document.createElement('script');
    script.src = 'https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {};
  }, []);

  const unreadMessagesCount = 0;

  const canAccessTeamDesveladosRoom =
    currentUser?.role === 'admin' ||
    currentUser?.canAccessTeamDesveladosRoom === true;

  const handleLogout = () => {
    logout(true);
  };

  const navItems = [
    { name: 'Inicio', icon: Home, page: 'Home' },
    { name: 'Videos', icon: Compass, page: 'Videos' },
    { name: 'Juegos', icon: Compass, page: 'Explore' },
    { name: 'Ranking', icon: Trophy, page: 'RankingJuegos' },
    { name: 'Radio 24/7 Saludos', icon: Radio, page: 'EnviarSaludos' },
    { name: 'Cumpleaños', icon: Cake, page: 'Birthdays' },
    { name: 'Miembros', icon: Users, page: 'Users' },
    { name: 'LLDMPlay', icon: Disc3, page: 'MyAudios' },
    { name: 'Memorama', icon: Sparkles, page: 'Memorama' }
  ];

  const authRequiredItems = [
    { name: 'Compartir', icon: Upload, page: 'Upload' },
    { name: 'LLDMPlay', icon: Disc3, page: 'MyAudios' },
    { name: 'Sugerencias', icon: Lightbulb, page: 'Suggestions' },
    { name: 'Perfil', icon: User, page: 'Profile' },
    { name: 'Notificaciones', icon: Bell, page: 'NotificationSettings' }
  ];

  const creatorItems = [];

  const adminItems = currentUser?.role === 'admin'
    ? [
        { name: 'Estadísticas', icon: TrendingUp, page: 'AppStats' },
        { name: 'Conflictos', icon: Shield, page: 'ConflictsManager' },
        { name: 'Escucha y Gana Admin', icon: Shield, page: 'AdminEscuchaYGana' },
        { name: 'Trivia Admin', icon: Shield, page: 'AdminTrivia' },
        { name: 'Roles', icon: Users, page: 'RoleManagement' },
        { name: 'Audios', icon: Music, page: 'AudioManager' },
        { name: 'Audios Públicos', icon: Music, page: 'PublicAudios' },
        { name: 'Videos Admin', icon: Shield, page: 'AdminVideos' }
      ]
    : [];

  const mobileNavItems = navItems;

  return (
    <div className="min-h-screen bg-[#f5fcff]">
      <nav
        className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-cyan-200 shadow-sm"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <div className="container mx-auto px-4">
          <div
            className="flex items-center justify-between"
            style={{
              minHeight: '56px'
            }}
          >
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full ring-2 ring-cyan-400 ring-offset-2 ring-offset-white">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6965d0214fc84ccf68275f1d/ecac80ce7_teamdesveladosLLDM.png"
                  alt="Team Desvelados LLDM"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>

              <span className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent hidden sm:block">
                TEAM DESVELADOS LLDM
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              <Link
                to={createPageUrl('Home')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPageName === 'Home'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
              >
                Inicio
              </Link>

              <Link
                to={createPageUrl('EnviarSaludos')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPageName === 'EnviarSaludos'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
              >
                Radio 24/7 Saludos
              </Link>

              <Link
                to={createPageUrl('Videos')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPageName === 'Videos'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
              >
                Videos
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-all">
                  Juegos <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border-cyan-200 shadow-lg">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Explore')} className="text-slate-700 hover:text-cyan-700 hover:bg-cyan-50 cursor-pointer">
                      Todos los Juegos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('RankingJuegos')} className="text-slate-700 hover:text-cyan-700 hover:bg-cyan-50 cursor-pointer">
                      Ranking
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Memorama')} className="text-slate-700 hover:text-cyan-700 hover:bg-cyan-50 cursor-pointer">
                      Memorama
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-all">
                  Concursos <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border-cyan-200 shadow-lg">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Concurso')} className="text-slate-700 hover:text-cyan-700 hover:bg-cyan-50 cursor-pointer">
                      Concurso
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('EscuchaYGana')} className="text-slate-700 hover:text-cyan-700 hover:bg-cyan-50 cursor-pointer">
                      Escucha y Gana
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('EscuchaYGanaResultados')} className="text-slate-700 hover:text-cyan-700 hover:bg-cyan-50 cursor-pointer">
                      Resultados
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('JuegaYGana')} className="text-slate-700 hover:text-cyan-700 hover:bg-cyan-50 cursor-pointer">
                      Juega y Gana
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Ganadores')} className="text-slate-700 hover:text-cyan-700 hover:bg-cyan-50 cursor-pointer">
                      Ganadores
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link
                to={createPageUrl('MyAudios')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPageName === 'MyAudios'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
              >
                LLDMPlay
              </Link>

              <Link
                to={createPageUrl('Birthdays')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPageName === 'Birthdays'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
              >
                Cumpleaños
              </Link>

              {canAccessTeamDesveladosRoom && (
                <Link
                  to={createPageUrl('TeamDesveladosRoom')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPageName === 'TeamDesveladosRoom'
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-700'
                  }`}
                >
                  TDV Charla
                </Link>
              )}

              <Link
                to={createPageUrl('Users')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPageName === 'Users'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
              >
                Miembros
              </Link>

              {currentUser && (
                <>
                  <Link
                    to={createPageUrl('Upload')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentPageName === 'Upload'
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-700'
                    }`}
                  >
                    Subir
                  </Link>

                  <Link
                    to={createPageUrl('Suggestions')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentPageName === 'Suggestions'
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-700'
                    }`}
                  >
                    Sugerencias
                  </Link>

                  <Link
                    to={createPageUrl('Profile')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentPageName === 'Profile'
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-700'
                    }`}
                  >
                    Perfil
                  </Link>

                  <Link
                    to={createPageUrl('NotificationSettings')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentPageName === 'NotificationSettings'
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-cyan-50 hover:text-cyan-700'
                    }`}
                  >
                    Notificaciones
                  </Link>
                </>
              )}

              {currentUser?.role === 'admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all">
                    Admin <ChevronDown className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border-red-200 shadow-lg">
                    {adminItems.map((item) => (
                      <DropdownMenuItem asChild key={item.page}>
                        <Link to={createPageUrl(item.page)} className="text-slate-700 hover:text-red-700 hover:bg-red-50 cursor-pointer">
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}

                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('AdminSaludos')} className="text-slate-700 hover:text-red-700 hover:bg-red-50 cursor-pointer">
                        Saludos
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Moderation')} className="text-slate-700 hover:text-red-700 hover:bg-red-50 cursor-pointer">
                        Moderación
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.reload()}
                className="rounded-full text-slate-700 hover:bg-cyan-50 hover:text-cyan-700"
                title="Refrescar"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>

              {currentUser ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="rounded-full hidden md:flex text-slate-700 hover:bg-cyan-50 hover:text-cyan-700"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => navigate(createPageUrl('Login'))}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-4 py-2 text-base shadow-sm"
                >
                  Iniciar Sesión
                </Button>
              )}

              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="lg:hidden flex flex-col items-center justify-center gap-1 bg-cyan-500 hover:bg-cyan-600 px-3 py-2 rounded-lg shadow-sm"
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <>
                    <div className="flex flex-col gap-1">
                      <div className="w-6 h-0.5 bg-white rounded"></div>
                      <div className="w-6 h-0.5 bg-white rounded"></div>
                      <div className="w-6 h-0.5 bg-white rounded"></div>
                    </div>
                    <span className="text-white text-xs font-bold">MENÚ</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div
              className="lg:hidden py-4 border-t border-cyan-200 bg-white/95 overflow-y-auto"
              style={{
                maxHeight: 'calc(100vh - 80px - env(safe-area-inset-top, 0px))'
              }}
            >
              <div className="space-y-2">
                <div className="bg-cyan-50 rounded-xl px-4 py-3 border border-cyan-200">
                  <span className="text-sm text-cyan-700 font-bold mb-2 block">🏆 CONCURSOS:</span>

                  <Link to={createPageUrl('Concurso')} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-700 hover:bg-white border border-transparent hover:border-cyan-200">
                    <Sparkles className="w-6 h-6 text-cyan-500" />
                    <span className="font-semibold text-base">Concurso</span>
                  </Link>

                  <Link to={createPageUrl('EscuchaYGana')} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-700 hover:bg-white border border-transparent hover:border-cyan-200">
                    <Music className="w-6 h-6 text-cyan-500" />
                    <span className="font-semibold text-base">Escucha y Gana</span>
                  </Link>

                  <Link to={createPageUrl('EscuchaYGanaResultados')} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-700 hover:bg-white border border-transparent hover:border-cyan-200">
                    <TrendingUp className="w-6 h-6 text-cyan-500" />
                    <span className="font-semibold text-base">Resultados</span>
                  </Link>

                  <Link to={createPageUrl('JuegaYGana')} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-700 hover:bg-white border border-transparent hover:border-cyan-200">
                    <Compass className="w-6 h-6 text-cyan-500" />
                    <span className="font-semibold text-base">Juega y Gana</span>
                  </Link>

                  <Link to={createPageUrl('Ganadores')} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-700 hover:bg-white border border-transparent hover:border-cyan-200">
                    <TrendingUp className="w-6 h-6 text-cyan-500" />
                    <span className="font-semibold text-base">Ganadores</span>
                  </Link>
                </div>

                {mobileNavItems.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                      currentPageName === item.page
                        ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                        : 'text-slate-700 bg-white hover:bg-cyan-50 border-cyan-100 hover:border-cyan-300'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 ${currentPageName === item.page ? 'text-white' : 'text-cyan-500'}`} />
                    <span className={`font-semibold text-base ${currentPageName === item.page ? 'text-white' : 'text-slate-700'}`}>
                      {item.name}
                    </span>

                    {item.page === 'Chat' && unreadMessagesCount > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                      </span>
                    )}
                  </Link>
                ))}

                {currentUser && authRequiredItems
                  .filter((item) => item.page !== 'MyAudios')
                  .map((item) => (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                        currentPageName === item.page
                          ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                          : 'text-slate-700 bg-white hover:bg-cyan-50 border-cyan-100 hover:border-cyan-300'
                      }`}
                    >
                      <item.icon className={`w-6 h-6 ${currentPageName === item.page ? 'text-white' : 'text-cyan-500'}`} />
                      <span className={`font-semibold text-base ${currentPageName === item.page ? 'text-white' : 'text-slate-700'}`}>
                        {item.name}
                      </span>
                    </Link>
                  ))}

                {canAccessTeamDesveladosRoom && (
                  <Link
                    to={createPageUrl('TeamDesveladosRoom')}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                      currentPageName === 'TeamDesveladosRoom'
                        ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                        : 'text-slate-700 bg-white hover:bg-cyan-50 border-cyan-100 hover:border-cyan-300'
                    }`}
                  >
                    <Users className={`w-6 h-6 ${currentPageName === 'TeamDesveladosRoom' ? 'text-white' : 'text-cyan-500'}`} />
                    <span className={`font-semibold text-base ${currentPageName === 'TeamDesveladosRoom' ? 'text-white' : 'text-slate-700'}`}>
                      TDV Charla
                    </span>
                  </Link>
                )}

                {creatorItems.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                      currentPageName === item.page
                        ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                        : 'text-slate-700 bg-white hover:bg-cyan-50 border-cyan-100 hover:border-cyan-300'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 ${currentPageName === item.page ? 'text-white' : 'text-cyan-500'}`} />
                    <span className={`font-semibold text-base ${currentPageName === item.page ? 'text-white' : 'text-slate-700'}`}>
                      {item.name}
                    </span>
                  </Link>
                ))}

                {currentUser?.role === 'admin' && adminItems.length > 0 && (
                  <div className="mt-4 bg-red-50 rounded-xl px-4 py-3 border border-red-200">
                    <span className="text-sm text-red-600 font-bold mb-2 block">🔐 ADMIN:</span>

                    <div className="mt-2 space-y-2">
                      {adminItems.map((item) => (
                        <Link
                          key={item.page}
                          to={createPageUrl(item.page)}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all border ${
                            currentPageName === item.page
                              ? 'bg-red-500 text-white border-red-500'
                              : 'text-slate-700 bg-white hover:bg-red-50 border-red-100 hover:border-red-300'
                          }`}
                        >
                          <item.icon className="w-6 h-6" />
                          <span className="font-semibold text-base">{item.name}</span>
                        </Link>
                      ))}

                      <Link
                        to={createPageUrl('AdminSaludos')}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all border ${
                          currentPageName === 'AdminSaludos'
                            ? 'bg-red-500 text-white border-red-500'
                            : 'text-slate-700 bg-white hover:bg-red-50 border-red-100 hover:border-red-300'
                        }`}
                      >
                        <Mic className="w-6 h-6" />
                        <span className="font-semibold text-base">Saludos</span>
                      </Link>

                      <Link
                        to={createPageUrl('Moderation')}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all border ${
                          currentPageName === 'Moderation'
                            ? 'bg-red-500 text-white border-red-500'
                            : 'text-slate-700 bg-white hover:bg-red-50 border-red-100 hover:border-red-300'
                        }`}
                      >
                        <Shield className="w-6 h-6" />
                        <span className="font-semibold text-base">Moderación</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#e9f9ff] via-[#f5fcff] to-[#ffffff]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(125,211,252,0.20),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(103,232,249,0.14),transparent_60%)]" />
        <div className="relative z-10">
          {children}
        </div>
      </main>

      <GlobalAzuraCastPlayer />
      <GlobalMiniPlayer />

      <footer className="bg-white border-t border-cyan-200 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-cyan-700 font-semibold">
              TEAM DESVELADOS LLDM - Comunidad de LLDM donde todos son bienvenidos
            </p>
            <p className="text-sm text-slate-500 mt-2">
              © 2026 Todos los derechos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
