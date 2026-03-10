import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

function getShortUserName(user) {
  const rawName =
    user?.displayName ||
    user?.full_name ||
    user?.name ||
    user?.email ||
    "Usuario";

  const safeName = String(rawName).trim();
  if (!safeName) return "Usuario";

  if (safeName.includes("@")) return safeName.split("@")[0];
  return safeName.split(" ")[0];
}

function getDateFromCreatedAt(createdAt) {
  try {
    if (!createdAt) return null;

    const date =
      typeof createdAt?.toDate === "function"
        ? createdAt.toDate()
        : new Date(createdAt);

    if (Number.isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

function formatMessageTime(createdAt) {
  const date = getDateFromCreatedAt(createdAt);
  if (!date) return "";

  try {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function isSameDay(a, b) {
  if (!a || !b) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayLabel(createdAt) {
  const date = getDateFromCreatedAt(createdAt);
  if (!date) return "";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return "Hoy";
  if (isSameDay(date, yesterday)) return "Ayer";

  try {
    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function shouldShowDateSeparator(currentMsg, previousMsg) {
  if (!currentMsg) return false;
  if (!previousMsg) return true;

  const currentDate = getDateFromCreatedAt(currentMsg.createdAt);
  const previousDate = getDateFromCreatedAt(previousMsg.createdAt);

  if (!currentDate || !previousDate) return false;
  return !isSameDay(currentDate, previousDate);
}

function shouldGroupWithPrevious(currentMsg, previousMsg) {
  if (!currentMsg || !previousMsg) return false;
  if (currentMsg.userEmail !== previousMsg.userEmail) return false;

  const currentDate = getDateFromCreatedAt(currentMsg.createdAt);
  const previousDate = getDateFromCreatedAt(previousMsg.createdAt);

  if (!currentDate || !previousDate) return false;
  if (!isSameDay(currentDate, previousDate)) return false;

  const diffMs = currentDate.getTime() - previousDate.getTime();
  return diffMs >= 0 && diffMs <= 5 * 60 * 1000;
}

export default function TeamDesveladosRoom() {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, "team_desvelados_room_messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        setMessages(items);
      },
      (error) => {
        console.error("Error leyendo mensajes:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      120
    )}px`;
  }, [newMessage]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || !currentUser?.email || sending) return;

    try {
      setSending(true);

      await addDoc(collection(db, "team_desvelados_room_messages"), {
        text,
        userEmail: currentUser.email,
        userName: getShortUserName(currentUser),
        createdAt: serverTimestamp(),
      });

      setNewMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      alert("No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId, isMine) => {
    if (!messageId || !isMine || deletingId) return;

    const confirmed = window.confirm("¿Eliminar este mensaje?");
    if (!confirmed) return;

    try {
      setDeletingId(messageId);
      await deleteDoc(doc(db, "team_desvelados_room_messages", messageId));
    } catch (error) {
      console.error("Error eliminando mensaje:", error);
      alert("No se pudo eliminar el mensaje.");
    } finally {
      setDeletingId("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const preparedMessages = useMemo(() => {
    return messages.map((msg, index) => {
      const previousMsg = index > 0 ? messages[index - 1] : null;

      return {
        ...msg,
        showDateSeparator: shouldShowDateSeparator(msg, previousMsg),
        dateLabel: formatDayLabel(msg.createdAt),
        groupedWithPrevious: shouldGroupWithPrevious(msg, previousMsg),
      };
    });
  }, [messages]);

  return (
    <div className="min-h-screen px-3 py-4 sm:px-4 sm:py-6 bg-gradient-to-b from-[#06212d] via-[#0a2b3c] to-[#031018]">
      <div className="max-w-5xl mx-auto rounded-[28px] overflow-hidden shadow-2xl border border-cyan-500/25 backdrop-blur-xl bg-white/[0.04]">
        <div className="px-5 py-4 sm:px-6 sm:py-5 bg-[linear-gradient(180deg,rgba(19,47,65,0.86),rgba(36,40,48,0.82))] border-b border-cyan-500/15 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-cyan-300 tracking-wide">
                TDV Charla
              </h1>
              <p className="text-gray-200/90 text-sm mt-1">
                Conversación privada entre miembros autorizados.
              </p>
            </div>

            <div className="shrink-0 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-200">
              Privado
            </div>
          </div>
        </div>

        <div className="h-[67vh] sm:h-[69vh] overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),transparent_32%),radial-gradient(circle_at_center,rgba(14,116,144,0.10),transparent_42%),linear-gradient(to_bottom,rgba(7,26,39,0.82),rgba(4,14,24,0.94))]">
          {preparedMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-500/10 text-cyan-300 text-xl shadow-lg shadow-cyan-500/10">
                  💬
                </div>
                <p className="text-cyan-100 font-semibold mb-1">
                  Bienvenido a TDV Charla
                </p>
                <p className="text-gray-300/80 text-sm">
                  Aún no hay mensajes. Sé el primero en escribir.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-2 sm:space-y-3">
              {preparedMessages.map((msg) => {
                const isMine = msg.userEmail === currentUser?.email;
                const name = msg.userName || msg.userEmail || "Usuario";
                const initial = String(name).charAt(0).toUpperCase();
                const messageTime = formatMessageTime(msg.createdAt);

                return (
                  <React.Fragment key={msg.id}>
                    {msg.showDateSeparator && msg.dateLabel && (
                      <div className="flex justify-center py-2">
                        <div className="rounded-full border border-cyan-500/15 bg-cyan-500/5 px-3 py-1 text-[11px] font-medium text-cyan-100/90 backdrop-blur">
                          {msg.dateLabel}
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex w-full ${
                        isMine ? "justify-end" : "justify-start"
                      } ${msg.groupedWithPrevious ? "mt-1" : "mt-2"}`}
                    >
                      {isMine ? (
                        <div className="max-w-[82%] sm:max-w-[74%] md:max-w-[66%] mr-1 sm:mr-2">
                          <div className="group rounded-3xl rounded-br-md px-4 py-3 shadow-md backdrop-blur-xl border bg-cyan-500/16 border-cyan-400/35 text-white">
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>

                            <div className="mt-2 flex items-center justify-end gap-2">
                              {messageTime && (
                                <span className="text-[11px] text-cyan-100/75">
                                  {messageTime}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteMessage(msg.id, isMine)
                                }
                                disabled={deletingId === msg.id}
                                className="text-[11px] text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                                title="Eliminar mensaje"
                              >
                                {deletingId === msg.id ? "..." : "Eliminar"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-end gap-2 sm:gap-3 max-w-[90%] sm:max-w-[82%]">
                          {!msg.groupedWithPrevious ? (
                            <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 border border-cyan-300/30 flex-shrink-0">
                              {initial}
                            </div>
                          ) : (
                            <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0" />
                          )}

                          <div className="rounded-3xl rounded-bl-md px-4 py-3 shadow-md backdrop-blur-xl border bg-white/[0.10] border-white/15 text-white">
                            {!msg.groupedWithPrevious && (
                              <p className="text-xs font-semibold mb-1 text-cyan-300">
                                {name}
                              </p>
                            )}

                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>

                            {messageTime && (
                              <div className="mt-2 flex justify-end">
                                <span className="text-[11px] text-gray-400">
                                  {messageTime}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-cyan-500/15 bg-[linear-gradient(180deg,rgba(10,24,34,0.90),rgba(8,18,28,0.94))] p-3 sm:p-4 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto flex items-end gap-2 sm:gap-3">
            <div className="flex-1 rounded-3xl border border-white/15 bg-white/[0.08] shadow-inner focus-within:border-cyan-400/70">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                rows={1}
                className="w-full resize-none bg-transparent text-white placeholder:text-gray-400 px-4 py-3 focus:outline-none max-h-[120px]"
                onKeyDown={handleKeyDown}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold px-5 sm:px-6 py-3 rounded-3xl shadow-md shadow-cyan-500/30 min-w-[92px]"
            >
              {sending ? "..." : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
