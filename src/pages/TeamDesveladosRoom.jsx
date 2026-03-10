import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
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

export default function TeamDesveladosRoom() {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, "team_desvelados_room_messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
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

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || !currentUser?.email) return;

    try {
      setSending(true);

      await addDoc(collection(db, "team_desvelados_room_messages"), {
        text,
        userEmail: currentUser.email,
        userName: getShortUserName(currentUser),
        createdAt: serverTimestamp(),
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      alert("No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black px-3 py-4 sm:px-4 sm:py-6">
      <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-cyan-500/30 backdrop-blur-xl bg-white/5">
        <div className="px-5 py-5 sm:px-6 bg-white/5 border-b border-cyan-500/20 backdrop-blur-xl">
          <h1 className="text-3xl font-bold text-cyan-300 tracking-wide">
            TDV Charla
          </h1>
          <p className="text-gray-300 text-sm mt-1">
            Conversación privada entre miembros autorizados.
          </p>
        </div>

        <div className="h-[70vh] overflow-y-auto px-3 py-5 sm:px-6 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_35%),linear-gradient(to_bottom,rgba(0,0,0,0.28),rgba(0,0,0,0.42))]">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                Aún no hay mensajes. Sé el primero en escribir.
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
              {messages.map((msg) => {
                const isMine = msg.userEmail === currentUser?.email;
                const name = msg.userName || msg.userEmail || "Usuario";
                const initial = String(name).charAt(0).toUpperCase();

                return (
                  <div
                    key={msg.id}
                    className={`flex w-full ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isMine ? (
                      <div className="flex items-end gap-2 sm:gap-3 max-w-[92%] sm:max-w-[82%]">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 border border-cyan-300/30 flex-shrink-0">
                          {initial}
                        </div>

                        <div className="rounded-2xl rounded-bl-md px-4 py-3 shadow-md backdrop-blur-xl border bg-white/10 border-white/20 text-white w-fit max-w-full">
                          <p className="text-xs font-semibold mb-1 text-cyan-400">
                            {name}
                          </p>

                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-[88%] sm:max-w-[78%]">
                        <div className="rounded-2xl rounded-br-md px-4 py-3 shadow-md backdrop-blur-xl border bg-cyan-500/20 border-cyan-400/40 text-white w-fit max-w-full ml-auto">
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-cyan-500/20 bg-black/30 p-3 sm:p-4 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-white/10 text-white border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-cyan-400 shadow-inner min-w-0"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />

            <button
              onClick={handleSend}
              disabled={sending}
              className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-black font-bold px-5 sm:px-6 py-3 rounded-2xl shadow-md shadow-cyan-500/30 shrink-0"
            >
              {sending ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
