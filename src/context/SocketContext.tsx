import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Socket event tipləri
interface SocketEvents {
  'users:online': (users: number[]) => void;
  'user:offline': (data: { userId: number; lastSeen: string }) => void;
  'user:lastSeenResponse': (data: { userId: number; lastSeen: string | null }) => void;
  // Genişlənə bilən eventlər (mesaj, bildiriş və s.)
  [key: string]: (...args: any[]) => void;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: number[];
  userLastSeen: Record<number, Date>;
  isUserOnline: (userId: number) => boolean;
  lastSeen: (userId: number) => Date | null;
  formatLastSeen: (date: Date | null) => string;
  requestUserLastSeen: (userId: number) => void;
  onEvent: (event: string, handler: (...args: any[]) => void) => void;
  offEvent: (event: string, handler: (...args: any[]) => void) => void;
  emitEvent: (event: string, ...args: any[]) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext yalnız SocketProvider daxilində istifadə olunmalıdır');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { isLoggedIn, userId } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [userLastSeen, setUserLastSeen] = useState<Record<number, Date>>({});
  const pendingRequests = useRef<Set<number>>(new Set());

  // Socket bağlantısını qur
  useEffect(() => {
    if (!isLoggedIn || !userId) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    let API_URL;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      API_URL = `http://${window.location.hostname}:5000`;
    } else {
      API_URL = window.location.origin;
    }
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket: Socket = io(API_URL, {
      withCredentials: true,
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('user:online', { userId });
    });
    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });
    newSocket.on('users:online', (users: number[]) => {
      setOnlineUsers(users);
    });
    newSocket.on('user:offline', (data: { userId: number; lastSeen: string }) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      setUserLastSeen(prev => ({ ...prev, [data.userId]: new Date(data.lastSeen) }));
    });
    newSocket.on('user:lastSeenResponse', (data: { userId: number; lastSeen: string | null }) => {
      if (data.lastSeen) {
        setUserLastSeen(prev => ({ ...prev, [data.userId]: new Date(data.lastSeen) }));
      }
      pendingRequests.current.delete(data.userId);
    });

    // Temizlik
    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isLoggedIn, userId]);

  // Online status funksiyaları
  const isUserOnline = useCallback((id: number) => onlineUsers.includes(id), [onlineUsers]);
  const lastSeen = useCallback((id: number) => {
    if (isUserOnline(id)) return null;
    if (!userLastSeen[id] && !pendingRequests.current.has(id)) {
      requestUserLastSeen(id);
      return null;
    }
    return userLastSeen[id] || null;
  }, [userLastSeen, isUserOnline]);
  const formatLastSeen = (date: Date | null) => {
    if (!date) return 'Bilinmir';
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    if (diffMinutes < 1) return 'Az öncə';
    if (diffMinutes < 60) return `${diffMinutes} dəqiqə əvvəl`;
    if (diffMinutes < 60 * 24) return `${Math.floor(diffMinutes / 60)} saat əvvəl`;
    if (diffMinutes < 60 * 24 * 7) return `${Math.floor(diffMinutes / (60 * 24))} gün əvvəl`;
    return date.toLocaleDateString('az-AZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const requestUserLastSeen = useCallback((targetUserId: number) => {
    if (!socket || !socket.connected) return;
    if (onlineUsers.includes(targetUserId) || pendingRequests.current.has(targetUserId)) return;
    pendingRequests.current.add(targetUserId);
    socket.emit('user:lastSeen', { userId: targetUserId });
  }, [socket, onlineUsers]);

  // Dinamik event handler əlavə et/çıxar
  const onEvent = useCallback((event: string, handler: (...args: any[]) => void) => {
    socket?.on(event, handler);
  }, [socket]);
  const offEvent = useCallback((event: string, handler: (...args: any[]) => void) => {
    socket?.off(event, handler);
  }, [socket]);
  const emitEvent = useCallback((event: string, ...args: any[]) => {
    socket?.emit(event, ...args);
  }, [socket]);

  // Sayfa görünürlüğü və çıxışda online statusu güncelle
  useEffect(() => {
    if (!socket || !isLoggedIn || !userId) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        socket.emit('user:online', { userId });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const handleBeforeUnload = () => {
      socket.emit('user:offline', { userId });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [socket, isLoggedIn, userId]);

  // Aktivlik üçün periodik "online" sinyali
  useEffect(() => {
    if (!socket || !isLoggedIn || !userId) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        socket.emit('user:online', { userId });
      }
    }, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, [socket, isLoggedIn, userId]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      onlineUsers,
      userLastSeen,
      isUserOnline,
      lastSeen,
      formatLastSeen,
      requestUserLastSeen,
      onEvent,
      offEvent,
      emitEvent,
    }}>
      {children}
    </SocketContext.Provider>
  );
}; 