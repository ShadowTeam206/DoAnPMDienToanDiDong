import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

let socket;

export function getSocket() {
  const token = useAuthStore.getState().token;

  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = undefined;
    }
    return undefined;
  }

  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
      auth: {
        token
      }
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
}

