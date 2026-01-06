import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', { autoConnect: false });

export const useChatSocket = (roomId, setMessages) => {
  useEffect(() => {
    socket.connect();
    if (roomId) socket.emit('join_room', roomId);

    socket.on('receive_message', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    socket.on('receive_reaction', ({ messageId, emoji }) => {
      setMessages((prev) => prev.map(msg => 
        msg.id === messageId 
        ? { ...msg, reactions: [...(msg.reactions || []), emoji] } 
        : msg
      ));
    });

    socket.on('message_deleted', ({ messageId }) => {
      setMessages((prev) => prev.filter(msg => msg.id !== messageId));
    });

    return () => {
      socket.off('receive_message');
      socket.off('receive_reaction');
      socket.off('message_deleted');
      socket.disconnect();
    };
  }, [roomId, setMessages]);

  const sendMessage = (messageData) => {
    socket.emit('send_message', { ...messageData, roomId });
  };

  const sendReaction = (messageId, emoji) => {
    socket.emit('send_reaction', { messageId, emoji, roomId });
  };

  return { sendMessage, sendReaction };
};