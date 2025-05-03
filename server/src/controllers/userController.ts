import { Request, Response } from 'express';
// import fs from 'fs'; // Yerli fayl sistemi modulu artıq lazım deyil
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { TABLES, getClient } from '../utils/supabase';
import bcrypt from 'bcryptjs'; // bcryptjs kitabxanasını import et

// .env faylını yüklə
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const SUPABASE_PROJECT_URL = process.env.SUPABASE_URL;

// Frontend tərəfindən istifadə edilən tip
interface UserForAdmin {
  id: number;
  username: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  is_admin: boolean;
  comment_count?: number; // Şərh sayı (opsiyonel)
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
      avatar_url: user.avatar_url, // AuthContext'in beklediği isim
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

// Avatarı sil
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

// İstifadəçi şifrəsini dəyişdir
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;
    const client = getClient();

    // Gərəkli məlumatlar mövcuddurmu?
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Cari şifrə və yeni şifrə tələb olunur' });
    }

    // 1. İstifadəçini tap və cari şifrə hashını al
    const { data: user, error: userError } = await client
      .from(TABLES.USERS)
      .select('password')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Şifrə dəyişdirilməsi üçün istifadəçi tapılmadı və ya sorğu xətası:', userError);
      return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
    }

    if (!user.password) {
        console.error('İstifadəçinin cari şifrə hashı mövcud deyil:', userId);
        return res.status(500).json({ error: 'Server xətası: Şifrə məlumatları mövcud deyil' });
    }

    // 2. Cari şifrəni müqayisə et
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Cari şifrə yanlışdır' });
    }

    // 3. Yeni şifrəni hashla
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // 4. Məlumat bazasında şifrəni yenilə
    const { error: updateError } = await client
      .from(TABLES.USERS)
      .update({ password: newPasswordHash })
      .eq('id', userId);

    if (updateError) {
      console.error('Şifrə yenilənməsi zamanı verilənlər bazası xətası:', updateError);
      return res.status(500).json({ error: 'Şifrə yenilənməsi zamanı xəta baş verdi' });
    }

    res.json({ message: 'Şifrə uğurla dəyişdirildi' });

  } catch (error) {
    console.error('Şifrə dəyişdirilməsi zamanı xəta:', error);
    res.status(500).json({ error: 'Şifrə dəyişdirilməsi zamanı server xətası baş verdi' });
  }
};

// Yeni interface (Controller üçün)
interface UserWithCommentCount extends UserForAdmin {
  comment_count?: number;
}

// --- Admin Fonksiyonları Tekrar Aktif Edildi ---
// Yorum satırları kaldırıldı
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const client = getClient();
    
    // Bütün istifadəçiləri və onların şərh saylarını gətir
    // Şərh sayını almaq üçün birbaşa select ilə RPC və ya view istifadə etmək daha performanslı ola bilər,
    // amma şimdilik subquery ilə edək.
    const { data: users, error } = await client
      .from(TABLES.USERS)
      .select(`
        id, 
        username, 
        email, 
        avatar_url, 
        created_at, 
        is_admin,
        comment_count:comments(count)
      `)
      .order('id', { ascending: true }); 
      
    if (error) {
      console.error('Bütün istifadəçiləri gətirərkən xəta:', error);
      return res.status(500).json({ error: 'İstifadəçi siyahısı alınarkən verilənlər bazası xətası baş verdi' });
    }
    
    // Frontend'in gözlədiyi formata çevirmək lazım ola bilər
    // Məsələn, `comment_count` massiv olaraq gəlirsə [{count: X}] onu saya çevirmək
    const formattedUsers = users?.map(user => ({
      ...user,
      comment_count: Array.isArray(user.comment_count) ? user.comment_count[0]?.count ?? 0 : 0
    })) || [];
    
    res.json(formattedUsers);

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
    
    // Kullanıcının film listesini getir (daha önce sadece en yüksek puan verilmiş filmler)
    const { data: topRatedMovies, error: topRatedError } = await client
      .from(TABLES.MOVIES)
      .select('title, poster, imdb_rating, user_rating, status, created_at')
      .eq('user_id', userProfileId)
      // Sadece puanlı filmleri değil, tüm film durumlarını getir
      // .gt('user_rating', 0) // Bu filtre kaldırıldı
      .order('user_rating', { ascending: false }) // Öncelikle puana göre sırala
      .limit(10); // Daha fazla film gösterilebilmesi için 10 film getir
    
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

// Kullanıcı arama
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const userId = req.user?.userId; // Mevcut oturum açmış kullanıcı

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Axtarış sorğusu tələb olunur' });
    }

    const searchQuery = q.trim();
    
    if (searchQuery.length < 2) {
      return res.status(400).json({ error: 'Axtarış sorğusu ən azı 2 simvol olmalıdır' });
    }

    const client = getClient();
    
    // İLIKE operatörü kullanarak büyük/küçük harf duyarsız arama
    const { data: users, error } = await client
      .from(TABLES.USERS)
      .select('id, username, avatar_url')
      .ilike('username', `%${searchQuery}%`)
      .order('username', { ascending: true })
      .limit(20);
    
    if (error) {
      console.error('İstifadəçi axtarışında xəta:', error);
      return res.status(500).json({ error: 'İstifadəçilər axtarılarkən xəta baş verdi' });
    }
    
    // Kendini sonuçlardan çıkar
    const filteredUsers = users.filter(user => user.id !== userId);
    
    return res.status(200).json(filteredUsers);
  } catch (error) {
    console.error('İstifadəçi axtarışında xəta:', error);
    return res.status(500).json({ error: 'İstifadəçilər axtarılarkən xəta baş verdi' });
  }
}; 