import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, Lock, Trash2, X, Shield, MessageCircle, EyeOff, Eye, Globe } from 'lucide-react';

export default function AdminChatRooms() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        if (user.role !== 'admin') {
          alert('Solo administradores pueden acceder');
          window.history.back();
          return;
        }
        setCurrentUser(user);
      } catch (error) {
        base44.auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const { data: allRooms = [], refetch: refetchRooms } = useQuery({
    queryKey: ['admin-all-rooms'],
    queryFn: async () => {
      const all = await base44.entities.ChatRoom.list('-created_date', 200);
      const allMembers = await base44.entities.ChatRoomMember.list();
      // Enriquecer cada sala con el conteo real de miembros
      return all.map(room => ({
        ...room,
        real_members_count: allMembers.filter(m => m.room_id === room.id).length
      }));
    },
    enabled: !!currentUser,
    refetchInterval: 5000
  });

  const { data: roomMessages = [] } = useQuery({
    queryKey: ['admin-room-messages', selectedRoom?.id],
    queryFn: () => base44.entities.GroupChatMessage.filter({ room_id: selectedRoom.id }, '-created_date', 200),
    enabled: !!selectedRoom,
    refetchInterval: 5000
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId) => {
      const members = await base44.entities.ChatRoomMember.filter({ room_id: roomId });
      for (const m of members) await base44.entities.ChatRoomMember.delete(m.id);
      const msgs = await base44.entities.GroupChatMessage.filter({ room_id: roomId });
      for (const msg of msgs) await base44.entities.GroupChatMessage.delete(msg.id);
      await base44.entities.ChatRoom.delete(roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-rooms'] });
      setSelectedRoom(null);
    }
  });

  const toggleRoomMutation = useMutation({
    mutationFn: async ({ roomId, isDisabled }) => {
      await base44.entities.ChatRoom.update(roomId, { is_disabled: isDisabled });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-all-rooms'] })
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (msgId) => base44.entities.GroupChatMessage.delete(msgId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-room-messages', selectedRoom?.id] })
  });

  const handleDeleteRoom = (room) => {
    if (confirm(`¿Eliminar la sala "${room.name}"? Esto borrará todos los mensajes y miembros.`)) {
      deleteRoomMutation.mutate(room.id);
    }
  };

  const handleToggleRoom = (room) => {
    const action = room.is_disabled ? 'habilitar' : 'deshabilitar';
    if (confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} la sala "${room.name}"?`)) {
      toggleRoomMutation.mutate({ roomId: room.id, isDisabled: !room.is_disabled });
    }
  };

  const handleDeleteMessage = (msg) => {
    if (confirm('¿Eliminar este mensaje?')) {
      deleteMessageMutation.mutate(msg.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-white">Cargando...</p>
      </div>
    );
  }

  const publicRooms = allRooms.filter(r => r.type !== 'private');
  const privateRooms = allRooms.filter(r => r.type === 'private');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Moderación de Salas de Chat</h1>
          <p className="text-gray-400">Gestiona y modera todas las salas ({allRooms.length} en total)</p>
        </div>

        {selectedRoom ? (
          // VISTA DE MENSAJES DE UNA SALA
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedRoom.icon || '💬'}</div>
                <div>
                  <h2 className="text-white text-2xl font-bold">{selectedRoom.name}</h2>
                  <p className="text-gray-400 text-sm">{roomMessages.length} mensajes</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setSelectedRoom(null)} className="border-gray-600 text-white">
                <X className="w-4 h-4 mr-2" /> Volver
              </Button>
            </div>

            <div className="bg-gray-800 rounded-2xl border border-gray-700 divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
              {roomMessages.length === 0 ? (
                <div className="py-16 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400">No hay mensajes en esta sala</p>
                </div>
              ) : (
                roomMessages.map(msg => (
                  <div key={msg.id} className="flex items-start justify-between p-4 hover:bg-gray-700/50 transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-400 font-semibold text-sm">{msg.user_name}</span>
                        <span className="text-gray-500 text-xs">{msg.user_email}</span>
                        <span className="text-gray-600 text-xs">
                          {new Date(msg.created_date).toLocaleString('es-MX')}
                        </span>
                      </div>
                      {msg.content && <p className="text-gray-200 text-sm break-words">{msg.content}</p>}
                      {msg.file_url && (
                        <div className="mt-2">
                          {msg.file_type === 'image' ? (
                            <img src={msg.file_url} alt="" className="max-h-32 rounded-lg" />
                          ) : (
                            <audio src={msg.file_url} controls className="h-8" />
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMessage(msg)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          // LISTA DE SALAS
          <Tabs defaultValue="all">
            <TabsList className="bg-gray-900 border border-yellow-600 mb-6 p-1 rounded-2xl">
              <TabsTrigger value="all" className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-black rounded-xl px-4">
                Todas ({allRooms.length})
              </TabsTrigger>
              <TabsTrigger value="public" className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-black rounded-xl px-4">
                Públicas ({publicRooms.length})
              </TabsTrigger>
              <TabsTrigger value="private" className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-black rounded-xl px-4">
                Privadas ({privateRooms.length})
              </TabsTrigger>
            </TabsList>

            {['all', 'public', 'private'].map(tab => {
              const rooms = tab === 'all' ? allRooms : tab === 'public' ? publicRooms : privateRooms;
              return (
                <TabsContent key={tab} value={tab}>
                  {rooms.length === 0 ? (
                    <div className="text-center py-16">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400">No hay salas en esta categoría</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rooms.map(room => (
                        <Card key={room.id} className={`bg-gray-800 border-gray-700 transition-all ${room.is_disabled ? 'opacity-60 border-red-900' : 'hover:border-yellow-600'}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">{room.icon || '💬'}</div>
                                <div>
                                  <CardTitle className="text-white text-base">{room.name}</CardTitle>
                                  <div className="flex gap-1 mt-1">
                                    <Badge variant="outline" className={`text-xs ${room.type === 'private' ? 'border-red-600 text-red-400' : 'border-cyan-600 text-cyan-400'}`}>
                                      {room.type === 'private' ? <Lock className="w-2 h-2 mr-1" /> : <Globe className="w-2 h-2 mr-1" />}
                                      {room.type === 'private' ? 'Privada' : 'Pública'}
                                    </Badge>
                                    {room.is_disabled && (
                                      <Badge variant="outline" className="text-xs border-red-600 text-red-400">Desactivada</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {room.description && (
                              <p className="text-gray-400 text-xs mb-3 line-clamp-2">{room.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-gray-400 text-xs mb-4">
                               <Users className="w-3 h-3" />
                               <span>{room.real_members_count ?? room.members_count ?? 0} miembros</span>
                             </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => setSelectedRoom(room)}
                                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-xs"
                              >
                                <MessageCircle className="w-3 h-3 mr-1" /> Mensajes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleRoom(room)}
                                className={`border-gray-600 text-xs ${room.is_disabled ? 'text-green-400 hover:text-green-300' : 'text-yellow-400 hover:text-yellow-300'}`}
                                title={room.is_disabled ? 'Habilitar sala' : 'Deshabilitar sala'}
                              >
                                {room.is_disabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteRoom(room)}
                                className="text-xs"
                                title="Eliminar sala"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </div>
  );
}