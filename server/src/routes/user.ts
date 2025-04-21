import express from 'express';
import multer from 'multer';
import path from 'path';
import { getProfile, uploadAvatar, deleteAvatar, getAllUsers, setUserAdminStatus, updateUser, deleteUser, getPublicProfile, changePassword } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Multer konfiqurasiyası: Faylı disk yerinə yaddaşda saxlamaq üçün
const storage = multer.memoryStorage(); // DiskStorage yerinə memoryStorage
const upload = multer({ 
  // dest: 'uploads/temp', // Yerli qovluq artıq lazım deyil
  storage: storage, // Yaddaşda saxlama
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB boyut sınırı (Supabase bucket limiti ilə eyni)
  },
  fileFilter: (req, file, cb) => {
    // Sadece resim dosyalarını kabul et
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Sadəcə şəkil faylları qəbul edilir (JPG, PNG, GIF, WEBP)'));
    }
  }
});

// Profil bilgilerini getir
router.get('/profile', authenticateToken, getProfile);

// Açık profil bilgilerini getir (authentication gerekmiyor)
// ÖNEMLİ: Sıralama önemli! Önce username rotasını tanımla, sonra userId rotasını
router.get('/profile/username/:username', getPublicProfile);
router.get('/profile/:userId', getPublicProfile);

// Avatar yükle
router.post('/avatar', authenticateToken, upload.single('avatar'), uploadAvatar);

// Avatar sil
router.delete('/avatar', authenticateToken, deleteAvatar);

// İstifadəçi öz şifrəsini dəyişdir
router.put('/change-password', authenticateToken, changePassword);

// --- Admin Route'ları Tekrar Aktif Edildi ---
// Bütün istifadəçiləri gətir (Admin Yetkisi Lazımdır)
router.get('/all', authenticateToken, adminAuth, getAllUsers);

// İstifadəçinin admin statusunu dəyişdir (Admin Yetkisi Lazımdır)
router.put('/:userId/admin', authenticateToken, adminAuth, setUserAdminStatus);

// İstifadəçi məlumatlarını yenilə (Admin Yetkisi Lazımdır)
router.put('/:userId', authenticateToken, adminAuth, updateUser);

// İstifadəçini sil (Admin Yetkisi Lazımdır)
router.delete('/:userId', authenticateToken, adminAuth, deleteUser);

export default router; 