import React, { useEffect, useState } from "react";
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

  if (safeName.includes("@")) {
    return safeName.split("@")[0];
  }

  return safeName.split(" ")[0];
}

export default function TeamDesveladosRoom() {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

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
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-black/70 border border-cyan-500 rounded-3xl p-6 shadow-xl mb-4">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">
            TDV Charla
          </h1>

          <p className="text-gray-300">
            Chat privado exclusivo para miembros autorizados.
          </p>
        </div>

        <div className="bg-black/70 border border-cyan-500 rounded-3xl shadow-xl flex flex-col h-[70vh] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">
                Aún no hay mensajes. Sé el primero en escribir.
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.userEmail === currentUser?.email;
                const name = msg.userName || msg.userEmail || "Usuario";
                const initial = String(name).charAt(0).toUpperCase();

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-3 ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isMine && (
                      <div className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 flex-shrink-0 border border-cyan-300/30">
                        {initial}
                      </div>
                    )}

                    <div
                      className={`min-w-[120px] max-w-[75%] rounded-2xl px-4 py-3 border shadow-sm ${
                        isMine
                          ? "bg-cyan-500/15 border-cyan-400/70 text-white"
                          : "bg-gray-900/95 border-gray-700 text-white"
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold mb-1 ${
                          isMine ? "text-cyan-300" : "text-cyan-400"
                        }`}
                      >
                        {isMine ? "Tú" : name}
                      </p>

                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                    </div>

                    {isMine && (
                      <div className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 flex-shrink-0 border border-cyan-300/30">
                        {initial}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-cyan-500/20 bg-black/40 p-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-gray-900/90 text-white border border-gray-700 rounded-2xl px-4 py-3 focus:outline-none focus:border-cyan-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
              />

              <button
                onClick={handleSend}
                disabled={sending}
                className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-black font-bold px-6 py-3 rounded-2xl shadow-md"
              >
                {sending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
