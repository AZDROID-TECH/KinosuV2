import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../utils/jwt';
import { getClient } from '../utils/supabase';

// Çevrimiçi kullanıcıları tutacak Map
const onlineUserMap = new Map<number, { socketId: string, lastSeen: Date }>();

export const initializeSocketServer = (server: HttpServer) => {
  const io = new SocketServer(server, {
    cors: {
      // NODE_ENV değerinden bağımsız olarak tüm origin'lere izin ver
      origin: true,
      credentials: true
    }
  });

  // JWT token doğrulama aracı (socket middleware)
  io.use(async (socket, next) => {
    const token = socket.handshake.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return next(new Error('Kimlik doğrulama başarısız oldu'));
    }
    
    try {
      const decoded = await verifyToken(token);
      
      // socketAuth nesnesine kullanıcı bilgilerini ekle
      socket.data.user = { 
        userId: decoded.id,
        username: decoded.username 
      };
      
      next();
    } catch (error) {
      next(new Error('Token etibarsızdır'));
    }
  });

  io.on('connection', (socket) => {
    // Kullanıcı verileri yoksa hata günlüğü
    if (!socket.data.user) {
      return;
    }
    
    const { userId } = socket.data.user;
    
    // Kullanıcı bağlandı - socket.id ile ilişkilendir
    socket.on('user:online', async (data) => {
      // Kullanıcı kimliğini doğrula
      if (data.userId === userId) {
        onlineUserMap.set(userId, { 
          socketId: socket.id,
          lastSeen: new Date()
        });
        
        // Veritabanında kullanıcının son görülme zamanını güncelle
        try {
          await getClient()
            .from('users')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', userId);
        } catch (error) {
          console.error('Son görülme zamanı güncellenemedi:', error);
        }
        
        // Tüm bağlı istemcilere çevrimiçi kullanıcıları gönder
        io.emit('users:online', Array.from(onlineUserMap.keys()));
      }
    });
    
    // Kullanıcı offline durumuna geçti
    socket.on('user:offline', async (data) => {
      if (data.userId === userId) {
        const lastSeen = new Date();
        
        // Map'den kullanıcıyı çıkar
        onlineUserMap.delete(userId);
        
        // Veritabanında son görülme zamanını güncelle
        try {
          await getClient()
            .from('users')
            .update({ last_seen: lastSeen.toISOString() })
            .eq('id', userId);
        } catch (error) {
          console.error('Son görülme zamanı güncellenemedi:', error);
        }
        
        // Tüm istemcilere kullanıcının çevrimdışı olduğunu bildir
        io.emit('user:offline', { userId, lastSeen: lastSeen.toISOString() });
        io.emit('users:online', Array.from(onlineUserMap.keys()));
      }
    });
    
    // Bağlantı kesildi
    socket.on('disconnect', async () => {
      // Kullanıcının socket bilgisini kontrol et
      for (const [id, data] of onlineUserMap.entries()) {
        if (data.socketId === socket.id) {
          const lastSeen = new Date();
          
          // Map'den kullanıcıyı çıkar
          onlineUserMap.delete(id);
          
          // Veritabanında son görülme zamanını güncelle
          try {
            await getClient()
              .from('users')
              .update({ last_seen: lastSeen.toISOString() })
              .eq('id', id);
          } catch (error) {
            console.error('Son görülme zamanı güncellenemedi:', error);
          }
          
          // Tüm istemcilere kullanıcının çevrimdışı olduğunu bildir
          io.emit('user:offline', { userId: id, lastSeen: lastSeen.toISOString() });
          io.emit('users:online', Array.from(onlineUserMap.keys()));
          break;
        }
      }
    });
  });

  return io;
};

// Çevrimiçi kullanıcıları döndür
export const getOnlineUsers = (): number[] => {
  return Array.from(onlineUserMap.keys());
};

// Belirli bir kullanıcının çevrimiçi olup olmadığını kontrol et
export const isUserOnline = (userId: number): boolean => {
  return onlineUserMap.has(userId);
};

// Belirli bir kullanıcının son görülme zamanını al
export const getUserLastSeen = async (userId: number): Promise<Date | null> => {
  // Önce hafızadan kontrol et
  if (onlineUserMap.has(userId)) {
    return onlineUserMap.get(userId)?.lastSeen || null;
  }
  
  // Veritabanından son görülme zamanını al
  try {
    const { data, error } = await getClient()
      .from('users')
      .select('last_seen')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.last_seen ? new Date(data.last_seen) : null;
  } catch (error) {
    console.error('Son görülme zamanı alınamadı:', error);
    return null;
  }
}; 