import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';

export default function Chat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedChatName, setSelectedChatName] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // Update last_seen
        await base44.auth.updateMe({
          last_seen: new Date().toISOString()
        });
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();

    // Update last_seen every 2 minutes
    const interval = setInterval(async () => {
      try {
        await base44.auth.updateMe({
          last_seen: new Date().toISOString()
        });
      } catch (error) {
        console.log('Error updating last_seen');
      }
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  // Check for direct message from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const chatWithEmail = urlParams.get('with');
    const chatWithName = urlParams.get('name');
    
    if (chatWithEmail && chatWithName) {
      setSelectedChat(chatWithEmail);
      setSelectedChatName(decodeURIComponent(chatWithName));
    } else {
      // Default to group chat
      setSelectedChat(null);
      setSelectedChatName('Team Desvelados Chat');
    }
  }, []);

  const handleSelectChat = (userEmail, userName) => {
    setSelectedChat(userEmail);
    setSelectedChatName(userName);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-6 px-4">
      <div className="max-w-7xl mx-auto h-[calc(100vh-100px)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {/* Chat List - Hidden on mobile when chat selected */}
          <div className={`${selectedChat !== null && selectedChat !== undefined ? 'hidden md:block' : ''} md:col-span-1 bg-white rounded-3xl shadow-xl overflow-hidden`}>
            <ChatList 
              currentUser={currentUser}
              onSelectChat={handleSelectChat}
            />
          </div>

          {/* Chat Window */}
          <div className={`${selectedChat === null && selectedChat === undefined ? 'hidden md:block' : ''} md:col-span-2 bg-white rounded-3xl shadow-xl overflow-hidden`}>
            <ChatWindow
              currentUser={currentUser}
              chatWith={selectedChat}
              chatName={selectedChatName}
              onBack={() => {
                setSelectedChat(undefined);
                setSelectedChatName('');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}