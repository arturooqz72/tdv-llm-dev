import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Upload,
  User,
  LogOut,
  Menu,
  X,
  RefreshCw,
  LogIn,
} from 'lucide-react';

import GlobalMiniPlayer from '@/components/radio/GlobalMiniPlayer';
import GlobalAzuraCastPlayer from '@/components/radio/GlobalAzuraCastPlayer';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout(false);
    navigate(createPageUrl('Home'));
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const mainLinks = [
    { label: 'Inicio', page: 'Home' },
    { label: 'Radio\n24/7\nSaludos', page: 'Radio' },
    { label: 'Videos', page: 'Videos' },
    { label: 'Juegos', page: 'JuegaYGana' },
    { label: 'Concursos', page: 'Concurso' },
    { label: 'LLDMPlay', page: 'PublicAudios' },
    { label: 'Cumpleaños', page: 'Birthdays' },
    { label: 'Salas\nde\nChat', page: 'Chat' },
    { label: 'Sala Team\nDesvelados', page: 'TeamDesveladosRoom' },
    { label: 'Miembros', page: 'Users' },
    { label: 'Subir', page: 'Upload' },
    { label: 'Sugerencias', page: 'Suggestions' },
  ];

  const userLinks = [
    ...(currentUser
      ? [
          { label: 'Perfil', page: 'Profile' },
          { label: 'Notificaciones', page: 'NotificationCenter' },
        ]
      : []),
    ...(currentUser?.role === 'admin'
      ? [{ label: 'Admin', page: 'AdminStats', danger: true }]
      : []),
  ];

  const allMobileLinks = [...mainLinks, ...userLinks];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-black border-b border-cyan-500/60">
        <div className="max-w-[1800px] mx-auto px-3">
          <div className="flex items-center justify-between min-h-[76px] gap-3">
            <Link
              to={createPageUrl('Home')}
              className="flex items-center gap-3 shrink-0"
            >
              <div className="w-11 h-11 rounded-full overflow-hidden border border-cyan-400/70 bg-black flex items-center justify-center">
                <img
                  src="/favicon.ico"
                  alt="TDV"
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div className="text-cyan-400 font-extrabold leading-none text-[16px] md:text-[18px]">
                <div>TEAM</div>
                <div>DESVELADOS</div>
                <div>LLDM</div>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-center">
              {mainLinks.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  onClick={() => navigate(createPageUrl(item.page))}
                  className="text-white hover:text-cyan-300 hover:bg-cyan-500/10 px-3 py-2 h-auto whitespace-pre-line text-[14px] font-semibold"
                >
                  {item.label}
                </Button>
              ))}

              {userLinks.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  onClick={() => navigate(createPageUrl(item.page))}
                  className={`px-3 py-2 h-auto whitespace-pre-line text-[14px] font-semibold ${
                    item.danger
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                      : 'text-white hover:text-cyan-300 hover:bg-cyan-500/10'
                  }`}
                >
                  {item.label}
                </Button>
              ))}

              {currentUser && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    className="text-white hover:text-cyan-300 hover:bg-cyan-500/10"
                    title="Recargar"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-white hover:text-cyan-300 hover:bg-cyan-500/10"
                    title="Salir"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              )}
            </nav>

            <div className="hidden lg:flex items-center gap-2 shrink-0">
              {!currentUser && (
                <Button
                  onClick={() => navigate(createPageUrl('Login'))}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                >
                  Entrar
                </Button>
              )}
            </div>

            <div className="lg:hidden flex items-center gap-2">
              {currentUser ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    className="text-white hover:text-cyan-300 hover:bg-cyan-500/10"
                    title="Recargar"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-white hover:text-cyan-300 hover:bg-cyan-500/10"
                    title="Salir"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(createPageUrl('Login'))}
                  className="text-white hover:text-cyan-300 hover:bg-cyan-500/10"
                  title="Entrar"
                >
                  <LogIn className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="text-white hover:text-cyan-300 hover:bg-cyan-500/10"
                title="Menú"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-cyan-500/30 py-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allMobileLinks.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    onClick={() => {
                      navigate(createPageUrl(item.page));
                      setMobileMenuOpen(false);
                    }}
                    className={`justify-start text-left h-auto py-3 px-3 whitespace-pre-line ${
                      item.danger
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                        : 'text-white hover:text-cyan-300 hover:bg-cyan-500/10'
                    }`}
                  >
                    {item.label}
                  </Button>
                ))}

                {!currentUser && (
                  <Button
                    onClick={() => {
                      navigate(createPageUrl('Login'));
                      setMobileMenuOpen(false);
                    }}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                  >
                    Entrar
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <GlobalMiniPlayer />
      <GlobalAzuraCastPlayer />

      <main>{children}</main>
    </div>
  );
}
