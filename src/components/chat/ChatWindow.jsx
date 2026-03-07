import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  ArrowLeft,
  Users,
  Image,
  Mic,
  X,
  Download,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import OnlineIndicator from "@/components/OnlineIndicator";

const PRIVATE_MESSAGES_STORAGE_KEY = "tdv_private_messages";
const GROUP_MESSAGES_STORAGE_KEY = "tdv_public_messages";
const USERS_STORAGE_KEYS = ["tdv_users", "tdv_registered_users", "tdv_current_user"];

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

function readUsers() {
  const users = [];

  for (const key of USERS_STORAGE_KEYS) {
    const data = readJSON(key, null);

    if (Array.isArray(data)) {
      users.push(...data);
    } else if (data && typeof data === "object" && data.email) {
      users.push(data);
    }
  }

  const unique = new Map();
  users.forEach((user) => {
    if (user?.email) unique.set(user.email, user);
  });

  return Array.from(unique.values());
}

export default function ChatWindow({ currentUser, chatWith, chatName, onBack }) {
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const isGroupChat = !chatWith;

  const refreshData = () => {
    setPrivateMessages(readJSON(PRIVATE_MESSAGES_STORAGE_KEY, []));
    setGroupMessages(readJSON(GROUP_MESSAGES_STORAGE_KEY, []));
    setAllUsers(readUsers());
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

  const messages = useMemo(() => {
    if (!currentUser?.email) return [];

    if (isGroupChat) {
      return [...groupMessages].sort(
        (a, b) =>
          new Date(a.created_date || 0).getTime() -
          new Date(b.created_date || 0).getTime()
      );
    }

    return privateMessages
      .filter(
        (msg) =>
          (msg.sender_email === currentUser.email &&
            msg.receiver_email === chatWith) ||
          (msg.sender_email === chatWith &&
            msg.receiver_email === currentUser.email)
      )
      .sort(
        (a, b) =>
          new Date(a.created_date || 0).getTime() -
          new Date(b.created_date || 0).getTime()
      );
  }, [isGroupChat, groupMessages, privateMessages, currentUser, chatWith]);

  const otherUser = useMemo(() => {
    if (!chatWith || isGroupChat) return null;
    return allUsers.find((u) => u.email === chatWith) || null;
  }, [allUsers, chatWith, isGroupChat]);

  useEffect(() => {
    if (isGroupChat || !chatWith || !currentUser?.email) return;

    let changed = false;
    const nextMessages = privateMessages.map((msg) => {
      if (msg.receiver_email === currentUser.email && !msg.is_read) {
        changed = true;
        return { ...msg, is_read: true };
      }
      return msg;
    });

    if (changed) {
      saveJSON(PRIVATE_MESSAGES_STORAGE_KEY, nextMessages);
      window.dispatchEvent(new Event("tdv-chat-updated"));
      setPrivateMessages(nextMessages);
    }
  }, [messages, chatWith, currentUser, isGroupChat, privateMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("audio/")) {
      alert("Solo se permiten imágenes y audios");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("El archivo es demasiado grande (máx. 10MB)");
      return;
    }

    setSelectedFile(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error al acceder al micrófono:", error);
      alert("No se pudo acceder al micrófono. Verifica los permisos.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    setAudioBlob(null);
    audioChunksRef.current = [];
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile && !audioBlob) return;
    if (!currentUser?.email) return;

    setUploading(true);

    try {
      let fileUrl = "";
      let fileType = null;

      if (audioBlob) {
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        fileUrl = await fileToDataUrl(audioFile);
        fileType = "audio";
      } else if (selectedFile) {
        fileUrl = await fileToDataUrl(selectedFile);
        fileType = selectedFile.type.startsWith("image/") ? "image" : "audio";
      }

      const baseMessage = {
        id: crypto.randomUUID(),
        content: newMessage.trim() || "",
        file_url: fileUrl,
        file_type: fileType,
        created_date: new Date().toISOString(),
      };

      if (isGroupChat) {
        const nextMessages = [
          ...groupMessages,
          {
            ...baseMessage,
            user_email: currentUser.email,
            user_name:
              currentUser.full_name ||
              currentUser.name ||
              currentUser.displayName ||
              currentUser.email.split("@")[0],
          },
        ];
        saveJSON(GROUP_MESSAGES_STORAGE_KEY, nextMessages);
      } else {
        const nextMessages = [
          ...privateMessages,
          {
            ...baseMessage,
            sender_email: currentUser.email,
            receiver_email: chatWith,
            is_read: false,
          },
        ];
        saveJSON(PRIVATE_MESSAGES_STORAGE_KEY, nextMessages);
      }

      setNewMessage("");
      setSelectedFile(null);
      setAudioBlob(null);
      audioChunksRef.current = [];
      window.dispatchEvent(new Event("tdv-chat-updated"));
      refreshData();
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      alert("Error al enviar mensaje");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMessage = (msgId) => {
    if (!window.confirm("¿Eliminar este mensaje?")) return;

    try {
      if (isGroupChat) {
        const nextMessages = groupMessages.filter((msg) => msg.id !== msgId);
        saveJSON(GROUP_MESSAGES_STORAGE_KEY, nextMessages);
      } else {
        const nextMessages = privateMessages.filter((msg) => msg.id !== msgId);
        saveJSON(PRIVATE_MESSAGES_STORAGE_KEY, nextMessages);
      }

      window.dispatchEvent(new Event("tdv-chat-updated"));
      refreshData();
    } catch (error) {
      console.error("Error eliminando mensaje:", error);
      alert("Error al eliminar mensaje");
    }
  };

  const handleDownloadImage = (fileUrl, fileName = "imagen") => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const isLoading = false;

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            size="icon"
            variant="ghost"
            className="md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {isGroupChat ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{chatName}</h3>
                <p className="text-xs text-gray-500">Comunidad abierta</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                  {chatName?.charAt(0).toUpperCase()}
                </div>
                {otherUser && (
                  <OnlineIndicator
                    lastSeen={otherUser.last_seen || otherUser.lastSeen}
                    className="absolute bottom-0 right-0"
                  />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{chatName}</h3>
                {(otherUser?.last_seen || otherUser?.lastSeen) && (
                  <p className="text-xs text-gray-500">
                    {new Date(otherUser.last_seen || otherUser.lastSeen) >
                    new Date(Date.now() - 5 * 60 * 1000)
                      ? "En línea"
                      : `Visto ${new Date(
                          otherUser.last_seen || otherUser.lastSeen
                        ).toLocaleString()}`}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <Skeleton className="h-16 flex-1 rounded-xl" />
                </div>
              ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No hay mensajes. ¡Inicia la conversación!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOwn = isGroupChat
                ? msg.user_email === currentUser?.email
                : msg.sender_email === currentUser?.email;

              const displayName = isGroupChat
                ? msg.user_name
                : isOwn
                ? "Tú"
                : chatName;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 group ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {displayName?.charAt(0).toUpperCase()}
                  </div>

                  <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
                    <div className="flex items-start gap-2 justify-between">
                      {!isOwn && isGroupChat && (
                        <p className="text-xs text-gray-600 mb-1 font-medium">
                          {displayName}
                        </p>
                      )}

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isOwn && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="h-6 w-6 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}

                        {msg.file_url && msg.file_type === "image" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadImage(msg.file_url)}
                            className="h-6 w-6"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div
                      className={`inline-block rounded-2xl px-4 py-3 max-w-[80%] ${
                        isOwn
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {msg.file_url && msg.file_type === "image" && (
                        <img
                          src={msg.file_url}
                          alt="Imagen"
                          className="rounded-lg mb-2 max-w-full cursor-pointer hover:opacity-90"
                          onClick={() => window.open(msg.file_url, "_blank")}
                        />
                      )}

                      {msg.file_url && msg.file_type === "audio" && (
                        <audio controls className="mb-2 max-w-full">
                          <source src={msg.file_url} />
                        </audio>
                      )}

                      {msg.content && (
                        <p className="text-sm break-words">{msg.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        {selectedFile && (
          <div className="mb-3 flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
            {selectedFile.type.startsWith("image/") ? (
              <Image className="w-4 h-4 text-purple-600" />
            ) : (
              <Mic className="w-4 h-4 text-purple-600" />
            )}
            <span className="text-sm text-gray-700 flex-1 truncate">
              {selectedFile.name}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setSelectedFile(null)}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {audioBlob && (
          <div className="mb-3 flex items-center gap-2 p-2 bg-red-50 rounded-lg">
            <Mic className="w-4 h-4 text-red-600" />
            <span className="text-sm text-gray-700 flex-1">Audio grabado</span>
            <audio controls className="h-8">
              <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
            </audio>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={cancelRecording}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isRecording && (
          <div className="mb-3 flex items-center gap-2 p-3 bg-red-100 rounded-lg animate-pulse">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
            <span className="text-sm text-red-700 flex-1 font-medium">
              Grabando audio...
            </span>
            <Button
              type="button"
              size="sm"
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Detener
            </Button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isRecording}
          >
            <Image className="w-5 h-5" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={uploading}
            className={isRecording ? "bg-red-100 border-red-500" : ""}
          >
            <Mic className={`w-5 h-5 ${isRecording ? "text-red-600" : ""}`} />
          </Button>

          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1"
            disabled={uploading || isRecording}
          />

          <Button
            type="submit"
            disabled={
              (!newMessage.trim() && !selectedFile && !audioBlob) ||
              uploading ||
              isRecording
            }
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
