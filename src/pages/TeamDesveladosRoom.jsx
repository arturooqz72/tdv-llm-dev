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
    <div className="min-h-screen px-3 py-4 sm:px-4 sm:py-6 bg-gradient-to-b from-[#e9f9ff] via-[#f5fcff] to-[#ffffff]">
      <div className="max-w-5xl mx-auto rounded-[28px] overflow-hidden shadow-xl border border-cyan-200/70 bg-white/80 backdrop-blur-md">
        <div className="px-5 py-4 sm:px-6 sm:py-5 bg-[linear-gradient(180deg,rgba(224,247,255,0.95),rgba(245,252,255,0.92))] border-b border-cyan-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-cyan-700 tracking-wide">
                TDV Charla
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                Conversación privada entre miembros autorizados.
              </p>
            </div>

            <div className="shrink-0 rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
              Privado
            </div>
          </div>
        </div>

        <div className="h-[67vh] sm:h-[69vh] overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.20),transparent_32%),linear-gradient(to_bottom,rgba(247,253,255,0.96),rgba(236,248,255,0.92))]">
          {preparedMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-cyan-600 text-xl shadow-sm">
                  💬
                </div>
                <p className="text-cyan-700 font-semibold mb-1">
                  Bienvenido a TDV Charla
                </p>
                <p className="text-slate-500 text-sm">
                  Aún no hay mensajes. Sé el primero en escribir.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-1.5 sm:space-y-2">
              {preparedMessages.map((msg) => {
                const isMine = msg.userEmail === currentUser?.email;
                const name = msg.userName || msg.userEmail || "Usuario";
                const initial = String(name).charAt(0).toUpperCase();
                const messageTime = formatMessageTime(msg.createdAt);

                return (
                  <React.Fragment key={msg.id}>
                    {msg.showDateSeparator && msg.dateLabel && (
                      <div className="flex justify-center py-2">
                        <div className="rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-[11px] font-medium text-cyan-700 shadow-sm">
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
                          <div className="group rounded-3xl rounded-br-md px-4 py-3 shadow-sm border bg-cyan-100/90 border-cyan-200 text-slate-800">
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>

                            <div className="mt-2 flex items-center justify-end gap-2">
                              {messageTime && (
                                <span className="text-[11px] text-slate-500">
                                  {messageTime}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteMessage(msg.id, isMine)
                                }
                                disabled={deletingId === msg.id}
                                className="text-[11px] text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
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
                            <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-500 text-white font-bold text-xs sm:text-sm shadow-sm border border-cyan-200 flex-shrink-0">
                              {initial}
                            </div>
                          ) : (
                            <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0" />
                          )}

                          <div className="rounded-3xl rounded-bl-md px-4 py-3 shadow-sm border bg-white/92 border-cyan-100 text-slate-800">
                            {!msg.groupedWithPrevious && (
                              <p className="text-xs font-semibold mb-1 text-cyan-700">
                                {name}
                              </p>
                            )}

                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>

                            {messageTime && (
                              <div className="mt-2 flex justify-end">
                                <span className="text-[11px] text-slate-400">
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

        <div className="border-t border-cyan-100 bg-white/85 p-3 sm:p-4 backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex items-end gap-2 sm:gap-3">
            <div className="flex-1 rounded-3xl border border-cyan-200 bg-white shadow-inner focus-within:border-cyan-400">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                rows={1}
                className="w-full resize-none bg-transparent text-slate-800 placeholder:text-slate-400 px-4 py-3 focus:outline-none max-h-[120px]"
                onKeyDown={handleKeyDown}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 sm:px-6 py-3 rounded-3xl shadow-sm min-w-[92px]"
            >
              {sending ? "..." : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
