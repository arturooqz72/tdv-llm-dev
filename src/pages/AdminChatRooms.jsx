import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
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
} from 'lucide-react';

const CHAT_ROOMS_STORAGE_KEY = 'tdv_chat_rooms';
const CHAT_ROOM_MEMBERS_STORAGE_KEY = 'tdv_chat_room_members';
const CHAT_MESSAGES_STORAGE_KEY = 'tdv_group_chat_messages';

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readRooms() {
  const data = readJSON(CHAT_ROOMS_STORAGE_KEY, []);
  return Array.isArray(data) ? data : [];
}

function readMembers() {
  const data = readJSON(CHAT_ROOM_MEMBERS_STORAGE_KEY, []);
  return Array.isArray(data) ? data : [];
}

function readMessages() {
  const data = readJSON(CHAT_MESSAGES_STORAGE_KEY, []);
  return Array.isArray(data) ? data : [];
}

function getDefaultRooms() {
  return [
    {
      id: 'room-general',
      name: 'General',
      description: 'Sala pública para conversar con la comunidad.',
      type: 'public',
      category: 'general',
      icon: '💬',
      is_active: true,
      members_count: 0,
      last_message_at: new Date().toISOString(),
    },
    {
      id: 'room-oracion',
      name: 'Oración',
      description: 'Comparte peticiones y mensajes de oración.',
      type: 'public',
      category: 'oracion',
      icon: '🙏',
      is_active: true,
      members_count: 0,
      last_message_at: new Date().toISOString(),
    },
    {
      id: 'room-musica',
      name: 'Música',
      description: 'Sala para hablar de alabanzas, cantos y audios.',
      type: 'public',
      category: 'musica',
      icon: '🎵',
      is_active: true,
      members_count: 0,
      last_message_at: new Date().toISOString(),
    },
    {
      id: 'room-tdv',
      name: 'Team Desvelados',
      description: 'Sala especial privada para miembros autorizados.',
      type: 'private',
      category: 'lldm',
      icon: '🔥',
      is_active: true,
      members_count: 0,
      last_message_at: new Date().toISOString(),
    },
  ];
}

function ensureRoomsInitialized() {
  const existingRooms = readJSON(CHAT_ROOMS_STORAGE_KEY, []);
  if (!Array.isArray(existingRooms) || existingRooms.length === 0) {
    saveJSON(CHAT_ROOMS_STORAGE_KEY, getDefaultRooms());
  }

  const existingMembers = readJSON(CHAT_ROOM_MEMBERS_STORAGE_KEY, []);
  if (!Array.isArray(existingMembers)) {
    saveJSON(CHAT_ROOM_MEMBERS_STORAGE_KEY, []);
  }

  const existingMessages = readJSON(CHAT_MESSAGES_STORAGE_KEY, []);
  if (!Array.isArray(existingMessages)) {
    saveJSON(CHAT_MESSAGES_STORAGE_KEY, []);
  }
}

function emitChatUpdated() {
  window.dispatchEvent(new Event('tdv-chat-updated'));
}

export default function AdminChatRooms() {
  const { user: currentUser, loading } = useAuth();

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [allRooms, setAllRooms] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [allMessages, setAllMessages] = useState([]);

  const refreshData = () => {
    setAllRooms(readRooms());
    setAllMembers(readMembers());
    setAllMessages(readMessages());
  };

  useEffect(() => {
    ensureRoomsInitialized();
    refreshData();

    const onStorageUpdate = () => refreshData();

    window.addEventListener('storage', onStorageUpdate);
    window.addEventListener('tdv-chat-updated', onStorageUpdate);

    return () => {
      window.removeEventListener('storage', onStorageUpdate);
      window.removeEventListener('tdv-chat-updated', onStorageUpdate);
    };
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const enrichedRooms = useMemo(() => {
    return allRooms.map((room) => ({
      ...room,
      real_members_count: allMembers.filter((m) => m.room_id === room.id).length,
      messages_count: allMessages.filter((m) => m.room_id === room.id).length,
    }));
  }, [allRooms, allMembers, allMessages]);

  const publicRooms = useMemo(
    () => enrichedRooms.filter((r) => r.type !== 'private'),
    [enrichedRooms]
  );

  const privateRooms = useMemo(
    () => enrichedRooms.filter((r) => r.type === 'private'),
    [enrichedRooms]
  );

  const roomMessages = useMemo(() => {
    if (!selectedRoom?.id) return [];
    return allMessages
      .filter((msg) => msg.room_id === selectedRoom.id)
      .sort(
        (a, b) =>
          new Date(b.created_date || 0).getTime() -
          new Date(a.created_date || 0).getTime()
      );
  }, [allMessages, selectedRoom]);

  const handleDeleteRoom = (room) => {
    if (!window.confirm(`¿Eliminar la sala "${room.name}"? Esto borrará todos los mensajes y miembros.`)) {
      return;
    }

    const nextRooms = readRooms().filter((item) => item.id !== room.id);
    const nextMembers = readMembers().filter((item) => item.room_id !== room.id);
    const nextMessages = readMessages().filter((item) => item.room_id !== room.id);

    saveJSON(CHAT_ROOMS_STORAGE_KEY, nextRooms);
    saveJSON(CHAT_ROOM_MEMBERS_STORAGE_KEY, nextMembers);
    saveJSON(CHAT_MESSAGES_STORAGE_KEY, nextMessages);

    setSelectedRoom(null);
    refreshData();
    emitChatUpdated();
  };

  const handleToggleRoom = (room) => {
    const action = room.is_active === false ? 'habilitar' : 'deshabilitar';

    if (!window.confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} la sala "${room.name}"?`)) {
      return;
    }

    const nextRooms = readRooms().map((item) =>
      item.id === room.id
        ? { ...item, is_active: item.is_active === false ? true : false }
        : item
    );

    saveJSON(CHAT_ROOMS_STORAGE_KEY, nextRooms);
    refreshData();
    emitChatUpdated();
  };

  const handleDeleteMessage = (msg) => {
    if (!window.confirm('¿Eliminar este mensaje?')) return;

    const nextMessages = readMessages().filter((item) => item.id !== msg.id);
    saveJSON(CHAT_MESSAGES_STORAGE_KEY, nextMessages);
    refreshData();
    emitChatUpdated();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-white">Cargando...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Moderación de Salas de Chat</h1>
          <p className="text-gray-400">Gestiona y modera todas las salas ({enrichedRooms.length} en total)</p>
        </div>

        {selectedRoom ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedRoom.icon || '💬'}</div>
                <div>
                  <h2 className="text-white text-2xl font-bold">{selectedRoom.name}</h2>
                  <p className="text-gray-400 text-sm">{roomMessages.length} mensajes</p>
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
                          <span className="text-gray-500 text-xs">{msg.user_email}</span>
                        )}
                        <span className="text-gray-600 text-xs">
                          {msg.created_date
                            ? new Date(msg.created_date).toLocaleString('es-MX')
                            : 'Sin fecha'}
                        </span>
                      </div>

                      {msg.content && (
                        <p className="text-gray-200 text-sm break-words">{msg.content}</p>
                      )}

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
          <Tabs defaultValue="all">
            <TabsList className="bg-gray-900 border border-yellow-600 mb-6 p-1 rounded-2xl">
              <TabsTrigger
                value="all"
                className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-black rounded-xl px-4"
              >
                Todas ({enrichedRooms.length})
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
                tab === 'all' ? enrichedRooms : tab === 'public' ? publicRooms : privateRooms;

              return (
                <TabsContent key={tab} value={tab}>
                  {rooms.length === 0 ? (
                    <div className="text-center py-16">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400">No hay salas en esta categoría</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rooms.map((room) => (
                        <Card
                          key={room.id}
                          className={`bg-gray-800 border-gray-700 transition-all ${
                            room.is_active === false
                              ? 'opacity-60 border-red-900'
                              : 'hover:border-yellow-600'
                          }`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">{room.icon || '💬'}</div>
                                <div>
                                  <CardTitle className="text-white text-base">{room.name}</CardTitle>

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

                                    {room.is_active === false && (
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

                            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                              <Users className="w-3 h-3" />
                              <span>{room.real_members_count ?? room.members_count ?? 0} miembros</span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-400 text-xs mb-4">
                              <MessageCircle className="w-3 h-3" />
                              <span>{room.messages_count ?? 0} mensajes</span>
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
                                className={`border-gray-600 text-xs ${
                                  room.is_active === false
                                    ? 'text-green-400 hover:text-green-300'
                                    : 'text-yellow-400 hover:text-yellow-300'
                                }`}
                                title={room.is_active === false ? 'Habilitar sala' : 'Deshabilitar sala'}
                              >
                                {room.is_active === false ? (
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
