import React, { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Users,
  Lock,
  Trash2,
  X,
  Shield,
  MessageCircle,
  EyeOff,
  Eye,
  Globe,
  Loader2
} from 'lucide-react';

async function fetchChatRooms() {
  const { data: rooms, error: roomsError } = await supabase
    .from('chat_rooms')
    .select('*')
    .order('created_date', { ascending: false })
    .limit(200);

  if (roomsError) {
    throw roomsError;
  }

  const { data: members, error: membersError } = await supabase
    .from('chat_room_members')
    .select('room_id');

  if (membersError) {
    throw membersError;
  }

  const memberCounts = (members || []).reduce((acc, member) => {
    acc[member.room_id] = (acc[member.room_id] || 0) + 1;
    return acc;
  }, {});

  return (rooms || []).map((room) => ({
    ...room,
    real_members_count: memberCounts[room.id] || 0,
  }));
}

async function fetchRoomMessages(roomId) {
  if (!roomId) return [];

  const { data, error } = await supabase
    .from('group_chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_date', { ascending: false })
    .limit(200);

  if (error) {
    throw error;
  }

  return data || [];
}

async function deleteRoomCascade(roomId) {
  const { error: membersError } = await supabase
    .from('chat_room_members')
    .delete()
    .eq('room_id', roomId);

  if (membersError) {
    throw membersError;
  }

  const { error: messagesError } = await supabase
    .from('group_chat_messages')
    .delete()
    .eq('room_id', roomId);

  if (messagesError) {
    throw messagesError;
  }

  const { error: roomError } = await supabase
    .from('chat_rooms')
    .delete()
    .eq('id', roomId);

  if (roomError) {
    throw roomError;
  }
}

async function toggleRoomDisabled(roomId, isDisabled) {
  const { error } = await supabase
    .from('chat_rooms')
    .update({ is_disabled: isDisabled })
    .eq('id', roomId);

  if (error) {
    throw error;
  }
}

async function deleteRoomMessage(messageId) {
  const { error } = await supabase
    .from('group_chat_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    throw error;
  }
}

export default function AdminChatRooms() {
  const { user: currentUser, loading } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const queryClient = useQueryClient();

  const isAdmin = currentUser?.role === 'admin';

  const {
    data: allRooms = [],
    isLoading: roomsLoading,
    error: roomsError,
  } = useQuery({
    queryKey: ['admin-all-rooms'],
    queryFn: fetchChatRooms,
    enabled: !loading && isAdmin,
    refetchInterval: 5000,
  });

  const {
    data: roomMessages = [],
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ['admin-room-messages', selectedRoom?.id],
    queryFn: () => fetchRoomMessages(selectedRoom?.id),
    enabled: !loading && isAdmin && !!selectedRoom?.id,
    refetchInterval: 5000,
  });

  const deleteRoomMutation = useMutation({
    mutationFn: deleteRoomCascade,
    onSuccess: async () => {
      setSelectedRoom(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-all-rooms'] });
    },
    onError: (error) => {
      console.error('Error eliminando sala:', error);
      alert('No se pudo eliminar la sala.');
    },
  });

  const toggleRoomMutation = useMutation({
    mutationFn: ({ roomId, isDisabled }) => toggleRoomDisabled(roomId, isDisabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-all-rooms'] });
    },
    onError: (error) => {
      console.error('Error cambiando estado de sala:', error);
      alert('No se pudo actualizar el estado de la sala.');
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: deleteRoomMessage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin-room-messages', selectedRoom?.id],
      });
    },
    onError: (error) => {
      console.error('Error eliminando mensaje:', error);
      alert('No se pudo eliminar el mensaje.');
    },
  });

  const publicRooms = useMemo(
    () => allRooms.filter((room) => room.type !== 'private'),
    [allRooms]
  );

  const privateRooms = useMemo(
    () => allRooms.filter((room) => room.type === 'private'),
    [allRooms]
  );

  const handleDeleteRoom = (room) => {
    if (
      window.confirm(
        `¿Eliminar la sala "${room.name}"? Esto borrará todos los mensajes y miembros.`
      )
    ) {
      deleteRoomMutation.mutate(room.id);
    }
  };

  const handleToggleRoom = (room) => {
    const action = room.is_disabled ? 'habilitar' : 'deshabilitar';

    if (
      window.confirm(
        `¿${action.charAt(0).toUpperCase() + action.slice(1)} la sala "${room.name}"?`
      )
    ) {
      toggleRoomMutation.mutate({
        roomId: room.id,
        isDisabled: !room.is_disabled,
      });
    }
  };

  const handleDeleteMessage = (msg) => {
    if (window.confirm('¿Eliminar este mensaje?')) {
      deleteMessageMutation.mutate(msg.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
        <p className="text-red-400 text-lg font-semibold">
          Debes iniciar sesión para acceder.
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
        <p className="text-red-400 text-lg font-semibold">
          Solo administradores pueden acceder.
        </p>
      </div>
    );
  }

  if (roomsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (roomsError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
        <div className="text-center">
          <p className="text-red-400 text-lg font-semibold mb-2">
            Error cargando salas de chat
          </p>
          <p className="text-gray-400 text-sm">
            Revisa que las tablas y políticas de Supabase estén activas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Moderación de Salas de Chat
          </h1>
          <p className="text-gray-400">
            Gestiona y modera todas las salas ({allRooms.length} en total)
          </p>
        </div>

        {selectedRoom ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedRoom.icon || '💬'}</div>
                <div>
                  <h2 className="text-white text-2xl font-bold">
                    {selectedRoom.name}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {roomMessages.length} mensajes
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setSelectedRoom(null)}
                className="border-gray-600 text-white"
              >
                <X className="w-4 h-4 mr-2" /> Volver
              </Button>
            </div>

            {messagesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : messagesError ? (
              <div className="text-center py-16">
                <p className="text-red-400">Error cargando mensajes de la sala.</p>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-2xl border border-gray-700 divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
                {roomMessages.length === 0 ? (
                  <div className="py-16 text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400">No hay mensajes en esta sala</p>
                  </div>
                ) : (
                  roomMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-start justify-between p-4 hover:bg-gray-700/50 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-yellow-400 font-semibold text-sm">
                            {msg.user_name || 'Usuario'}
                          </span>
                          {msg.user_email && (
                            <span className="text-gray-500 text-xs">
                              {msg.user_email}
                            </span>
                          )}
                          <span className="text-gray-600 text-xs">
                            {msg.created_date
                              ? new Date(msg.created_date).toLocaleString('es-MX')
                              : 'Sin fecha'}
                          </span>
                        </div>

                        {msg.content && (
                          <p className="text-gray-200 text-sm break-words">
                            {msg.content}
                          </p>
                        )}

                        {msg.file_url && (
                          <div className="mt-2">
                            {msg.file_type === 'image' ? (
                              <img
                                src={msg.file_url}
                                alt=""
                                className="max-h-32 rounded-lg"
                              />
                            ) : (
                              <audio
                                src={msg.file_url}
                                controls
                                className="h-8"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMessage(msg)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0 ml-2"
                        disabled={deleteMessageMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="bg-gray-900 border border-yellow-600 mb-6 p-1 rounded-2xl">
              <TabsTrigger
                value="all"
                className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-black rounded-xl px-4"
              >
                Todas ({allRooms.length})
              </TabsTrigger>
              <TabsTrigger
                value="public"
                className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-black rounded-xl px-4"
              >
                Públicas ({publicRooms.length})
              </TabsTrigger>
              <TabsTrigger
                value="private"
                className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-black rounded-xl px-4"
              >
                Privadas ({privateRooms.length})
              </TabsTrigger>
            </TabsList>

            {['all', 'public', 'private'].map((tab) => {
              const rooms =
                tab === 'all'
                  ? allRooms
                  : tab === 'public'
                  ? publicRooms
                  : privateRooms;

              return (
                <TabsContent key={tab} value={tab}>
                  {rooms.length === 0 ? (
                    <div className="text-center py-16">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400">
                        No hay salas en esta categoría
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rooms.map((room) => (
                        <Card
                          key={room.id}
                          className={`bg-gray-800 border-gray-700 transition-all ${
                            room.is_disabled
                              ? 'opacity-60 border-red-900'
                              : 'hover:border-yellow-600'
                          }`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">{room.icon || '💬'}</div>
                                <div>
                                  <CardTitle className="text-white text-base">
                                    {room.name}
                                  </CardTitle>

                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        room.type === 'private'
                                          ? 'border-red-600 text-red-400'
                                          : 'border-cyan-600 text-cyan-400'
                                      }`}
                                    >
                                      {room.type === 'private' ? (
                                        <Lock className="w-2 h-2 mr-1" />
                                      ) : (
                                        <Globe className="w-2 h-2 mr-1" />
                                      )}
                                      {room.type === 'private' ? 'Privada' : 'Pública'}
                                    </Badge>

                                    {room.is_disabled && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-red-600 text-red-400"
                                      >
                                        Desactivada
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent>
                            {room.description && (
                              <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                                {room.description}
                              </p>
                            )}

                            <div className="flex items-center gap-2 text-gray-400 text-xs mb-4">
                              <Users className="w-3 h-3" />
                              <span>
                                {room.real_members_count ?? room.members_count ?? 0} miembros
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => setSelectedRoom(room)}
                                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-xs"
                              >
                                <MessageCircle className="w-3 h-3 mr-1" />
                                Mensajes
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleRoom(room)}
                                className={`border-gray-600 text-xs ${
                                  room.is_disabled
                                    ? 'text-green-400 hover:text-green-300'
                                    : 'text-yellow-400 hover:text-yellow-300'
                                }`}
                                title={
                                  room.is_disabled ? 'Habilitar sala' : 'Deshabilitar sala'
                                }
                                disabled={toggleRoomMutation.isPending}
                              >
                                {room.is_disabled ? (
                                  <Eye className="w-3 h-3" />
                                ) : (
                                  <EyeOff className="w-3 h-3" />
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteRoom(room)}
                                className="text-xs"
                                title="Eliminar sala"
                                disabled={deleteRoomMutation.isPending}
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
