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
  MessageCircle,
  Users,
  Radio,
  Cake,
  Sparkles,
  Shield,
  Music,
  Bell,
  Calendar,
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
    { name: 'En Vivo', icon: Radio, page: 'LiveStreams' },
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

  const creatorItems = currentUser
    ? [{ name: 'Dashboard Radio', icon: Radio, page: 'RadioDashboard' }]
    : [];

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
    <div className="min-h-screen bg-black">
      <nav
        className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-cyan-500 shadow-sm"
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
              <div className="w-10 h-10 rounded-full ring-2 ring-cyan-500 ring-offset-2">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6965d0214fc84ccf68275f1d/ecac80ce7_teamdesveladosLLDM.png"
                  alt="Team Desvelados LLDM"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>

              <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent hidden sm:block">
                TEAM DESVELADOS LLDM
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              <Link
                to={createPageUrl('Home')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPageName === 'Home'
                    ? 'bg-cyan-500 text-black'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                Inicio
              </Link>

              <Link
                to={createPageUrl('EnviarSaludos')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPageName === 'EnviarSaludos'
                    ? 'bg-cyan-500 text-black'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                Radio 24/7 Saludos
              </Link>

              <Link
                to={createPageUrl('Videos')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPageName === 'Videos'
                    ? 'bg-cyan-500 text-black'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                Videos
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-all">
                  Juegos <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-cyan-500/30">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Explore')} className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
                      Todos los Juegos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('RankingJuegos')} className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
                      Ranking
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Memorama')} className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
                      Memorama
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-all">
                  Concursos <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-cyan-500/30">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Concurso')} className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
                      Concurso
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('EscuchaYGana')} className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
                      Escucha y Gana
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('EscuchaYGanaResultados')} className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
                      Resultados
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('JuegaYGana')} className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
                      Juega y Gana
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Ganadores')} className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
                      Ganadores
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link
                to={createPageUrl('MyAudios')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPageName === 'MyAudios'
                    ? 'bg-cyan-500 text-black'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                LLDMPlay
              </Link>

              <Link
                to={createPageUrl('LiveStreams')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPageName === 'LiveStreams'
                    ? 'bg-cyan-500 text-black'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                En Vivo
              </Link>

              <Link
                to={createPageUrl('Birthdays')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPageName === 'Birthdays'
                    ? 'bg-cyan-500 text-black'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                Cumpleaños
              </Link>

              <Link
                to={createPageUrl('GroupChat')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPageName === 'GroupChat'
                    ? 'bg-cyan-500 text-black'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                Salas de Chat
              </Link>

              {canAccessTeamDesveladosRoom && (
                <Link
                  to={createPageUrl('TeamDesveladosRoom')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPageName === 'TeamDesveladosRoom'
                      ? 'bg-cyan-500 text-black'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  Sala Team Desvelados
                </Link>
              )}

              <Link
                to={createPageUrl('Users')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPageName === 'Users'
                    ? 'bg-cyan-500 text-black'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
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
                        ? 'bg-cyan-500 text-black'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    Subir
                  </Link>

                  <Link
                    to={createPageUrl('Suggestions')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentPageName === 'Suggestions'
                        ? 'bg-cyan-500 text-black'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    Sugerencias
                  </Link>

                  <Link
                    to={createPageUrl('Profile')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentPageName === 'Profile'
                        ? 'bg-cyan-500 text-black'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    Perfil
                  </Link>

                  <Link
                    to={createPageUrl('NotificationSettings')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentPageName === 'NotificationSettings'
                        ? 'bg-cyan-500 text-black'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    Notificaciones
                  </Link>
                </>
              )}

              {currentUser?.role === 'admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-gray-800 hover:text-red-300 transition-all">
                    Admin <ChevronDown className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-900 border-red-500/30">
                    {adminItems.map((item) => (
                      <DropdownMenuItem asChild key={item.page}>
                        <Link to={createPageUrl(item.page)} className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}

                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('AdminSaludos')} className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
                        Saludos
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('AdminChatRooms')} className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
                        Salas de Chats
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Moderation')} className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
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
                className="rounded-full text-white hover:bg-gray-800"
                title="Refrescar"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>

              {currentUser ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="rounded-full hidden md:flex text-white hover:bg-gray-800"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => navigate(createPageUrl('Login'))}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-4 py-2 text-base shadow-lg"
                >
                  Iniciar Sesión
                </Button>
              )}

              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="lg:hidden flex flex-col items-center justify-center gap-1 bg-cyan-500 hover:bg-cyan-600 px-3 py-2 rounded-lg"
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
              className="lg:hidden py-4 border-t border-cyan-500 bg-gray-900 overflow-y-auto"
              style={{
                maxHeight: 'calc(100vh - 80px - env(safe-area-inset-top, 0px))'
              }}
            >
              <div className="space-y-2">
                <div className="bg-gray-800 rounded-xl px-4 py-3 border border-cyan-500/30">
                  <span className="text-sm text-cyan-400 font-bold mb-2 block">🏆 CONCURSOS:</span>

                  <Link to={createPageUrl('Concurso')} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-white hover:bg-cyan-500/20 border border-transparent hover:border-cyan-500">
                    <Sparkles className="w-6 h-6 text-cyan-400" />
                    <span className="font-semibold text-base">Concurso</span>
                  </Link>

                  <Link to={createPageUrl('EscuchaYGana')} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-white hover:bg-cyan-500/20 border border-transparent hover:border-cyan-500">
                    <Music className="w-6 h-6 text-cyan-400" />
                    <span className="font-semibold text-base">Escucha y Gana</span>
                  </Link>

                  <Link to={createPageUrl('EscuchaYGanaResultados')} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-white hover:bg-cyan-500/20 border border-transparent hover:border-cyan-500">
                    <TrendingUp className="w-6 h-6 text-cyan-400" />
                    <span className="font-semibold text-base">Resultados</span>
                  </Link>

                  <Link to={createPageUrl('JuegaYGana')} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-white hover:bg-cyan-500/20 border border-transparent hover:border-cyan-500">
                    <Compass className="w-6 h-6 text-cyan-400" />
                    <span className="font-semibold text-base">Juega y Gana</span>
                  </Link>

                  <Link to={createPageUrl('Ganadores')} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-white hover:bg-cyan-500/20 border border-transparent hover:border-cyan-500">
                    <TrendingUp className="w-6 h-6 text-cyan-400" />
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
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-black border-cyan-400'
                        : 'text-white bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-cyan-500'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 ${currentPageName === item.page ? 'text-black' : 'text-cyan-400'}`} />
                    <span className={`font-semibold text-base ${currentPageName === item.page ? 'text-black' : 'text-white'}`}>
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
                          ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-black border-cyan-400'
                          : 'text-white bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-cyan-500'
                      }`}
                    >
                      <item.icon className={`w-6 h-6 ${currentPageName === item.page ? 'text-black' : 'text-cyan-400'}`} />
                      <span className={`font-semibold text-base ${currentPageName === item.page ? 'text-black' : 'text-white'}`}>
                        {item.name}
                      </span>
                    </Link>
                  ))}

                <Link
                  to={createPageUrl('GroupChat')}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                    currentPageName === 'GroupChat'
                      ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-black border-cyan-400'
                      : 'text-white bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-cyan-500'
                  }`}
                >
                  <Users className={`w-6 h-6 ${currentPageName === 'GroupChat' ? 'text-black' : 'text-cyan-400'}`} />
                  <span className={`font-semibold text-base ${currentPageName === 'GroupChat' ? 'text-black' : 'text-white'}`}>
                    Salas de Chat
                  </span>
                </Link>

                {canAccessTeamDesveladosRoom && (
                  <Link
                    to={createPageUrl('TeamDesveladosRoom')}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                      currentPageName === 'TeamDesveladosRoom'
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-black border-cyan-400'
                        : 'text-white bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-cyan-500'
                    }`}
                  >
                    <Users className={`w-6 h-6 ${currentPageName === 'TeamDesveladosRoom' ? 'text-black' : 'text-cyan-400'}`} />
                    <span className={`font-semibold text-base ${currentPageName === 'TeamDesveladosRoom' ? 'text-black' : 'text-white'}`}>
                      Sala Team Desvelados
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
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-black border-cyan-400'
                        : 'text-white bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-cyan-500'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 ${currentPageName === item.page ? 'text-black' : 'text-cyan-400'}`} />
                    <span className={`font-semibold text-base ${currentPageName === item.page ? 'text-black' : 'text-white'}`}>
                      {item.name}
                    </span>
                  </Link>
                ))}

                {currentUser?.role === 'admin' && adminItems.length > 0 && (
                  <div className="mt-4 bg-gray-800 rounded-xl px-4 py-3 border border-red-500/30">
                    <span className="text-sm text-red-400 font-bold mb-2 block">🔐 ADMIN:</span>

                    <div className="mt-2 space-y-2">
                      {adminItems.map((item) => (
                        <Link
                          key={item.page}
                          to={createPageUrl(item.page)}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all border ${
                            currentPageName === item.page
                              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500'
                              : 'text-white bg-gray-900 hover:bg-gray-800 border-gray-700 hover:border-red-500'
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
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500'
                            : 'text-white bg-gray-900 hover:bg-gray-800 border-gray-700 hover:border-red-500'
                        }`}
                      >
                        <Mic className="w-6 h-6" />
                        <span className="font-semibold text-base">Saludos</span>
                      </Link>

                      <Link
                        to={createPageUrl('AdminChatRooms')}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all border ${
                          currentPageName === 'AdminChatRooms'
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500'
                            : 'text-white bg-gray-900 hover:bg-gray-800 border-gray-700 hover:border-red-500'
                        }`}
                      >
                        <MessageCircle className="w-6 h-6" />
                        <span className="font-semibold text-base">Salas de Chats</span>
                      </Link>

                      <Link
                        to={createPageUrl('Moderation')}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all border ${
                          currentPageName === 'Moderation'
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500'
                            : 'text-white bg-gray-900 hover:bg-gray-800 border-gray-700 hover:border-red-500'
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

      <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0B3A4A] via-[#061F2B] to-[#030B10]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.22),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.14),transparent_60%)]" />
        <div className="relative z-10">
          {children}
        </div>
      </main>

      <GlobalAzuraCastPlayer />
      <GlobalMiniPlayer />

      <footer className="bg-black border-t border-cyan-500 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-cyan-400 font-semibold">
              TEAM DESVELADOS LLDM - Comunidad de LLDM donde todos son bienvenidos
            </p>
            <p className="text-sm text-gray-400 mt-2">
              © 2026 Todos los derechos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
