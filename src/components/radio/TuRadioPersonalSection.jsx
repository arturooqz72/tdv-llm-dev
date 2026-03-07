import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Music, Play, Pause, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { startGlobalProgram } from '@/components/radio/GlobalMiniPlayer';

export default function TuRadioPersonalSection({ programs = [] }) {
  const [search, setSearch] = useState('');

  const filtered = programs.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    (p.created_by && p.created_by.toLowerCase().includes(search.toLowerCase()))
  );

  const handlePlay = (program) => {
    if (!program.audio_url) return;
    const index = filtered.findIndex(p => p.id === program.id);
    startGlobalProgram(filtered, index >= 0 ? index : 0);
  };

  const isPlaying = (programId) => {
    const state = window.__radioPlayer;
    if (!state || state.currentIndex < 0) return false;
    const current = state.programs[state.currentIndex];
    return current?.id === programId && state.isPlaying;
  };

  return (
    <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Music className="w-4 h-4 text-cyan-400" />
        <span className="text-white font-semibold text-sm">Elige un canto</span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Buscar canto o programa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 border-gray-600 text-white pl-9 h-10 text-sm"
        />
      </div>

      {/* List */}
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No se encontraron programas</p>
        )}

        {filtered.map((program) => {
          const playing = isPlaying(program.id);

          return (
            <div
              key={program.id}
              className={`flex items-center justify-between px-3 py-3 rounded-lg transition-all ${
                playing ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-gray-800'
              }`}
            >
              {/* IZQUIERDA: TÍTULO + REPRODUCIR */}
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between w-full">
                  {/* Título */}
                  <p className={`font-medium text-sm truncate ${playing ? 'text-cyan-400' : 'text-white'}`}>
                    {program.title}
                  </p>

                  {/* Reproducir */}
                  <span className="text-cyan-400 text-xs font-semibold mr-3">
                    Reproducir
                  </span>
                </div>

                {/* Descripción */}
                <p className="text-gray-500 text-xs truncate mt-1">
                  {program.created_by?.split('@')[0] || 'Desconocido'}
                  {program.description ? ` — ${program.description}` : ''}
                </p>
              </div>

              {/* Botón Play/Pause */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePlay(program);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-3 transition-all ${
                  playing 
                    ? 'bg-cyan-500 text-black' 
                    : 'bg-gray-700 text-white hover:bg-cyan-500 hover:text-black'
                }`}
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
