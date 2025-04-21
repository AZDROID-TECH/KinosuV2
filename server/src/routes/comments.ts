import express from 'express';
import { 
  getComments, 
  addComment, 
  voteComment, 
  getPendingComments, 
  approveComment, 
  rejectComment, 
  deleteComment,
  getCommentsByUserIdAdmin
} from '../controllers/commentController';
import { authenticateToken } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Ümumi şərh endpointləri
router.get('/', authenticateToken, getComments); // Film ID ilə şərhləri gətirmək
router.post('/', authenticateToken, addComment); // Yeni şərh əlavə etmək
router.post('/:commentId/vote', authenticateToken, voteComment); // Şərhə səs vermək

// Admin şərh endpointləri
router.get('/admin', authenticateToken, adminAuth, getPendingComments); // Gözləyən şərhləri gətirmək
router.patch('/admin/:commentId/approve', authenticateToken, adminAuth, approveComment); // Şərhi təsdiqləmək
router.patch('/admin/:commentId/reject', authenticateToken, adminAuth, rejectComment); // Şərhi rədd etmək
router.delete('/admin/:commentId', authenticateToken, adminAuth, deleteComment); // Şərhi silmək
router.get('/admin/user/:userId', authenticateToken, adminAuth, getCommentsByUserIdAdmin); // İstifadəçinin şərhlərini gətirmək üçün yeni route

export default router; 