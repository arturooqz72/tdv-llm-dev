import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Users,
  Lock,
  Globe,
  Plus,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ChatRoomView from "@/components/chat/ChatRoomView";

const CHAT_ROOMS_STORAGE_KEY = "tdv_chat_rooms";
const CHAT_ROOM_MEMBERS_STORAGE_KEY = "tdv_chat_room_members";

const categoryLabels = {
  lldm: "LLDM",
  cristianismo: "Cristianismo",
  oracion: "Oración",
  jovenes: "Jóvenes",
  musica: "Música",
  general: "General",
  otros: "Otros",
};

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

function getDefaultRooms() {
  return [
    {
      id: "room-general",
      name: "General",
      description: "Sala pública para conversar con la comunidad.",
      type: "public",
      category: "general",
      icon: "💬",
      is_active: true,
      members_count: 0,
      last_message_at: new Date().toISOString(),
    },
    {
      id: "room-oracion",
      name: "Oración",
      description: "Comparte peticiones y mensajes de oración.",
      type: "public",
      category: "oracion",
      icon: "🙏",
      is_active: true,
      members_count: 0,
      last_message_at: new Date().toISOString(),
    },
    {
      id: "room-musica",
      name: "Música",
      description: "Sala para hablar de alabanzas, cantos y audios.",
      type: "public",
      category: "musica",
      icon: "🎵",
      is_active: true,
      members_count: 0,
      last_message_at: new Date().toISOString(),
    },
    {
      id: "room-tdv",
      name: "Team Desvelados",
      description: "Sala especial privada para miembros autorizados.",
      type: "private",
      category: "lldm",
      icon: "🔥",
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
}

function GroupChatContent() {
  const { user: currentUser, isLoadingAuth } = useAuth();

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rooms, setRooms] = useState([]);
  const [memberships, setMemberships] = useState([]);

  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    type: "public",
    category: "general",
    icon: "💬",
  });

  useEffect(() => {
    ensureRoomsInitialized();
    setRooms(readJSON(CHAT_ROOMS_STORAGE_KEY, []));
    setMemberships(readJSON(CHAT_ROOM_MEMBERS_STORAGE_KEY, []));
  }, []);

  const refreshData = () => {
    setRooms(readJSON(CHAT_ROOMS_STORAGE_KEY, []));
    setMemberships(readJSON(CHAT_ROOM_MEMBERS_STORAGE_KEY, []));
  };

  const canAccessTDVChat =
    currentUser?.role === "admin" ||
    currentUser?.canAccessTeamDesveladosRoom === true;

  const filteredActiveRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (!room.is_active) return false;

      const isTDV = room.name === "Team Desvelados";
      if (isTDV && !canAccessTDVChat) return false;

      return (
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [rooms, searchTerm, canAccessTDVChat]);

  const myRoomIds = useMemo(() => {
    if (!currentUser?.email) return [];
    return memberships
      .filter((m) => m.user_email === currentUser.email)
      .map((m) => m.room_id);
  }, [memberships, currentUser]);

  const myRooms = useMemo(() => {
    return filteredActiveRooms.filter((room) => {
      const isTDV = room.name === "Team Desvelados";
      if (isTDV && !canAccessTDVChat) return false;
      return myRoomIds.includes(room.id);
    });
  }, [filteredActiveRooms, myRoomIds, canAccessTDVChat]);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!currentUser?.email) return;

    const roomId = crypto.randomUUID();

    const room = {
      id: roomId,
      ...newRoom,
      is_active: true,
      members_count: 1,
      last_message_at: new Date().toISOString(),
      created_by: currentUser.email,
      created_date: new Date().toISOString(),
    };

    const nextRooms = [room, ...rooms];
    saveJSON(CHAT_ROOMS_STORAGE_KEY, nextRooms);

    const nextMemberships = [
      ...memberships,
      {
        id: crypto.randomUUID(),
        room_id: roomId,
        user_email: currentUser.email,
        role: "admin",
        created_date: new Date().toISOString(),
      },
    ];
    saveJSON(CHAT_ROOM_MEMBERS_STORAGE_KEY, nextMemberships);

    setNewRoom({
      name: "",
      description: "",
      type: "public",
      category: "general",
      icon: "💬",
    });

    setShowCreateRoom(false);
    refreshData();
  };

  const handleJoinRoom = (room) => {
    if (!currentUser?.email) return;

    const isTDV = room.name === "Team Desvelados";
    if (isTDV && !canAccessTDVChat) return;

    const isMember = memberships.some(
      (m) => m.room_id === room.id && m.user_email === currentUser.email
    );

    if (room.type === "private" && !isMember) {
      alert(
        "Esta sala es privada. Solo puedes acceder si un administrador te agrega."
      );
      return;
    }

    if (!isMember) {
      const nextMemberships = [
        ...memberships,
        {
          id: crypto.randomUUID(),
          room_id: room.id,
          user_email: currentUser.email,
          role: "member",
          created_date: new Date().toISOString(),
        },
      ];
      saveJSON(CHAT_ROOM_MEMBERS_STORAGE_KEY, nextMemberships);

      const nextRooms = rooms.map((item) =>
        item.id === room.id
          ? { ...item, members_count: (item.members_count || 0) + 1 }
          : item
      );
      saveJSON(CHAT_ROOMS_STORAGE_KEY, nextRooms);
      refreshData();
    }

    setSelectedRoom(room);
  };

  if (isLoadingAuth || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <p className="text-white">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {!selectedRoom ? (
          <>
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-black" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Salas de Chat
              </h1>
              <p className="text-gray-400">
                Conversa con la comunidad en tiempo real
              </p>
            </div>

            <div className="max-w-4xl mx-auto mb-6 flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar salas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 text-white border-gray-700"
                />
              </div>

              <Button
                onClick={() => setShowCreateRoom(true)}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear Sala
              </Button>
            </div>

            <div className="max-w-4xl mx-auto">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-gray-900 border border-yellow-600 mb-6 p-1 rounded-2xl">
                  <TabsTrigger
                    value="all"
                    className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-black rounded-xl px-4"
                  >
                    Todas las Salas
                  </TabsTrigger>

                  <TabsTrigger
                    value="joined"
                    className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-black rounded-xl px-4"
                  >
                    Mis Salas
                  </TabsTrigger>

                  <TabsTrigger
                    value="public"
                    className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-black rounded-xl px-4"
                  >
                    Públicas
                  </TabsTrigger>

                  <TabsTrigger
                    value="private"
                    className="text-white data-[state=active]:bg-yellow-600 data-[state=active]:text-black rounded-xl px-4"
                  >
                    Privadas
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredActiveRooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        currentUser={currentUser}
                        memberships={memberships}
                        canAccessTDVChat={canAccessTDVChat}
                        onJoin={handleJoinRoom}
                        onSelect={setSelectedRoom}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="joined">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myRooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        currentUser={currentUser}
                        memberships={memberships}
                        canAccessTDVChat={canAccessTDVChat}
                        onJoin={handleJoinRoom}
                        onSelect={setSelectedRoom}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="public">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredActiveRooms
                      .filter((r) => r.type === "public")
                      .map((room) => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          currentUser={currentUser}
                          memberships={memberships}
                          canAccessTDVChat={canAccessTDVChat}
                          onJoin={handleJoinRoom}
                          onSelect={setSelectedRoom}
                        />
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="private">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredActiveRooms
                      .filter((r) => r.type === "private")
                      .map((room) => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          currentUser={currentUser}
                          memberships={memberships}
                          canAccessTDVChat={canAccessTDVChat}
                          onJoin={handleJoinRoom}
                          onSelect={setSelectedRoom}
                        />
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <ChatRoomView
            room={selectedRoom}
            currentUser={currentUser}
            onBack={() => setSelectedRoom(null)}
          />
        )}

        <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
          <DialogContent className="bg-gray-800 text-white border-yellow-600">
            <DialogHeader>
              <DialogTitle>Crear Nueva Sala</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Icono (Emoji)
                </label>
                <Input
                  value={newRoom.icon}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, icon: e.target.value })
                  }
                  placeholder="💬"
                  className="bg-gray-900 border-gray-700 text-2xl text-center"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Nombre
                </label>
                <Input
                  value={newRoom.name}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, name: e.target.value })
                  }
                  placeholder="Nombre de la sala"
                  required
                  className="bg-gray-900 border-gray-700"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Descripción
                </label>
                <Textarea
                  value={newRoom.description}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, description: e.target.value })
                  }
                  placeholder="¿De qué trata esta sala?"
                  className="bg-gray-900 border-gray-700"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Tipo</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={newRoom.type === "public" ? "default" : "outline"}
                    onClick={() => setNewRoom({ ...newRoom, type: "public" })}
                    className="flex-1"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Pública
                  </Button>

                  <Button
                    type="button"
                    variant={newRoom.type === "private" ? "default" : "outline"}
                    onClick={() => setNewRoom({ ...newRoom, type: "private" })}
                    className="flex-1"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Privada
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Categoría
                </label>
                <select
                  value={newRoom.category}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, category: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"
                >
                  Crear Sala
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateRoom(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function RoomCard({
  room,
  onSelect,
  onJoin,
  currentUser,
  memberships,
  canAccessTDVChat,
}) {
  const isAdmin = currentUser?.role === "admin";
  const isTDVRoom = room.name === "Team Desvelados";

  const isMember = memberships.some(
    (m) => m.room_id === room.id && m.user_email === currentUser?.email
  );

  if (isTDVRoom && !isAdmin && !canAccessTDVChat) {
    return null;
  }

  const handleClick = () => {
    if (isMember) {
      onSelect(room);
      return;
    }

    if (room.type === "private") {
      alert(
        "Esta sala es privada. Solo puedes acceder si un administrador te agrega."
      );
      return;
    }

    if (onJoin) {
      onJoin(room);
    } else {
      onSelect(room);
    }
  };

  return (
    <Card
      className="bg-gray-800 border-gray-700 hover:border-yellow-600 transition-all cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{room.icon || "💬"}</div>
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                {room.name}
                {room.type === "private" && (
                  <Lock className="w-4 h-4 text-gray-400" />
                )}
              </h3>
              <Badge
                variant="outline"
                className="mt-1 text-xs border-yellow-600 text-yellow-500"
              >
                {categoryLabels[room.category] || room.category}
              </Badge>
            </div>
          </div>
        </div>

        {room.description && (
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {room.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Users className="w-4 h-4" />
            <span>{room.members_count || 0} miembros</span>
          </div>

          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"
          >
            {isMember ? "Abrir" : room.type === "private" ? "Ver" : "Entrar"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function GroupChat() {
  return <GroupChatContent />;
}
