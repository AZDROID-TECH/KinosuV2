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
      .select('id, username, email, avatar_url, created_at, is_admin') // is_admin eklendi
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
      isAdmin: user.is_admin, // isAdmin eklendi
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

// --- Admin Fonksiyonları Tekrar Aktif Edildi ---
// Yorum satırları kaldırıldı
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const { data: users, error } = await client
      .from(TABLES.USERS)
      .select('id, username, email, avatar_url, created_at, is_admin')
      .order('id', { ascending: true }); 
      
    if (error) {
      console.error('Bütün istifadəçiləri gətirərkən xəta:', error);
      return res.status(500).json({ error: 'İstifadəçi siyahısı alınarkən verilənlər bazası xətası baş verdi' });
    }
    
    res.json(users || []);
  } catch (error) {
    console.error('Bütün istifadəçiləri gətirmə zamanı ümumi xəta:', error);
    res.status(500).json({ error: 'İstifadəçi siyahısı alınarkən gözlənilməz server xətası baş verdi' });
  }
};

export const setUserAdminStatus = async (req: Request, res: Response) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    const { isAdmin } = req.body; 
    const requestingUserId = req.user?.userId;

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Keçərsiz istifadəçi ID\'si' });
    }
    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ error: 'isAdmin statusu (true/false) tələb olunur' });
    }
    if (targetUserId === requestingUserId) {
      return res.status(403).json({ error: 'Öz admin yetkinizi dəyişdirə bilməzsiniz' });
    }

    const client = getClient();

    const { data: targetUser, error: findError } = await client
      .from(TABLES.USERS)
      .select('id')
      .eq('id', targetUserId)
      .single();
      
    if (findError || !targetUser) {
        return res.status(404).json({ error: 'Dəyişdiriləcək istifadəçi tapılmadı' });
    }

    const { error: updateError } = await client
      .from(TABLES.USERS)
      .update({ is_admin: isAdmin })
      .eq('id', targetUserId);
      
    if (updateError) {
      console.error('Admin statusunu yeniləmə xətası:', updateError);
      return res.status(500).json({ error: 'İstifadəçinin admin statusu yenilənərkən xəta baş verdi' });
    }
    
    res.json({ message: `İstifadəçi (ID: ${targetUserId}) admin statusu ${isAdmin ? 'verildi' : 'alındı'}.` });

  } catch (error) {
    console.error('Admin statusunu dəyişdirmə zamanı ümumi xəta:', error);
    res.status(500).json({ error: 'Admin statusu dəyişdirilərkən gözlənilməz server xətası baş verdi' });
  }
}; 

// İstifadəçi məlumatlarını yeniləmə
export const updateUser = async (req: Request, res: Response) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    const { username, email } = req.body;
    const requestingUserId = req.user?.userId;

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Keçərsiz istifadəçi ID\'si' });
    }

    if (!username && !email) {
      return res.status(400).json({ error: 'Ən azı bir məlumat dəyişikliyi tələb olunur' });
    }

    // İstifadəçi öz hesabı üzərində yetkiləndirmə kontrolü
    if (targetUserId === requestingUserId) {
      return res.status(403).json({ error: 'Admin panelindən öz hesabınızı redaktə edə bilməzsiniz. Profil səhifəsini istifadə edin.' });
    }

    const client = getClient();

    // İstifadəçinin mövcudluğunu yoxla
    const { data: targetUser, error: findError } = await client
      .from(TABLES.USERS)
      .select('id, username')
      .eq('id', targetUserId)
      .single();
      
    if (findError || !targetUser) {
      return res.status(404).json({ error: 'Dəyişdiriləcək istifadəçi tapılmadı' });
    }

    // Yeniləmə məlumatlarını hazırla
    const updateData: { username?: string; email?: string } = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    // Veritabanını yenilə
    const { data, error: updateError } = await client
      .from(TABLES.USERS)
      .update(updateData)
      .eq('id', targetUserId)
      .select()
      .single();
      
    if (updateError) {
      console.error('İstifadəçi məlumatlarını yeniləmə xətası:', updateError);
      return res.status(500).json({ error: 'İstifadəçi məlumatları yenilənərkən xəta baş verdi' });
    }
    
    res.json({ 
      message: `İstifadəçi (ID: ${targetUserId}) məlumatları uğurla yeniləndi.`,
      user: data
    });

  } catch (error) {
    console.error('İstifadəçi məlumatlarını yeniləmə zamanı ümumi xəta:', error);
    res.status(500).json({ error: 'İstifadəçi məlumatları yenilənərkən gözlənilməz server xətası baş verdi' });
  }
};

// İstifadəçini silmə
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    const requestingUserId = req.user?.userId;

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Keçərsiz istifadəçi ID\'si' });
    }

    // İstifadəçi özünü silməsini əngəllə
    if (targetUserId === requestingUserId) {
      return res.status(403).json({ error: 'Öz hesabınızı silə bilməzsiniz' });
    }

    const client = getClient();

    // İstifadəçinin mövcudluğunu yoxla
    const { data: targetUser, error: findError } = await client
      .from(TABLES.USERS)
      .select('id, username, avatar_url')
      .eq('id', targetUserId)
      .single();
      
    if (findError || !targetUser) {
      return res.status(404).json({ error: 'Silinəcək istifadəçi tapılmadı' });
    }

    // Supabase Storage-dan istifadəçinin avatar şəkilini sil (əgər varsa)
    if (targetUser.avatar_url && SUPABASE_PROJECT_URL && targetUser.avatar_url.startsWith(SUPABASE_PROJECT_URL)) {
      try {
        const urlObject = new URL(targetUser.avatar_url);
        const storagePath = urlObject.pathname.split(`/storage/v1/object/public/avatars/`)[1];
        if (storagePath) {
          const { error: deleteAvatarError } = await client.storage
            .from('avatars')
            .remove([storagePath]);
          if (deleteAvatarError) {
            console.error('Silinən istifadəçinin avatarını silmə xətası:', deleteAvatarError);
            // Avatar silmə xətası istifadəçi silməyi dayandırmasın 
          }
        }
      } catch (urlParseOrDeleteError) {
        console.error("Avatar URL-ni parse edərkən və ya silərkən xəta:", urlParseOrDeleteError);
        // Davam et - bu istifadəçi silməyi bloklamamalıdır
      }
    }

    // İstifadəçinin bütün filmləri (varsa) MOVIES cədvəlindən silinməli
    const { error: deleteMoviesError } = await client
      .from(TABLES.MOVIES)
      .delete()
      .eq('user_id', targetUserId);
    
    if (deleteMoviesError) {
      console.error('İstifadəçinin filmlərini silmə xətası:', deleteMoviesError);
      // Film silmə xətası istifadəçi silməyi dayandırmasın
    }

    // İstifadəçini sil
    const { error: deleteUserError } = await client
      .from(TABLES.USERS)
      .delete()
      .eq('id', targetUserId);
      
    if (deleteUserError) {
      console.error('İstifadəçi silmə xətası:', deleteUserError);
      return res.status(500).json({ error: 'İstifadəçi silinərkən xəta baş verdi' });
    }
    
    res.json({ message: `İstifadəçi "${targetUser.username}" (ID: ${targetUserId}) uğurla silindi.` });

  } catch (error) {
    console.error('İstifadəçi silmə zamanı ümumi xəta:', error);
    res.status(500).json({ error: 'İstifadəçi silinərkən gözlənilməz server xətası baş verdi' });
  }
};

// Açık profil bilgilerini ID veya kullanıcı adına göre getirme
export const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const { userId, username } = req.params;

    if (!userId && !username) {
      return res.status(400).json({ error: 'İstifadəçi ID\'si və ya istifadəçi adı tələb olunur' });
    }

    const client = getClient();
    let query = client
      .from(TABLES.USERS)
      .select('id, username, avatar_url, created_at');  // is_online sütununu kaldırdık

    // ID veya kullanıcı adına göre arama
    if (username) {
      // Kullanıcı adına göre arama (öncelikli)
      query = query.eq('username', username);
    } else if (userId && !isNaN(parseInt(userId, 10))) {
      // ID'ye göre arama
      query = query.eq('id', parseInt(userId, 10));
    }

    const { data: user, error: userError } = await query.single();
    
    if (userError) {
      console.error('Açıq profil sorğu xətası:', userError);
      return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
    }
    
    // İzleme listesi istatistiklerini al
    const userProfileId = user.id;
    
    // Watchlist (İzleme Listesi)
    const { count: watchlistCount, error: watchlistError } = await client
      .from(TABLES.MOVIES)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userProfileId)
      .eq('status', 'watchlist');
    
    if (watchlistError) {
      console.error('Watchlist sorğu xətası:', watchlistError);
    }
    
    // Watching (İzleniyor)
    const { count: watchingCount, error: watchingError } = await client
      .from(TABLES.MOVIES)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userProfileId)
      .eq('status', 'watching');
    
    if (watchingError) {
      console.error('Watching sorğu xətası:', watchingError);
    }
    
    // Watched (İzlendi)
    const { count: watchedCount, error: watchedError } = await client
      .from(TABLES.MOVIES)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userProfileId)
      .eq('status', 'watched');
    
    if (watchedError) {
      console.error('Watched sorğu xətası:', watchedError);
    }
    
    // Son eklenen film
    const { data: latestMovie, error: latestMovieError } = await client
      .from(TABLES.MOVIES)
      .select('title, poster, imdb_rating, status, created_at')
      .eq('user_id', userProfileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (latestMovieError) {
      console.error('Son film sorğu xətası:', latestMovieError);
    }
    
    // Kullanıcının en yüksek puan verdiği 5 filmi getir
    const { data: topRatedMovies, error: topRatedError } = await client
      .from(TABLES.MOVIES)
      .select('title, poster, imdb_rating, user_rating, status, created_at')
      .eq('user_id', userProfileId)
      .gt('user_rating', 0) // Sadece puan verilmiş filmler
      .order('user_rating', { ascending: false }) // En yüksek puandan en düşüğe
      .limit(5);
    
    if (topRatedError) {
      console.error('En yüksək reytingli filmlər sorğu xətası:', topRatedError);
    }
    
    const createdAt = user.created_at || new Date().toISOString();
    
    res.json({
      id: user.id,
      username: user.username,
      avatar: user.avatar_url,
      createdAt: createdAt,
      isOnline: false, // Veritabanında olmadığı için sabit değer verdik
      stats: {
        watchlist: watchlistCount ?? 0,
        watching: watchingCount ?? 0,
        watched: watchedCount ?? 0,
        total: (watchlistCount ?? 0) + (watchingCount ?? 0) + (watchedCount ?? 0)
      },
      latestMovie: latestMovie || null,
      topRatedMovies: topRatedMovies || []
    });
  } catch (error) {
    console.error('Açıq profil məlumatları alınarkən xəta:', error);
    res.status(500).json({ error: 'Profil məlumatları alınarkən xəta baş verdi' });
  }
}; 