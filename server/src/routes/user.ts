import express from 'express';
import multer from 'multer';
import path from 'path';
import { getProfile, uploadAvatar, deleteAvatar } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

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

// Avatar yükle
router.post('/avatar', authenticateToken, upload.single('avatar'), uploadAvatar);

// Avatar sil
router.delete('/avatar', authenticateToken, deleteAvatar);

export default router; 