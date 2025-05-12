import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';

class SocketService {
  private io: Server | null = null;
  // Ana online kullanıcı listesi - userId'ye göre socket id'lerini tutar - KALDIRILDI
  // private onlineUsers: Map<number, string> = new Map();

  initialize(server: HttpServer): void {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.CLIENT_URL || true 
          : 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
    });

    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error: Token not provided'));
        }

        const decoded = await verifyToken(token);
        if (!decoded || typeof decoded.id !== 'number') {
          return next(new Error('Authentication error: Invalid token'));
        }

        socket.data.userId = decoded.id;
        logger.warn(`Socket authentication successful for user ${decoded.id}`);
        
        return next();
      } catch (error: any) {
        logger.error(`Socket authentication error: ${error.message}`);
        return next(new Error(`Authentication error: ${error.message}`));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      if (!userId) {
          socket.disconnect(true);
          return;
      }

      logger.warn(`User ${userId} connected with socket id ${socket.id}`);
      
      // Kullanıcıyı online listesine ekle veya mevcut bağlantıyı güncelle - KALDIRILDI
      // this.onlineUsers.set(userId, socket.id);
      // logger.info(`Current online users: ${this.onlineUsers.size}`);

      // Kullanıcının online olduğunu broadcast et - KALDIRILDI
      // this.io?.emit('user_online', { userId });

      socket.on('disconnect', async (reason: string) => {
        logger.warn(`User ${userId} disconnected with socket id ${socket.id}. Reason: ${reason}`);
        
        // Kullanıcının mevcut socket id'si, bağlantısı kesilen socket id'si ile aynıysa online listesinden çıkar - KALDIRILDI
        // if (this.onlineUsers.get(userId) === socket.id) {
        //      this.onlineUsers.delete(userId);
        //      logger.info(`User ${userId} removed from online list. Current online users: ${this.onlineUsers.size}`);

            // Sadece kullanıcı gerçekten offline olduğunda son görülme zamanını kaydet - KALDIRILDI
            // await this.updateLastOnline(userId);
            // logger.info(`Last online time updated for user ${userId}`);

            // Kullanıcının offline olduğunu broadcast et - KALDIRILDI
            // const lastOnline = await this.getLastOnline(userId);
            // this.io?.emit('user_offline', { userId, lastOnline });
        // }
      });
    });
  }

  // Kullanıcı offline olduğunda son görülme zamanını güncelle - KALDIRILDI
  // private async updateLastOnline(userId: number): Promise<void> {
  //   try {
  //     const supabase = getServiceClient();
  //     const { error } = await supabase
  //       .from(TABLES.USERS)
  //       .update({ last_online: new Date().toISOString() })
  //       .eq('id', userId);

  //     if (error) {
  //       logger.error(`Supabase error updating last_online for user ${userId}: ${error.message}`);
  //     }
  //   } catch (error: any) {
  //     logger.error(`Error in updateLastOnline for user ${userId}: ${error.message}`);
  //   }
  // }

  // Kullanıcının online olup olmadığını kontrol et - KALDIRILDI
  // isUserOnline(userId: number): boolean {
  //   return this.onlineUsers.has(userId);
  // }

  // Kullanıcının son görülme zamanını Supabase'den getir - KALDIRILDI
  // async getLastOnline(userId: number): Promise<string | null> {
  //   try {
  //     const supabase = getServiceClient();
  //     const { data, error } = await supabase
  //       .from(TABLES.USERS)
  //       .select('last_online')
  //       .eq('id', userId)
  //       .single();

  //     if (error) {
  //       logger.error(`Supabase error fetching last_online for user ${userId}: ${error.message}`);
  //       return null;
  //     }

  //     return data?.last_online || null;
  //   } catch (error: any) {
  //     logger.error(`Error in getLastOnline for user ${userId}: ${error.message}`);
  //     return null;
  //   }
  // }

  // Online kullanıcıların listesini döndür (isteğe bağlı) - KALDIRILDI
  // getOnlineUsers(): number[] {
  //     return Array.from(this.onlineUsers.keys());
  // }
}

export const socketService = new SocketService(); 