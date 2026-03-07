import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Radio as RadioIcon, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";

// Estado global del reproductor AzuraCast
let globalAudioElement = null;
let globalIsPlaying = false;
let globalStreamIndex = 0;
let globalVolume = 0.7;
let globalIsMuted = false;
let listeners = [];

const RADIO_BASE = "https://radio.team-desveladoslldm.com";
const STATION = "tdv_lldm-christian_radio";
const STREAMS = [
  `${RADIO_BASE}/listen/${STATION}/radio.mp3`,
  `${RADIO_BASE}/listen/${STATION}/radio.aac`,
];

function notify() {
  listeners.forEach(fn => fn());
}

// Exponer funciones globales
if (typeof window !== 'undefined') {
  window.pauseAzuraCast = () => {
    if (globalAudioElement) {
      globalAudioElement.pause();
    }
  };
}

// Inicializar el audio global una sola vez
if (!globalAudioElement && typeof window !== 'undefined') {
  globalAudioElement = new Audio();
  globalAudioElement.volume = globalVolume;
  
  globalAudioElement.addEventListener('play', () => {
    globalIsPlaying = true;
    notify();
  });
  
  globalAudioElement.addEventListener('pause', () => {
    globalIsPlaying = false;
    notify();
  });
  
  globalAudioElement.addEventListener('error', () => {
    console.error('Error en la transmisión');
    globalIsPlaying = false;
    notify();
  });
}

export function useAzuraCastPlayer() {
  const [, setUpdate] = useState(0);
  
  useEffect(() => {
    const listener = () => setUpdate(prev => prev + 1);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);
  
  return {
    isPlaying: globalIsPlaying,
    volume: globalVolume,
    isMuted: globalIsMuted,
    streamIndex: globalStreamIndex
  };
}

export function playAzuraCast() {
  if (!globalAudioElement) return;
  
  // Detener el minireproductor si está tocando
  if (window.__radioPlayer?.audio && window.__radioPlayer.isPlaying) {
    if (window.stopGlobalPlayer) {
      window.stopGlobalPlayer();
    }
  }
  
  if (!globalAudioElement.src || globalAudioElement.src !== STREAMS[globalStreamIndex]) {
    globalAudioElement.src = STREAMS[globalStreamIndex];
    globalAudioElement.load();
  }
  
  globalAudioElement.play().catch(err => {
    console.error('Error al reproducir:', err);
    // Intentar con el siguiente stream
    globalStreamIndex = (globalStreamIndex + 1) % STREAMS.length;
    globalAudioElement.src = STREAMS[globalStreamIndex];
    globalAudioElement.load();
    globalAudioElement.play().catch(() => {
      globalIsPlaying = false;
      notify();
    });
  });
}

export function pauseAzuraCast() {
  if (globalAudioElement) {
    globalAudioElement.pause();
  }
}

export function toggleAzuraCast() {
  if (globalIsPlaying) {
    pauseAzuraCast();
  } else {
    playAzuraCast();
  }
}

export function setAzuraCastVolume(value) {
  globalVolume = value;
  if (globalAudioElement) {
    globalAudioElement.volume = value;
  }
  notify();
}

export function toggleAzuraCastMute() {
  globalIsMuted = !globalIsMuted;
  if (globalAudioElement) {
    globalAudioElement.muted = globalIsMuted;
  }
  notify();
}

export function switchAzuraCastStream() {
  globalStreamIndex = (globalStreamIndex + 1) % STREAMS.length;
  if (globalAudioElement) {
    const wasPlaying = globalIsPlaying;
    globalAudioElement.pause();
    globalAudioElement.src = STREAMS[globalStreamIndex];
    globalAudioElement.load();
    if (wasPlaying) {
      globalAudioElement.play();
    }
  }
  notify();
}

export default function AzuraCastPlayer() {
  const { isPlaying, volume, isMuted, streamIndex } = useAzuraCastPlayer();
  const [status, setStatus] = useState("Listo");

  useEffect(() => {
    if (isPlaying) {
      setStatus("Reproduciendo");
    } else {
      setStatus("Pausado");
    }
  }, [isPlaying]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border-2 border-cyan-500/50 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/30 flex items-center justify-center border-2 border-cyan-500">
                <RadioIcon className="w-8 h-8 text-cyan-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-white text-xl font-bold">Radio Team Desvelados 24/7</h3>
                <p className="text-gray-300 text-sm">
                  {status} · Ruta {streamIndex + 1}/{STREAMS.length}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <Button
                onClick={toggleAzuraCast}
                className="flex-1 h-12 font-bold bg-cyan-500 text-black hover:bg-cyan-400"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Reproducir
                  </>
                )}
              </Button>

              <Button
                onClick={switchAzuraCastStream}
                variant="secondary"
                className="h-12 bg-white/10 text-white hover:bg-white/20"
              >
                Cambiar Ruta
              </Button>

              <a 
                href={`${RADIO_BASE}/public/${STATION}`}
                target="_blank"
                rel="noreferrer"
                className="h-12 px-4 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6"></path>
                  <path d="M10 14 21 3"></path>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                </svg>
              </a>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAzuraCastMute}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                max={100}
                step={1}
                onValueChange={(val) => setAzuraCastVolume(val[0] / 100)}
                className="flex-1"
              />
              <span className="text-gray-300 text-sm w-10 text-right">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}