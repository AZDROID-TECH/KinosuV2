import { Request, Response } from 'express';
// import fs from 'fs'; // Yerli fayl sistemi modulu artıq lazım deyil
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { TABLES, getClient } from '../utils/supabase';

// .env faylını yüklə
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const SUPABASE_PROJECT_URL = process.env.SUPABASE_URL;

interface UserRecord {
  id: number;
  username: string;
  email: string | null;
  // avatar: string | null; // Artıq Supabase URL olacaq
  avatar_url: string | null; // Yeni ad: avatar_url
  created_at: string;
}

interface WatchlistRecord {
  status: string;
  count: number;
}

// const UPLOADS_DIR = path.join(__dirname, '../../uploads/avatars'); // Yerli qovluq artıq lazım deyil

// Yerli qovluq yaratma kodu artıq lazım deyil
// if (!fs.existsSync(UPLOADS_DIR)) {
//   fs.mkdirSync(UPLOADS_DIR, { recursive: true });
// }

// cleanupUnusedAvatars funksiyası və setInterval artıq lazım deyil
// const cleanupUnusedAvatars = async () => { ... };
// setInterval(cleanupUnusedAvatars, 24 * 60 * 60 * 1000);

// Profil bilgilerini getir
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    
    // Kullanıcı bilgilerini Supabase'den çek (avatar -> avatar_url)
    const { data: user, error: userError } = await getClient()
      .from(TABLES.USERS)
      .select('id, username, email, avatar_url, created_at') // avatar -> avatar_url
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('İstifadəçi sorğu xətası:', userError);
      return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
    }
    
    // İzleme listesi istatistiklerini al
    // Watchlist (İzleme Listesi)
    const { count: watchlistCount, error: watchlistError } = await getClient()
      .from(TABLES.MOVIES)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'watchlist');
    
    if (watchlistError) {
      console.error('Watchlist sorğu xətası:', watchlistError);
      // Hata durumunda bile devam et, varsayılan 0 dönecek
    }
    
    // Watching (İzleniyor)
    const { count: watchingCount, error: watchingError } = await getClient()
      .from(TABLES.MOVIES)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'watching');
    
    if (watchingError) {
      console.error('Watching sorğu xətası:', watchingError);
    }
    
    // Watched (İzlendi)
    const { count: watchedCount, error: watchedError } = await getClient()
      .from(TABLES.MOVIES)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'watched');
    
    if (watchedError) {
      console.error('Watched sorğu xətası:', watchedError);
    }
    
    // created_at yoksa şu anki zamanı kullan
    const createdAt = user.created_at || new Date().toISOString();
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar_url, // avatar -> avatar_url
      createdAt: createdAt,
      watchlist: {
        watchlist: watchlistCount ?? 0,
        watching: watchingCount ?? 0,
        watched: watchedCount ?? 0
      }
    });
  } catch (error) {
    console.error('Profil məlumatları alınarkən xəta:', error);
    res.status(500).json({ error: 'Profil məlumatları alınarkən xəta baş verdi' });
  }
};

// Supabase Storage ilə Avatar yükleme
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const client = getClient();

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Şəkil yüklənmədi' });
    }
    
    // 1. İstifadəçinin mövcud avatarını al
    const { data: user, error: userError } = await client
      .from(TABLES.USERS)
      .select('avatar_url')
      .eq('id', req.user?.userId)
      .single();
    
    if (userError || !user) {
      console.error('İstifadəçi tapılmadı və ya sorğu xətası:', userError);
      return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
    }
    
    // 2. Mövcud avatarı Supabase Storage-dan sil (əgər varsa və etibarlı Supabase URL isə)
    if (user.avatar_url && SUPABASE_PROJECT_URL && user.avatar_url.startsWith(SUPABASE_PROJECT_URL)) {
      try {
        const urlObject = new URL(user.avatar_url);
        const storagePath = urlObject.pathname.split(`/storage/v1/object/public/avatars/`)[1];
        if (storagePath) {
           const { error: deleteError } = await client.storage
            .from('avatars')
            .remove([storagePath]);
          if (deleteError) {
            console.error('Köhnə avatarı Supabase Storage-dan silərkən xəta:', deleteError);
          }
        }
      } catch (urlParseOrDeleteError) {
          console.error("Köhnə avatar URL-ni parse edərkən və ya silərkən xəta:", urlParseOrDeleteError);
      }
    } else if (user.avatar_url) {
    }

    // 3. Yeni fayl adını yarat (uuid + fayl uzantısı)
    const fileExtension = path.extname(req.file.originalname);
    const filename = `${uuidv4()}${fileExtension}`;
    const filePath = `${req.user?.userId}/${filename}`;

    // 4. Faylı Supabase Storage-a yüklə
    const { error: uploadError } = await client.storage
      .from('avatars')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase Storage-a yükləmə xətası:', uploadError);
      return res.status(500).json({ error: 'Avatar yükləmə zamanı xəta baş verdi' });
    }

    // 5. Faylın public URL-ni al
    const { data: urlData } = client.storage
        .from('avatars')
        .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
         console.error('Supabase Storage-dan public URL alına bilmədi.');
        await client.storage.from('avatars').remove([filePath]); 
        return res.status(500).json({ error: 'Avatar yükləndi, amma URL alına bilmədi.' });
    }

    const avatarPublicUrl = urlData.publicUrl;

    // 6. Veritabanını yeni URL ilə yenilə
    const { error: updateError } = await client
      .from(TABLES.USERS)
      .update({ avatar_url: avatarPublicUrl })
      .eq('id', req.user?.userId);
    
    if (updateError) {
      console.error('Avatar URL-ni verilənlər bazasında yeniləmə xətası:', updateError);
      await client.storage.from('avatars').remove([filePath]);
      return res.status(500).json({ error: 'Avatar URL-ni yeniləmə zamanı xəta baş verdi' });
    }
    
    // 7. Uğurlu cavabı yeni URL ilə frontendə göndər
    res.json({ 
      success: true, 
      avatar: avatarPublicUrl
    });

  } catch (error) {
    console.error('Avatar yükləmə prosesində ümumi xəta:', error);
    res.status(500).json({ error: 'Avatar yükləmə zamanı gözlənilməz xəta baş verdi' });
  }
};

// Avatar silme funksiyası da Supabase Storage istifadə etməlidir
export const deleteAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const client = getClient();

     if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // 1. İstifadəçinin mövcud avatar URL-ni al
    const { data: user, error: userError } = await client
      .from(TABLES.USERS)
      .select('avatar_url') 
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      console.error('İstifadəçi tapılmadı və ya sorğu xətası:', userError);
      return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
    }
    
    // 2. Avatar URL-i varsa və etibarlı Supabase URL isə Storage-dan sil
    if (user.avatar_url && SUPABASE_PROJECT_URL && user.avatar_url.startsWith(SUPABASE_PROJECT_URL)) {
       try {
           const urlObject = new URL(user.avatar_url);
           const storagePath = urlObject.pathname.split(`/storage/v1/object/public/avatars/`)[1];
           if (storagePath) {
               const { error: deleteError } = await client.storage
                .from('avatars')
                .remove([storagePath]); 
               if (deleteError) {
                 console.error('Avatarı Supabase Storage-dan silərkən xəta:', deleteError);
               }
           }
        } catch (urlParseOrDeleteError) {
          console.error("Avatar URL-ni parse edərkən və ya silərkən xəta:", urlParseOrDeleteError);
        }
      // 3. Veritabanını yenilə (avatar_url = null) - Silmə xətası olsa belə DB yenilənsin
      const { error: updateError } = await client
        .from(TABLES.USERS)
        .update({ avatar_url: null })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Avatar URL-ni verilənlər bazasında silmə xətası:', updateError);
        return res.status(500).json({ error: 'Avatar URL-ni silmə zamanı xəta baş verdi' });
      }
      
       res.json({ success: true, avatar: null });

    } else {
        // DB-də URL yoxdursa və ya Supabase URL deyilsə, DB-ni null olaraq yeniləyək
        if (user.avatar_url !== null) {
             const { error: updateError } = await client
                .from(TABLES.USERS)
                .update({ avatar_url: null })
                .eq('id', userId);
            if (updateError) {
                console.error('Avatar URL-ni null olaraq yeniləmə xətası:', updateError);
                return res.status(500).json({ error: 'Avatar məlumatını təmizləmə zamanı xəta baş verdi' });
            }
        }
       res.json({ success: true, message: 'Silinəcək etibarlı avatar yoxdur.', avatar: null });
    }

  } catch (error) {
    console.error('Avatar silmə prosesində ümumi xəta:', error);
    res.status(500).json({ error: 'Avatar silmə zamanı gözlənilməz xəta baş verdi' });
  }
}; 