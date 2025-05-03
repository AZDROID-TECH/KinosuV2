import { Request, Response } from 'express';
import { getClient } from '../utils/supabase';
import { isUserOnline, getUserLastSeen } from '../services/onlineStatusService';

/**
 * Kullanıcının online durumunu ve son görülme zamanını al
 */
export const getUserOnlineStatus = async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  if (!userId || isNaN(Number(userId))) {
    return res.status(400).json({ message: 'Etibarsız istifadəçi ID' });
  }
  
  const userIdNum = Number(userId);
  
  try {
    // Kullanıcının varlığını kontrol et
    const { data: userData, error: userError } = await getClient()
      .from('users')
      .select('id, username')
      .eq('id', userIdNum)
      .single();
    
    if (userError || !userData) {
      return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    }
    
    // Online durumunu kontrol et
    const online = isUserOnline(userIdNum);
    
    // Son görülme zamanını al
    const lastSeen = await getUserLastSeen(userIdNum);
    
    return res.status(200).json({
      userId: userIdNum,
      username: userData.username,
      online,
      lastSeen: lastSeen ? lastSeen.toISOString() : null
    });
  } catch (error) {
    console.error('Online durum sorğusu xətası:', error);
    return res.status(500).json({ message: 'Serverdə xəta baş verdi' });
  }
}; 