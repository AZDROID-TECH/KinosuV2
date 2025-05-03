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

    // Her zaman mevcut sunucuya bağlan (window.location.origin)
    // Böylece hem geliştirme hem de üretim ortamında aynı host kullanılır
    const socketUrl = window.location.origin;
    
    console.log('Socket.io bağlantısı kuruluyor:', socketUrl);
    
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Önce websocket dene, olmuyorsa polling'e düş
      extraHeaders: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      reconnectionAttempts: 5, // Yeniden bağlanma denemesi sayısı
      reconnectionDelay: 1000, // Başlangıç gecikmesi (ms)
      reconnectionDelayMax: 5000, // Maksimum gecikme (ms)
      timeout: 20000 // Bağlantı zaman aşımı (ms)
    });

    newSocket.on('connect', () => {
      console.log('Socket.io bağlantısı kuruldu, ID:', newSocket.id);
      
      // Kullanıcı "online" olduğunu bildir
      newSocket.emit('user:online', { userId });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.io bağlantı hatası:', error.message);
    });

    newSocket.on('users:online', (users: number[]) => {
      console.log('Çevrimiçi kullanıcılar güncellendi:', users);
      setOnlineUsers(users);
    });

    newSocket.on('user:offline', (data: { userId: number, lastSeen: string }) => {
      console.log('Kullanıcı çevrimdışı oldu:', data.userId);
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      setUserLastSeen(prev => ({
        ...prev,
        [data.userId]: new Date(data.lastSeen)
      }));
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket.io bağlantısı kesildi, sebep:', reason);
    });

    setSocket(newSocket);

    // Temizleme fonksiyonu
    return () => {
      if (newSocket) {
        console.log('Socket.io bağlantısı kapatılıyor');
        newSocket.disconnect();
      }
    };
  }, [isLoggedIn, userId]);

  // Sayfa görünürlüğü değiştiğinde kullanıcının durumunu güncelle
  useEffect(() => {
    if (!socket || !isLoggedIn) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Sayfa görünür, kullanıcı çevrimiçi durumuna geçiyor');
        socket.emit('user:online', { userId });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Tarayıcıdan ayrılmadan önce "offline" olduğunu bildir
    const handleBeforeUnload = () => {
      console.log('Sayfa kapatılıyor, kullanıcı çevrimdışı durumuna geçiyor');
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

  return (
    <OnlineStatusContext.Provider value={{ onlineUsers, isUserOnline, lastSeen }}>
      {children}
    </OnlineStatusContext.Provider>
  );
}; 