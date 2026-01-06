import React, { createContext, useContext, useRef, useState } from "react";
import { FakeServer } from "../fake-backend/fakeServer";

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const listeners = useRef({});

  const socket = {
    on(event, callback) {
      listeners.current[event] = callback;
    },

    off(event) {
      delete listeners.current[event];
    },

    emit(event, data) {
      console.log(`⚡ Fake Socket emit: ${event}`, data);

      if (event === "sendMessage") {
        const msg = FakeServer.sendMessage(data.chatId, data.text, data.sender);

        setTimeout(() => {
          if (listeners.current["chatMessage"]) {
            listeners.current["chatMessage"](msg);
          }
        }, 600);
      }

      if (event === "typing") {
        if (listeners.current["typing"]) {
          listeners.current["typing"](data);
        }
      }
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected: true }}>
      {children}
    </SocketContext.Provider>
  );
};
