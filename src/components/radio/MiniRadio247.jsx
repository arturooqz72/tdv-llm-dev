import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export default function MiniRadio247() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('https://radio.team-desveladoslldm.com/listen/tdv_lldm-christian_radio/radio.mp3');
  const [isLoading, setIsLoading] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const routes = [
    'https://radio.team-desveladoslldm.com/listen/tdv_lldm-christian_radio/radio.mp3',
    'https://radio.team-desveladoslldm.com/radio/8000/radio.mp3',
    'https://radio.team-desveladoslldm.com/radio/8010/radio.mp3',
    'https://radio.team-desveladoslldm.com/radio/8020/radio.mp3'
  ];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentRoute;
      audioRef.current.load();
    }
  }, [currentRoute]);

  const testRoute = async (route, index) => {
    setIsLoading(true);
    setCurrentRoute(route);
    
    try {
      if (audioRef.current) {
        audioRef.current.src = route;
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error(`Error en ruta ${index + 1}:`, error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error al reproducir:', error);
      setIsPlaying(false);
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsClosed(true);
  };

  if (isClosed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-40 md:w-80">
      <div className="bg-gray-900 border border-yellow-600 rounded-xl shadow-2xl relative">
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 bg-black/70 rounded p-1 z-10 hover:bg-black transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500 w-4 h-4">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </button>

        <div className="p-3 md:p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-yellow-500/15 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
                <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
                <circle cx="12" cy="12" r="2"></circle>
                <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
                <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm md:text-base">Radio 24/7</p>
              <p className="text-gray-400 text-xs">Team Desvelados</p>
            </div>
          </div>

          <p className="text-gray-300 text-xs mb-2 md:mb-3">
            Probando otra ruta... · {routes.indexOf(currentRoute) + 1}/4
          </p>

          <div className="flex gap-1.5 md:gap-2">
            <button 
              onClick={togglePlay}
              disabled={isLoading}
              className="flex-1 h-9 md:h-10 bg-yellow-500 text-black font-bold rounded-lg flex items-center justify-center gap-1.5 md:gap-2 hover:bg-yellow-400 text-xs md:text-sm"
            >
              {isPlaying ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                  <span className="hidden sm:inline">Pausar</span>
                  <span className="sm:hidden">⏸️</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="6 3 20 12 6 21 6 3"></polygon>
                  </svg>
                  <span className="hidden sm:inline">Reproducir</span>
                  <span className="sm:hidden">▶️</span>
                </>
              )}
            </button>

            <button 
              onClick={() => {
                const nextIndex = routes.indexOf(currentRoute) + 1;
                const idx = nextIndex >= routes.length ? 0 : nextIndex;
                testRoute(routes[idx], idx);
              }}
              className="h-9 md:h-10 px-2 md:px-3 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs md:text-sm"
            >
              Probar
            </button>

            <a 
              href="https://radio.team-desveladoslldm.com/public/tdv_lldm-christian_radio"
              target="_blank"
              rel="noreferrer"
              className="h-9 md:h-10 px-2 md:px-3 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="corner">
                <path d="M15 3h6v6"></path>
                <path d="M10 14 21 3"></path>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              </svg>
            </a>
          </div>

          <audio preload="none" src={currentRoute} ref={audioRef} onEnded={() => setIsPlaying(false)} />
        </div>
      </div>
    </div>
  );
}