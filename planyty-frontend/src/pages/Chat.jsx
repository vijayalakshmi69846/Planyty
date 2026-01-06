// src/pages/Chat.jsx
import React from 'react';
import Chat from '../components/chat';

const ChatPage = () => {
  return (
    <div className="h-[calc(100vh-80px)]"> {/* Keep this! */}
      <Chat />
    </div>
  );
};

export default ChatPage;