import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Radio as RadioIcon, Play, Pause } from "lucide-react";

export default function GlobalAzuraCastPlayer() {
  const RADIO_BASE = "https://radio.team-desveladoslldm.com";
  const STATION = "tdv_lldm-christian_radio";

  const STREAMS = [
    `${RADIO_BASE}/listen/${STATION}/radio.mp3`,
    `${RADIO_BASE}/listen/${STATION}/radio.aac`,
  ];

  const [isPlaying, setIsPlaying] = useState(false);
  const [streamIndex, setStreamIndex] = useState(0);
  const [status, setStatus] = useState("Listo");
  const [isClosed, setIsClosed] = useState(false);
  const audioRef = useRef(null);

  const currentStream = STREAMS[streamIndex];

  const loadStream = (url) => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.src = url;
    audioRef.current.load();
  };

  const tryNext = () => {
    const next = (streamIndex + 1) % STREAMS.length;
    setStreamIndex(next);
    setStatus("Probando otra ruta...");
    setTimeout(() => loadStream(STREAMS[next]), 100);
  };

  useEffect(() => {
    loadStream(currentStream);
  }, [streamIndex]);

  const toggle = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setStatus("Pausado");
      return;
    }

    setStatus("Conectando...");
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setStatus("Reproduciendo");
    } catch {
      setIsPlaying(false);
      setStatus("No compatible, cambiando...");
      tryNext();
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
    <div className="fixed bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-80 z-40">
      <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-5 shadow-2xl">
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 bg-black/70 rounded p-1 z-10 hover:bg-black transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 w-4 h-4">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <RadioIcon className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold truncate">Radio Team Desvelados 24/7</p>
            <p className="text-gray-400 text-xs truncate">
              {status} · {streamIndex + 1}/{STREAMS.length}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-3">
          <Button
            onClick={toggle}
            className="flex-1 h-10 font-bold bg-yellow-500 text-black hover:bg-yellow-400 rounded-lg"
          >
            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isPlaying ? "Pausar" : "Reproducir"}
          </Button>

          <Button
            onClick={tryNext}
            variant="secondary"
            className="h-10 rounded-lg bg-white/10 text-white hover:bg-white/15"
          >
            Cambiar
          </Button>

          <a 
            href={`${RADIO_BASE}/public/${STATION}`}
            target="_blank"
            rel="noreferrer"
            className="h-10 px-3 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6"></path>
              <path d="M10 14 21 3"></path>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            </svg>
          </a>
        </div>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}