import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../utils/jwt';
import { getClient } from '../utils/supabase';

// Çevrimiçi kullanıcıları tutacak Map
const onlineUserMap = new Map<number, { socketId: string, lastSeen: Date }>();

export const initializeSocketServer = (server: HttpServer) => {
  // Geliştirici ortamı veya üretim ortamı için origin ayarları
  const allowedOrigins = process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://localhost:5000']
    : true; // Üretim ortamında tüm originlere izin ver (CORS middleware zaten kontrol ediyor)
    
  console.log(`Socket.io sunucusu başlatılıyor. Ortam: ${process.env.NODE_ENV}, Origins:`, allowedOrigins);

  const io = new SocketServer(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    },
    // Eğer proxy arkasında çalışıyorsa, istemcinin IP adresini doğru şekilde almak için
    transports: ['websocket', 'polling'],
    // 60 saniye içinde ping-pong olmazsa bağlantı kopar
    pingTimeout: 60000,
    // Her 25 saniyede bir ping gönder
    pingInterval: 25000,
    // Handshake zaman aşımı - bağlantı kurulurken beklenecek maksimum süre
    connectTimeout: 45000
  });

  // Debug bilgilerini logla
  io.engine.on("connection_error", (err) => {
    console.error(`Socket.io bağlantı hatası: ${err.message}, kod: ${err.code}, bağlantı: ${err.context}`);
  });

  // JWT token doğrulama aracı (socket middleware)
  io.use(async (socket, next) => {
    console.log(`Yeni socket bağlantısı istendi: ${socket.id}, headers:`, socket.handshake.headers);
    const token = socket.handshake.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      console.error(`Socket ${socket.id} için kimlik doğrulama başarısız: Token bulunamadı`);
      return next(new Error('Kimlik doğrulama başarısız oldu: Token bulunamadı'));
    }
    
    try {
      const decoded = await verifyToken(token);
      console.log(`Socket ${socket.id} için token doğrulandı. Kullanıcı: ${decoded.username} (${decoded.id})`);
      
      // socketAuth nesnesine kullanıcı bilgilerini ekle
      socket.data.user = { 
        userId: decoded.id,
        username: decoded.username 
      };
      
      next();
    } catch (error) {
      console.error(`Socket ${socket.id} için token doğrulama hatası:`, error);
      next(new Error('Token geçersizdir'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, username } = socket.data.user;
    console.log(`Kullanıcı ${username} (${userId}) socket üzerinden bağlandı. Socket ID: ${socket.id}`);
    
    // Kullanıcı bağlandı - socket.id ile ilişkilendir
    socket.on('user:online', async (data) => {
      // Kullanıcı kimliğini doğrula
      if (data.userId === userId) {
        console.log(`Kullanıcı ${username} (${userId}) çevrimiçi durumuna geçti`);
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
          console.error(`Kullanıcı ${userId} için son görülme zamanı güncellenemedi:`, error);
        }
        
        // Tüm bağlı istemcilere çevrimiçi kullanıcıları gönder
        io.emit('users:online', Array.from(onlineUserMap.keys()));
        console.log(`Çevrimiçi kullanıcı listesi güncellendi. Toplam: ${onlineUserMap.size}`);
      } else {
        console.warn(`Kullanıcı ${userId} kimlik doğrulama uyuşmazlığı: ${data.userId} olarak bildirildi`);
      }
    });
    
    // Kullanıcı offline durumuna geçti
    socket.on('user:offline', async (data) => {
      if (data.userId === userId) {
        const lastSeen = new Date();
        console.log(`Kullanıcı ${username} (${userId}) çevrimdışı durumuna geçti`);
        
        // Map'den kullanıcıyı çıkar
        onlineUserMap.delete(userId);
        
        // Veritabanında son görülme zamanını güncelle
        try {
          await getClient()
            .from('users')
            .update({ last_seen: lastSeen.toISOString() })
            .eq('id', userId);
        } catch (error) {
          console.error(`Kullanıcı ${userId} için son görülme zamanı güncellenemedi:`, error);
        }
        
        // Tüm istemcilere kullanıcının çevrimdışı olduğunu bildir
        io.emit('user:offline', { userId, lastSeen: lastSeen.toISOString() });
        io.emit('users:online', Array.from(onlineUserMap.keys()));
        console.log(`Çevrimiçi kullanıcı listesi güncellendi. Toplam: ${onlineUserMap.size}`);
      } else {
        console.warn(`Kullanıcı ${userId} kimlik doğrulama uyuşmazlığı: ${data.userId} olarak bildirildi`);
      }
    });
    
    // Bağlantı kesildi
    socket.on('disconnect', async (reason) => {
      console.log(`Socket ${socket.id} için bağlantı kesildi. Sebep: ${reason}`);
      
      // Kullanıcının socket bilgisini kontrol et
      for (const [id, data] of onlineUserMap.entries()) {
        if (data.socketId === socket.id) {
          const lastSeen = new Date();
          console.log(`Kullanıcı ${id} için bağlantı kesildi, çevrimdışı durumuna geçirildi`);
          
          // Map'den kullanıcıyı çıkar
          onlineUserMap.delete(id);
          
          // Veritabanında son görülme zamanını güncelle
          try {
            await getClient()
              .from('users')
              .update({ last_seen: lastSeen.toISOString() })
              .eq('id', id);
          } catch (error) {
            console.error(`Kullanıcı ${id} için son görülme zamanı güncellenemedi:`, error);
          }
          
          // Tüm istemcilere kullanıcının çevrimdışı olduğunu bildir
          io.emit('user:offline', { userId: id, lastSeen: lastSeen.toISOString() });
          io.emit('users:online', Array.from(onlineUserMap.keys()));
          console.log(`Çevrimiçi kullanıcı listesi güncellendi. Toplam: ${onlineUserMap.size}`);
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
    console.error(`Kullanıcı ${userId} için son görülme zamanı alınamadı:`, error);
    return null;
  }
}; 