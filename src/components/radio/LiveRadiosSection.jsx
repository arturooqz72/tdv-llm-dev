import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Users, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LiveRadiosSection() {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.log('No autenticado');
      }
    };
    loadUser();
  }, []);

  const { data: liveRadios = [] } = useQuery({
    queryKey: ['live-radios'],
    queryFn: () => base44.entities.LiveRadio.filter({ is_live: true }, '-created_date'),
    refetchInterval: 300000, // 5 minutos
    staleTime: 240000, // 4 minutos
    refetchOnWindowFocus: false
  });

  const handleDelete = async (e, radioId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Eliminar esta transmisión en vivo?')) return;
    
    try {
      await base44.entities.LiveRadio.delete(radioId);
      queryClient.invalidateQueries(['live-radios']);
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar la transmisión');
    }
  };

  if (liveRadios.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto mb-8">
      <Card className="bg-gradient-to-br from-red-900 to-red-800 border-2 border-red-600">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              </div>
              <h2 className="text-2xl font-bold text-white">Transmisiones en Vivo</h2>
            </div>
            <Link to={createPageUrl('StartLiveRadio')}>
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-black">
                <Plus className="w-4 h-4 mr-2" />
                Transmitir Ahora
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveRadios.map((radio) => (
              <Link key={radio.id} to={createPageUrl(`LiveRadioPlayer?id=${radio.id}`)}>
                <Card className="bg-gray-800 border-yellow-600 hover:shadow-lg hover:shadow-yellow-600/20 transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center flex-shrink-0">
                        <Radio className="w-6 h-6 text-black animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold mb-1 truncate">{radio.title}</h3>
                        {radio.description && (
                          <p className="text-gray-400 text-sm mb-2 line-clamp-1">{radio.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {radio.listeners_count || 0} oyentes
                          </span>
                          <span className="text-red-500 font-medium">● EN VIVO</span>
                        </div>
                      </div>
                      {currentUser && (currentUser.email === radio.created_by || currentUser.role === 'admin') && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => handleDelete(e, radio.id)}
                          className="text-red-500 hover:bg-red-500/20 flex-shrink-0"
                          title="Eliminar transmisión"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}