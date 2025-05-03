import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// process değişkeni için tip tanımı
declare const process: {
  env: {
    NODE_ENV: string;
  }
};

interface OnlineUser {
  userId: number;
  lastSeen: Date;
}

interface OnlineStatusContextType {
  onlineUsers: number[];
  isUserOnline: (userId: number) => boolean;
  lastSeen: (userId: number) => Date | null;
  formatLastSeen: (date: Date | null) => string;
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined);

export const useOnlineStatus = () => {
  const context = useContext(OnlineStatusContext);
  if (!context) {
    throw new Error('useOnlineStatus must be used within an OnlineStatusProvider');
  }
  return context;
};

interface OnlineStatusProviderProps {
  children: ReactNode;
}

export const OnlineStatusProvider: React.FC<OnlineStatusProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [userLastSeen, setUserLastSeen] = useState<Record<number, Date>>({});
  const { isLoggedIn, userId } = useAuth();

  // Socket bağlantısını oluştur ve kullanıcı giriş/çıkış durumlarını izle
  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    // Her zaman mevcut origin'i kullan
    const API_URL = window.location.origin;
    
    const newSocket = io(API_URL, {
      withCredentials: true,
      extraHeaders: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    newSocket.on('connect', () => {
      // Kullanıcı "online" olduğunu bildir
      newSocket.emit('user:online', { userId });
    });

    newSocket.on('connect_error', (error) => {
      // Sessizce hataları görmezden gel
    });

    newSocket.on('users:online', (users: number[]) => {
      setOnlineUsers(users);
    });

    newSocket.on('user:offline', (data: { userId: number, lastSeen: string }) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      setUserLastSeen(prev => ({
        ...prev,
        [data.userId]: new Date(data.lastSeen)
      }));
    });

    newSocket.on('disconnect', () => {
      // Sessizce bağlantı kesildiğinde devam et
    });

    setSocket(newSocket);

    // Temizleme fonksiyonu
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isLoggedIn, userId]);

  // Sayfa görünürlüğü değiştiğinde kullanıcının durumunu güncelle
  useEffect(() => {
    if (!socket || !isLoggedIn) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        socket.emit('user:online', { userId });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Tarayıcıdan ayrılmadan önce "offline" olduğunu bildir
    const handleBeforeUnload = () => {
      socket.emit('user:offline', { userId });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [socket, isLoggedIn, userId]);

  // Kullanıcının online olup olmadığını kontrol et
  const isUserOnline = (userId: number): boolean => {
    return onlineUsers.includes(userId);
  };

  // Kullanıcının son görülme zamanını al
  const lastSeen = (userId: number): Date | null => {
    return userLastSeen[userId] || null;
  };

  // Son görülme zamanını formatlı şekilde göster
  const formatLastSeen = (date: Date | null): string => {
    if (!date) return "Bilinmir";
    
    // Şimdi ile farkını hesapla
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    
    if (diffMinutes < 1) {
      return "Az öncə";
    } else if (diffMinutes < 60) {
      return `${diffMinutes} dəqiqə əvvəl`;
    } else if (diffMinutes < 60 * 24) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} saat əvvəl`;
    } else if (diffMinutes < 60 * 24 * 7) {
      const days = Math.floor(diffMinutes / (60 * 24));
      return `${days} gün əvvəl`;
    } else {
      return date.toLocaleDateString('az-AZ', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <OnlineStatusContext.Provider value={{ onlineUsers, isUserOnline, lastSeen, formatLastSeen }}>
      {children}
    </OnlineStatusContext.Provider>
  );
}; 