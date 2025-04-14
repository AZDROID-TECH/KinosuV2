import { Request, Response, NextFunction } from 'express';
import { TABLES, getClient } from '../utils/supabase';

/**
 * @az Admin Yetki Doğrulama Middleware
 * @desc Bu middleware, gelen isteği yapan kullanıcının admin yetkisine sahip olup olmadığını kontrol eder.
 *       `authenticateToken` middleware\'inden sonra kullanılmalıdır.
 */
export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Giriş etmək lazımdır (Admin yoxlaması)' });
    }

    const client = getClient();
    const { data, error } = await client
      .from(TABLES.USERS)
      .select('is_admin') // Supabase\'de 'is_admin' (BOOLEAN) sütunu olmalı
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Admin yetkisi yoxlama xətası (DB sorğusu):', error);
      return res.status(500).json({ error: 'Admin statusu yoxlanarkən xəta baş verdi' });
    }

    if (!data || !data.is_admin) {
      return res.status(403).json({ error: 'Bu əməliyyat üçün admin yetkiniz yoxdur' });
    }

    next();
  } catch (error) {
    console.error('Admin yetkisi yoxlama zamanı gözlənilməz xəta:', error);
    res.status(500).json({ error: 'Admin yetkisi yoxlanarkən server xətası baş verdi' });
  }
}; 