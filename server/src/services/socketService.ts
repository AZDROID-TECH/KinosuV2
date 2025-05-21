import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';

class SocketService {
  private io: Server | null = null;

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

      socket.on('disconnect', async (reason: string) => {
        logger.warn(`User ${userId} disconnected with socket id ${socket.id}. Reason: ${reason}`);
      });
    });
  }
}

export const socketService = new SocketService(); 