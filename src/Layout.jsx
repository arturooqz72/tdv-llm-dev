import React, { useState } from 'react';
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
  RefreshCw
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import GlobalMiniPlayer from '@/components/radio/GlobalMiniPlayer';
import GlobalAzuraCastPlayer from '@/components/radio/GlobalAzuraCastPlayer';

export default function Layout({ children }) {

  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(createPageUrl("Home"));
  };

  return (
    <div className="min-h-screen bg-background">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">

        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* Logo */}
          <Link
            to={createPageUrl("Home")}
            className="text-lg font-bold flex items-center gap-2"
          >
            <Mic className="w-5 h-5 text-yellow-500" />
            Team Desvelados
          </Link>

          {/* MENU DESKTOP */}
          <nav className="hidden md:flex items-center gap-4">

            <Button variant="ghost" onClick={() => navigate(createPageUrl("Home"))}>
              <Home className="w-4 h-4 mr-2" />
              Inicio
            </Button>

            <Button variant="ghost" onClick={() => navigate(createPageUrl("Explore"))}>
              <Compass className="w-4 h-4 mr-2" />
              Explorar
            </Button>

            <Button variant="ghost" onClick={() => navigate(createPageUrl("Radio"))}>
              <Radio className="w-4 h-4 mr-2" />
              Radio
            </Button>

            <Button variant="ghost" onClick={() => navigate(createPageUrl("Videos"))}>
              <Music className="w-4 h-4 mr-2" />
              Videos
            </Button>

            <Button variant="ghost" onClick={() => navigate(createPageUrl("Chat"))}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>

            <Button variant="ghost" onClick={() => navigate(createPageUrl("Birthdays"))}>
              <Cake className="w-4 h-4 mr-2" />
              Cumpleaños
            </Button>

          </nav>

          {/* USER MENU */}
          <div className="flex items-center gap-3">

            {currentUser && (
              <Button
                variant="ghost"
                onClick={() => navigate(createPageUrl("Profile"))}
              >
                <User className="w-4 h-4 mr-2" />
                Perfil
              </Button>
            )}

            {currentUser?.role === "admin" && (
              <Button
                variant="ghost"
                onClick={() => navigate(createPageUrl("AdminStats"))}
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}

            {currentUser ? (
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            ) : (
              <Button onClick={() => navigate(createPageUrl("Login"))}>
                Entrar
              </Button>
            )}

          </div>
        </div>

      </header>

      {/* RADIO PLAYER GLOBAL */}
      <GlobalMiniPlayer />
      <GlobalAzuraCastPlayer />

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

    </div>
  );
}
