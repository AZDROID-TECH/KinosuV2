import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../utils/jwt';
import { getClient } from '../utils/supabase';
import { logger } from '../utils/logger';

interface OnlineUserValue {
  socketId: string;
  lastSeen: Date;
  heartbeat: NodeJS.Timeout;
  username?: string;
}

class SocketService {
  private io: Server | null = null;
  private onlineUserMap = new Map<number, OnlineUserValue>();

  private async updateLastSeen(userId: number, time?: Date): Promise<void> {
    try {
      const updateTime = time || new Date();
      await getClient()
        .from('users')
        .update({ last_seen: updateTime.toISOString() })
        .eq('id', userId);

      const userInfo = this.onlineUserMap.get(userId);
      if (userInfo) {
        this.onlineUserMap.set(userId, {
          ...userInfo,
          lastSeen: updateTime,
        });
      }
    } catch (error) {
      logger.error(`[SocketService] UserId ${userId} son görülmə zamanı güncellenemedi: ${error}`);
    }
  }

  private async getLastSeenFromDB(userId: number): Promise<Date | null> {
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
      logger.error(`[SocketService] UserId ${userId} son görülmə zamanı bazadan alınamadı: ${error}`);
      return null;
    }
  }

  public initialize(server: HttpServer): Server {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.CLIENT_URL || true 
          : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.use(async (socket: Socket, next) => {
      try {
        let token = socket.handshake.headers.authorization?.split('Bearer ')[1];
        if (!token && socket.handshake.auth?.token) {
          token = socket.handshake.auth.token;
        }

        if (!token) {
          return next(new Error('Authentication Error: Token not provided'));
        }

        const decoded = await verifyToken(token);
        // Token içeriğini daha sıkı kontrol et, username de olmalı
        if (!decoded || typeof decoded.id !== 'number' || typeof decoded.username !== 'string') { 
          return next(new Error('Authentication Error: Invalid token content'));
        }

        socket.data.user = { 
          userId: decoded.id,
          username: decoded.username 
        };
        return next();
      } catch (error: any) {
        logger.error(`[SocketService Middleware] Socket kimlik doğrulama hatası: ${error.message}`);
        return next(new Error(`Authentication Error: ${error.message}`));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      // Middleware'den sonra socket.data.user ve socket.data.user.userId kesinlikle var olmalı.
      // Eğer yoksa, bu bir hata durumudur ve middleware doğru çalışmamış demektir.
      if (!socket.data.user || typeof socket.data.user.userId !== 'number' || typeof socket.data.user.username !== 'string') {
        logger.error(`[SocketService Connection] HATA: Doğrulanmış kullanıcı verisi (userId veya username) eksik! Socket ID: ${socket.id}. Middleware kontrol edilmeli.`);
        socket.disconnect(true);
        return;
      }

      const { userId, username } = socket.data.user;

      const existingUserInfo = this.onlineUserMap.get(userId);
      if (existingUserInfo && existingUserInfo.heartbeat) {
        clearInterval(existingUserInfo.heartbeat);
      }

      const heartbeatInterval = setInterval(async () => {
        const currentUserInfo = this.onlineUserMap.get(userId);
        if (currentUserInfo && currentUserInfo.socketId === socket.id) {
          await this.updateLastSeen(userId);
        } else {
          clearInterval(heartbeatInterval);
        }
      }, 4 * 60 * 1000); 

      this.onlineUserMap.set(userId, { 
        socketId: socket.id, 
        lastSeen: new Date(), 
        heartbeat: heartbeatInterval,
        username: username
      });
      this.updateLastSeen(userId); // Bağlantıda hemen last_seen güncelle

      if (this.io) {
        this.io.emit('users:online', Array.from(this.onlineUserMap.keys()));
      }

      socket.on('user:lastSeen', async (data: { userId: number }) => {
        try {
          const targetUserId = data.userId;
          let lastSeenDate: Date | null = null;
          const targetUserOnlineInfo = this.onlineUserMap.get(targetUserId);

          if (targetUserOnlineInfo) {
            lastSeenDate = targetUserOnlineInfo.lastSeen || new Date(); // onlineUserMap'teki lastSeen öncelikli
          } else {
            lastSeenDate = await this.getLastSeenFromDB(targetUserId);
          }
          socket.emit('user:lastSeenResponse', { 
            userId: targetUserId, 
            lastSeen: lastSeenDate ? lastSeenDate.toISOString() : null 
          });
        } catch (error) {
          logger.error(`[SocketService Event user:lastSeen] UserId ${data.userId} üçün son görülmə zamanı alınamadı: ${error}`);
        }
      });

      socket.on('user:offline', async (data: { userId: number }) => {
        if (data.userId === userId) {
          const userInfo = this.onlineUserMap.get(userId);
          if (userInfo && userInfo.heartbeat) {
            clearInterval(userInfo.heartbeat);
          }
          this.onlineUserMap.delete(userId);
          const lastSeenTime = new Date();
          await this.updateLastSeen(userId, lastSeenTime);
          if (this.io) {
            this.io.emit('user:offline', { userId, lastSeen: lastSeenTime.toISOString() });
            this.io.emit('users:online', Array.from(this.onlineUserMap.keys()));
          }
        }
      });

      socket.on('disconnect', async (reason: string) => {
        // Bu socket ID'si ile ilişkili kullanıcıyı bul ve online haritasından kaldır
        let disconnectedUserId: number | null = null;
        for (const [uid, uData] of this.onlineUserMap.entries()) {
          if (uData.socketId === socket.id) {
            disconnectedUserId = uid;
            if (uData.heartbeat) {
              clearInterval(uData.heartbeat);
            }
            this.onlineUserMap.delete(uid);
            break; 
          }
        }
        if (disconnectedUserId !== null) {
          const lastSeenTime = new Date();
          await this.updateLastSeen(disconnectedUserId, lastSeenTime);
          if (this.io) {
             this.io.emit('user:offline', { userId: disconnectedUserId, lastSeen: lastSeenTime.toISOString() });
             this.io.emit('users:online', Array.from(this.onlineUserMap.keys()));
          }
        }
      });
    });

    return this.io;
  }

  public getOnlineUsers(): number[] {
    return Array.from(this.onlineUserMap.keys());
  }

  public isUserOnline(userId: number): boolean {
    return this.onlineUserMap.has(userId);
  }

  public async getUserLastSeen(userId: number): Promise<Date | null> {
    const onlineUserInfo = this.onlineUserMap.get(userId);
    if (onlineUserInfo) {
      return onlineUserInfo.lastSeen || new Date();
    }
    return this.getLastSeenFromDB(userId);
  }
  
  public getIO(): Server | null {
    return this.io;
  }
}

export const socketService = new SocketService();
