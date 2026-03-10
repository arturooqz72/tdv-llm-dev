import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import OnlineIndicator from "@/components/OnlineIndicator";

const PRIVATE_MESSAGES_STORAGE_KEY = "tdv_private_messages";
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

function readStoredMessages() {
  const data = readJSON(PRIVATE_MESSAGES_STORAGE_KEY, []);
  return Array.isArray(data) ? data : [];
}

function readStoredUsers() {
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
    if (user?.email) {
      unique.set(user.email, user);
    }
  });

  return Array.from(unique.values());
}

export default function ChatList({ currentUser, onSelectChat }) {
  const [searchQuery, setSearchQuery] = useState("");

  const canAccessTDVChat =
    currentUser?.role === "admin" ||
    currentUser?.canAccessTeamDesveladosRoom === true;

  const allMessages = useMemo(() => readStoredMessages(), []);
  const allUsers = useMemo(() => readStoredUsers(), []);

  const conversations = useMemo(() => {
    if (!currentUser?.email) return [];

    const convMap = new Map();

    allMessages.forEach((msg) => {
      const isParticipant =
        msg.sender_email === currentUser.email ||
        msg.receiver_email === currentUser.email;

      if (!isParticipant) return;

      const otherUserEmail =
        msg.sender_email === currentUser.email
          ? msg.receiver_email
          : msg.sender_email;

      if (!otherUserEmail) return;

      if (!convMap.has(otherUserEmail)) {
        convMap.set(otherUserEmail, {
          userEmail: otherUserEmail,
          lastMessage: msg,
          unreadCount: 0,
        });
      } else {
        const existing = convMap.get(otherUserEmail);
        const msgDate = new Date(msg.created_date || 0);
        const existingDate = new Date(existing.lastMessage?.created_date || 0);

        if (msgDate > existingDate) {
          existing.lastMessage = msg;
        }
      }

      if (msg.receiver_email === currentUser.email && !msg.is_read) {
        const conv = convMap.get(otherUserEmail);
        conv.unreadCount += 1;
      }
    });

    return Array.from(convMap.values())
      .map((conv) => {
        const user = allUsers.find((u) => u.email === conv.userEmail);

        return {
          ...conv,
          userName:
            user?.full_name ||
            user?.name ||
            user?.displayName ||
            conv.userEmail.split("@")[0],
          lastSeen: user?.last_seen || user?.lastSeen || null,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.lastMessage?.created_date || 0);
        const dateB = new Date(b.lastMessage?.created_date || 0);
        return dateB - dateA;
      });
  }, [allMessages, allUsers, currentUser]);

  const filteredConversations = conversations.filter((conv) =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Mensajes
        </h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversaciones..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">
              {searchQuery
                ? "No se encontraron conversaciones"
                : "No hay conversaciones aún"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conv) => (
              <button
                key={conv.userEmail}
                onClick={() => onSelectChat?.(conv.userEmail, conv.userName)}
                className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                      {conv.userName.charAt(0).toUpperCase()}
                    </div>
                    <OnlineIndicator
                      lastSeen={conv.lastSeen}
                      className="absolute bottom-0 right-0"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {conv.userName}
                      </p>

                      {conv.unreadCount > 0 && (
                        <Badge className="bg-purple-600 text-white">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-500 truncate">
                      {conv.lastMessage?.sender_email === currentUser?.email
                        ? "Tú: "
                        : ""}
                      {conv.lastMessage?.content || "Sin mensajes"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 space-y-2">
        {canAccessTDVChat && (
          <Link to="/TeamDesveladosRoom">
            <button
              type="button"
              className="w-full inline-flex items-center justify-start gap-2 rounded-md border border-cyan-500 px-4 py-2 text-cyan-500 hover:bg-cyan-500/10 transition-colors"
            >
              <Users className="w-4 h-4" />
              Team Desvelados Chat
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
