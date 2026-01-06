import { useSocket } from '../contexts/SocketContext';

export const useWebSocket = () => {
  const { socket, isConnected } = useSocket();

  const sendMessage = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Message not sent:', event, data);
    }
  };

  const subscribe = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const unsubscribe = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  return {
    isConnected,
    sendMessage,
    subscribe,
    unsubscribe,
  };
};
