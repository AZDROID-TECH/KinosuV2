// Autentifikasiya middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Kök dizinde otomatik olarak .env yüklenir
dotenv.config();

// Fallback için sabit anahtar ama Render.com'da çevre değişkeni kullanılacak
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

// JWT_SECRET kontrolü ve uyarı
if (!process.env.JWT_SECRET) {
  console.warn('UYARI: JWT_SECRET çevre değişkeni ayarlanmamış! Varsayılan güvenli olmayan anahtar kullanılıyor.');
}

interface JwtPayload {
  id: number;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Giriş etmək lazımdır' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Tutarlı yapı için id'yi userId olarak ata
    req.user = {
      userId: decoded.id,
      username: decoded.username
    };
    
    next();
  } catch (error) {
    // Hata tipine göre farklı mesajlar göster
    let errorMessage = 'Token etibarsızdır';
    
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      errorMessage = 'Token vaxtı bitib, zəhmət olmasa yenidən daxil olun';
    }
    
    return res.status(403).json({ error: errorMessage });
  }
}; 