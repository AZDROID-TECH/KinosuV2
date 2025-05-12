import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  requestUserLastSeen: (userId: number) => Promise<void>;
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
  const [pendingRequests, setPendingRequests] = useState<Set<number>>(new Set());
  const { isLoggedIn, userId } = useAuth();

  // Son görülme zamanını istemek için fonksiyon
  const requestUserLastSeen = useCallback(async (targetUserId: number): Promise<void> => {
    if (!socket || !socket.connected) {
      console.warn('Socket bağlantısı yok, son görülme zamanı istenemedi');
      return;
    }

    // Eğer kullanıcı çevrimiçi ise veya zaten istekte bulunulmuşsa, işlemi atla
    if (onlineUsers.includes(targetUserId) || pendingRequests.has(targetUserId)) {
      return;
    }

    // İstek beklemede olarak işaretle
    setPendingRequests(prev => new Set([...prev, targetUserId]));
    
    // Son görülme zamanını iste
    socket.emit('user:lastSeen', { userId: targetUserId });
  }, [socket, onlineUsers, pendingRequests]);

  // Socket bağlantısını oluştur ve kullanıcı giriş/çıkış durumlarını izle
  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    // API URL'ını doğru şekilde belirle (geliştirme veya prodüksiyon ortamına göre)
    let API_URL;
    
    // Geliştirme ortamında sunucu farklı bir portta çalışabilir
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Geliştirme ortamında muhtemelen sunucu 5000 portunda çalışır
      API_URL = `http://${window.location.hostname}:5000`;
    } else {
      // Prodüksiyon ortamında sunucu ve istemci aynı origin'de çalışır
      API_URL = window.location.origin;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token bulunamadı, socket bağlantısı kurulamıyor');
      return;
    }
    
    // Auth objesi içerisinde token gönder
    const newSocket = io(API_URL, {
      withCredentials: true,
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Socket bağlantısı başarılı');
      // Kullanıcı "online" olduğunu bildir
      newSocket.emit('user:online', { userId });
    });

    newSocket.on('connect_error', (error) => {
      console.warn('Socket bağlantı hatası:', error.message);
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

    // Son görülme zamanı yanıtlarını dinle
    newSocket.on('user:lastSeenResponse', (data: { userId: number, lastSeen: string | null }) => {
      if (data.lastSeen) {
        setUserLastSeen(prev => ({
          ...prev,
          [data.userId]: new Date(data.lastSeen)
        }));
      }
      
      // İsteği tamamlandı olarak işaretle
      setPendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket bağlantısı kesildi:', reason);
      // Tekrar bağlanma stratejisi
      if (reason === 'io server disconnect') {
        // Sunucu bağlantıyı kapattıysa, manuel olarak tekrar bağlan
        setTimeout(() => {
          newSocket.connect();
        }, 1000);
      }
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

  // Kullanıcının çevrimiçi durumunu periyodik olarak kontrol et
  useEffect(() => {
    if (!socket || !isLoggedIn) return;

    // Her 5 dakikada bir "hala çevrimiçiyim" sinyali gönder
    const activityInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        socket.emit('user:online', { userId });
      }
    }, 4 * 60 * 1000); // 4 dakika - server side 5 dakika timer'ından kısa olmalı

    return () => {
      clearInterval(activityInterval);
    };
  }, [socket, isLoggedIn, userId]);

  // Kullanıcının online olup olmadığını kontrol et
  const isUserOnline = (userId: number): boolean => {
    return onlineUsers.includes(userId);
  };

  // Kullanıcının son görülme zamanını al
  const lastSeen = useCallback((userId: number): Date | null => {
    // Eğer kullanıcı çevrimiçi ise null dön (çevrimiçi olduğu gösterilecek)
    if (isUserOnline(userId)) {
      return null;
    }
    
    // Eğer son görülme zamanı önbelleğimizde yoksa ve henüz istenmemişse, iste
    if (!userLastSeen[userId] && !pendingRequests.has(userId)) {
      requestUserLastSeen(userId);
      return null; // İstek tamamlanana kadar null dön
    }
    
    return userLastSeen[userId] || null;
  }, [userLastSeen, onlineUsers, pendingRequests, requestUserLastSeen]);

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
    <OnlineStatusContext.Provider value={{ 
      onlineUsers, 
      isUserOnline, 
      lastSeen, 
      formatLastSeen, 
      requestUserLastSeen 
    }}>
      {children}
    </OnlineStatusContext.Provider>
  );
}; 