import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../utils/jwt';
import { getClient } from '../utils/supabase';
import { logger } from '../utils/logger';

// Çevrimiçi kullanıcıları tutacak Map
const onlineUserMap = new Map<number, { socketId: string, lastSeen: Date, heartbeat: NodeJS.Timeout }>();

/**
 * @az İstifadəçinin son görünmə tarixini yeniləyən funksiya
 * @param userId İstifadəçi ID
 * @param time Qeyd ediləcək tarix (verilməzsə cari vaxt istifadə edilir)
 */
const updateLastSeen = async (userId: number, time?: Date): Promise<void> => {
  try {
    const updateTime = time || new Date();
    
    await getClient()
      .from('users')
      .update({ last_seen: updateTime.toISOString() })
      .eq('id', userId);
      
    // Map'deki son görülme zamanını da güncelle
    const userInfo = onlineUserMap.get(userId);
    if (userInfo) {
      onlineUserMap.set(userId, {
        ...userInfo,
        lastSeen: updateTime
      });
    }
    
    logger.warn(`${userId} ID'li kullanıcının son görülme zamanı güncellendi: ${updateTime.toISOString()}`);
  } catch (error) {
    logger.error(`Son görülme zamanı güncellenemedi: ${error}`);
  }
};

/**
 * @az İstifadəçinin son görünmə tarixini bazadan alan funksiya
 * @param userId İstifadəçi ID
 */
const getLastSeenFromDB = async (userId: number): Promise<Date | null> => {
  try {
    const { data, error } = await getClient()
      .from('users')
      .select('last_seen')
      .eq('id', userId)
      .single();
    
    if (error || !data || !data.last_seen) {
      return null;
    }
    
    return new Date(data.last_seen);
  } catch (error) {
    logger.error(`Son görülme zamanı alınamadı: ${error}`);
    return null;
  }
};

export const initializeSocketServer = (server: HttpServer) => {
  const io = new SocketServer(server, {
    cors: {
      // Hem dev hem de prod modunda çalışacak CORS ayarları
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.CLIENT_URL || true 
        : ['http://localhost:3000', 'http://localhost:5000'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // JWT token doğrulama aracı (socket middleware)
  io.use(async (socket, next) => {
    try {
      // Hem headers hem de auth objesinden token almayı dene
      let token = socket.handshake.headers.authorization?.split('Bearer ')[1];
      
      // Headers'da token yoksa, auth'dan kontrol et
      if (!token && socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      }
      
      if (!token) {
        logger.warn(`Socket bağlantısı reddedildi: Token bulunamadı`);
        return next(new Error('Kimlik doğrulama başarısız oldu: Token tapılmadı'));
      }
      
      const decoded = await verifyToken(token);
      
      if (!decoded || typeof decoded.id !== 'number') {
        logger.warn(`Socket bağlantısı reddedildi: Geçersiz token içeriği`);
        return next(new Error('Kimlik doğrulama başarısız oldu: Geçersiz token'));
      }
      
      // socketAuth nesnesine kullanıcı bilgilerini ekle
      socket.data.user = { 
        userId: decoded.id,
        username: decoded.username 
      };
      
      logger.warn(`${decoded.id} ID'li kullanıcı için socket kimlik doğrulaması başarılı`);
      next();
    } catch (error: any) {
      logger.error(`Socket kimlik doğrulama hatası: ${error.message}`);
      next(new Error(`Kimlik doğrulama başarısız oldu: ${error.message}`));
    }
  });

  io.on('connection', async (socket) => {
    // Kullanıcı verileri yoksa hata günlüğü
    if (!socket.data.user) {
      logger.warn('Socket bağlantısı reddedildi: Kullanıcı verisi yok');
      socket.disconnect(true);
      return;
    }
    
    const { userId } = socket.data.user;
    logger.warn(`${userId} ID'li kullanıcı çevrimiçi oldu. Socket ID: ${socket.id}`);
    
    // Mevcut kullanıcının heartbeat timer'ını temizle (varsa)
    if (onlineUserMap.has(userId)) {
      const oldHeartbeat = onlineUserMap.get(userId)?.heartbeat;
      if (oldHeartbeat) {
        clearInterval(oldHeartbeat);
      }
    }
    
    // Periyodik olarak last_seen zamanını güncelleyecek interval
    const heartbeatInterval = setInterval(async () => {
      // Kullanıcı hala onlineUserMap'de ise, last_seen zamanını güncelle
      if (onlineUserMap.has(userId) && onlineUserMap.get(userId)?.socketId === socket.id) {
        await updateLastSeen(userId);
      } else {
        // Kullanıcı online değilse interval'ı temizle
        clearInterval(heartbeatInterval);
      }
    }, 5 * 60 * 1000); // 5 dakikada bir güncelle
    
    // Kullanıcı bağlandığında otomatik olarak online olarak işaretle
    onlineUserMap.set(userId, { 
      socketId: socket.id,
      lastSeen: new Date(),
      heartbeat: heartbeatInterval
    });
    
    // Veritabanında kullanıcının son görülme zamanını güncelle
    await updateLastSeen(userId);
    
    // Tüm bağlı istemcilere çevrimiçi kullanıcıları gönder
    io.emit('users:online', Array.from(onlineUserMap.keys()));
    
    // Kullanıcı bağlandı - socket.id ile ilişkilendir
    socket.on('user:online', async (data) => {
      // Kullanıcı kimliğini doğrula
      if (data.userId === userId) {
        // Mevcut heartbeat timer'ı varsa temizle
        const oldHeartbeat = onlineUserMap.get(userId)?.heartbeat;
        if (oldHeartbeat) {
          clearInterval(oldHeartbeat);
        }
        
        onlineUserMap.set(userId, { 
          socketId: socket.id,
          lastSeen: new Date(),
          heartbeat: heartbeatInterval
        });
        
        // Veritabanında kullanıcının son görülme zamanını güncelle
        await updateLastSeen(userId);
        
        // Tüm bağlı istemcilere çevrimiçi kullanıcıları gönder
        io.emit('users:online', Array.from(onlineUserMap.keys()));
      }
    });
    
    // Son görülme zamanını istemek için yeni olay
    socket.on('user:lastSeen', async (data) => {
      try {
        const targetUserId = data.userId;
        let lastSeenDate: Date | null = null;
        
        // Eğer kullanıcı çevrimiçi ise current date dön
        if (onlineUserMap.has(targetUserId)) {
          lastSeenDate = new Date();
        } else {
          // Değilse veritabanından al
          lastSeenDate = await getLastSeenFromDB(targetUserId);
        }
        
        // Sadece isteyen istemciye gönder
        socket.emit('user:lastSeenResponse', { 
          userId: targetUserId, 
          lastSeen: lastSeenDate ? lastSeenDate.toISOString() : null 
        });
      } catch (error) {
        logger.error(`Son görülme zamanı alınamadı: ${error}`);
      }
    });
    
    // Kullanıcı offline durumuna geçti
    socket.on('user:offline', async (data) => {
      if (data.userId === userId) {
        const lastSeen = new Date();
        
        // Interval'ı temizle
        const heartbeat = onlineUserMap.get(userId)?.heartbeat;
        if (heartbeat) {
          clearInterval(heartbeat);
        }
        
        // Map'den kullanıcıyı çıkar
        onlineUserMap.delete(userId);
        
        // Veritabanında son görülme zamanını güncelle
        await updateLastSeen(userId, lastSeen);
        
        // Tüm istemcilere kullanıcının çevrimdışı olduğunu bildir
        io.emit('user:offline', { userId, lastSeen: lastSeen.toISOString() });
        io.emit('users:online', Array.from(onlineUserMap.keys()));
      }
    });
    
    // Bağlantı kesildi
    socket.on('disconnect', async (reason) => {
      // Kullanıcının socket bilgisini kontrol et
      for (const [id, data] of onlineUserMap.entries()) {
        if (data.socketId === socket.id) {
          const lastSeen = new Date();
          logger.warn(`${id} ID'li kullanıcı bağlantısı kesildi. Sebep: ${reason}`);
          
          // Interval'ı temizle
          if (data.heartbeat) {
            clearInterval(data.heartbeat);
          }
          
          // Map'den kullanıcıyı çıkar
          onlineUserMap.delete(id);
          
          // Veritabanında son görülme zamanını güncelle
          await updateLastSeen(id, lastSeen);
          
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
  return getLastSeenFromDB(userId);
}; 