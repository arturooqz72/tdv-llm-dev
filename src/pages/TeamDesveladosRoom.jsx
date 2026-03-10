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
      <div className="max-w-5xl mx-auto">
        <div className="bg-black/70 border border-cyan-500 rounded-2xl p-6 shadow-xl mb-4">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">
            TDV Charla
          </h1>

          <p className="text-gray-300">
            Chat privado exclusivo para miembros autorizados.
          </p>
        </div>

        <div className="bg-black/70 border border-cyan-500 rounded-2xl shadow-xl flex flex-col h-[70vh]">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">
                Aún no hay mensajes. Sé el primero en escribir.
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.userEmail === currentUser?.email;

                return (
                  <div
                    key={msg.id}
                    className={`max-w-[80%] rounded-xl p-3 border ${
                      isMine
                        ? "ml-auto bg-cyan-500/20 border-cyan-500"
                        : "bg-gray-900 border-gray-700"
                    }`}
                  >
                    <p className="text-cyan-400 text-sm font-bold mb-1">
                      {isMine ? "Tú" : msg.userName || msg.userEmail || "Usuario"}
                    </p>

                    <p className="text-white whitespace-pre-wrap">{msg.text}</p>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-700 p-4 flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />

            <button
              onClick={handleSend}
              disabled={sending}
              className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-black font-bold px-5 py-2 rounded-lg"
            >
              {sending ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
