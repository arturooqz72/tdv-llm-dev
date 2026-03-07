import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Mic,
  Users,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CHAT_MESSAGES_STORAGE_KEY = "tdv_group_chat_messages";
const CHAT_ROOM_MEMBERS_STORAGE_KEY = "tdv_chat_room_members";
const CHAT_ROOMS_STORAGE_KEY = "tdv_chat_rooms";

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

function readMessages() {
  const data = readJSON(CHAT_MESSAGES_STORAGE_KEY, []);
  return Array.isArray(data) ? data : [];
}

function readMembers() {
  const data = readJSON(CHAT_ROOM_MEMBERS_STORAGE_KEY, []);
  return Array.isArray(data) ? data : [];
}

function readRooms() {
  const data = readJSON(CHAT_ROOMS_STORAGE_KEY, []);
  return Array.isArray(data) ? data : [];
}

function safeTime(value) {
  try {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return format(date, "HH:mm", { locale: es });
  } catch {
    return "";
  }
}

export default function ChatRoomView({ room, currentUser, onBack }) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [allMessages, setAllMessages] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const messagesEndRef = useRef(null);

  const refreshData = () => {
    setAllMessages(readMessages());
    setAllMembers(readMembers());
  };

  useEffect(() => {
    refreshData();

    const onStorage = () => refreshData();
    window.addEventListener("storage", onStorage);
    window.addEventListener("tdv-chat-updated", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("tdv-chat-updated", onStorage);
    };
  }, []);

  const roomId = room?.id || "";

  const messages = useMemo(() => {
    return allMessages
      .filter((msg) => msg?.room_id === roomId)
      .sort(
        (a, b) =>
          new Date(a?.created_date || 0).getTime() -
          new Date(b?.created_date || 0).getTime()
      );
  }, [allMessages, roomId]);

  const members = useMemo(() => {
    return allMembers.filter((member) => member?.room_id === roomId);
  }, [allMembers, roomId]);

  useEffect(() => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {
      // no-op
    }
  }, [messages]);

  const updateRoomLastMessageAt = () => {
    const rooms = readRooms();
    const nextRooms = rooms.map((item) =>
      item.id === roomId
        ? { ...item, last_message_at: new Date().toISOString() }
        : item
    );
    saveJSON(CHAT_ROOMS_STORAGE_KEY, nextRooms);
  };

  const emitChatUpdated = () => {
    window.dispatchEvent(new Event("tdv-chat-updated"));
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || !currentUser?.email || !roomId) return;

    const newMessage = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()),
      room_id: roomId,
      user_email: currentUser.email,
      user_name:
        currentUser.full_name ||
        currentUser.name ||
        currentUser.displayName ||
        currentUser.email.split("@")[0],
      user_picture: currentUser.profile_picture_url || "",
      content: trimmed,
      created_date: new Date().toISOString(),
    };

    const nextMessages = [...readMessages(), newMessage];
    saveJSON(CHAT_MESSAGES_STORAGE_KEY, nextMessages);
    updateRoomLastMessageAt();
    emitChatUpdated();

    setMessage("");
    refreshData();
  };

  const handleDeleteMessage = (msg) => {
    const isOwn = msg?.user_email === currentUser?.email;
    const isAdmin = currentUser?.role === "admin";

    if (!isOwn && !isAdmin) return;

    const confirmText =
      isAdmin && !isOwn
        ? "¿Eliminar este mensaje (admin)?"
        : "¿Eliminar este mensaje?";

    if (!window.confirm(confirmText)) return;

    const nextMessages = readMessages().filter((item) => item.id !== msg.id);
    saveJSON(CHAT_MESSAGES_STORAGE_KEY, nextMessages);
    emitChatUpdated();
    refreshData();
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.email || !roomId) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("El archivo es demasiado grande. Máximo 10MB en esta versión.");
      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();

      reader.onload = () => {
        const fileUrl = typeof reader.result === "string" ? reader.result : "";

        const newMessage = {
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : String(Date.now()),
          room_id: roomId,
          user_email: currentUser.email,
          user_name:
            currentUser.full_name ||
            currentUser.name ||
            currentUser.displayName ||
            currentUser.email.split("@")[0],
          user_picture: currentUser.profile_picture_url || "",
          file_url: fileUrl,
          file_type: type,
          content: "",
          created_date: new Date().toISOString(),
        };

        const nextMessages = [...readMessages(), newMessage];
        saveJSON(CHAT_MESSAGES_STORAGE_KEY, nextMessages);
        updateRoomLastMessageAt();
        emitChatUpdated();
        refreshData();
        setUploading(false);
      };

      reader.onerror = () => {
        alert("Error al subir el archivo");
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch {
      alert("Error al subir el archivo");
      setUploading(false);
    } finally {
      e.target.value = "";
    }
  };

  if (!room) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-gray-800 rounded-2xl border-2 border-yellow-600 p-6 text-white">
          <p>No se encontró la sala.</p>
          <Button onClick={onBack} className="mt-4">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-gray-800 rounded-t-2xl border-2 border-b-0 border-yellow-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={onBack}
              className="text-white hover:bg-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="text-3xl">{room.icon || "💬"}</div>

            <div>
              <h2 className="text-white font-semibold text-lg">{room.name}</h2>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <Users className="w-3 h-3" />
                {members.length} miembros
              </p>
            </div>
          </div>

          <Button size="icon" variant="ghost" className="text-gray-400">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="bg-gray-900 border-x-2 border-yellow-600 h-[500px] overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            Aún no hay mensajes en esta sala.
          </div>
        )}

        {messages.map((msg) => {
          const isOwnMessage = msg?.user_email === currentUser?.email;
          const canDelete = isOwnMessage || currentUser?.role === "admin";

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                isOwnMessage ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex-shrink-0 overflow-hidden">
                {msg.user_picture ? (
                  <img
                    src={msg.user_picture}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-black font-semibold text-sm">
                    {msg.user_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>

              <div
                className={`max-w-[70%] ${
                  isOwnMessage ? "items-end" : "items-start"
                } flex flex-col`}
              >
                <div className="flex items-center gap-2 mb-1 group">
                  <span className="text-xs text-gray-400 font-medium">
                    {isOwnMessage ? "Tú" : msg.user_name}
                  </span>

                  <span className="text-xs text-gray-500">
                    {safeTime(msg.created_date)}
                  </span>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(msg)}
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                      title="Eliminar mensaje"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {msg.file_url ? (
                  <div
                    className={`rounded-2xl p-2 ${
                      isOwnMessage
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                        : "bg-gray-800"
                    }`}
                  >
                    {msg.file_type === "image" ? (
                      <img
                        src={msg.file_url}
                        alt=""
                        className="max-w-sm rounded-lg"
                      />
                    ) : (
                      <audio src={msg.file_url} controls className="max-w-sm" />
                    )}
                  </div>
                ) : (
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"
                        : "bg-gray-800 text-white"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-gray-800 rounded-b-2xl border-2 border-t-0 border-yellow-600 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex gap-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, "image")}
              className="hidden"
              id="image-upload"
              disabled={uploading}
            />

            <label htmlFor="image-upload">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-400 hover:bg-gray-700 disabled:opacity-50"
                disabled={uploading}
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </label>

            <input
              type="file"
              accept="audio/*"
              onChange={(e) => handleFileUpload(e, "audio")}
              className="hidden"
              id="audio-upload"
              disabled={uploading}
            />

            <label htmlFor="audio-upload">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-400 hover:bg-gray-700 disabled:opacity-50"
                disabled={uploading}
              >
                <Mic className="w-5 h-5" />
              </button>
            </label>
          </div>

          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-gray-900 border-gray-700 text-white"
            disabled={uploading}
          />

          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || uploading}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-600 hover:to-yellow-700"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>

        {uploading && (
          <p className="text-yellow-500 text-xs mt-2">Subiendo archivo...</p>
        )}
      </div>
    </div>
  );
}
