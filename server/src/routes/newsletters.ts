import express from 'express';
import * as newsletterController from '../controllers/newsletterController';
import { authenticateToken } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Public routes
router.get('/', newsletterController.getNewsletters);
router.get('/latest', authenticateToken, newsletterController.getLatestNewsletters);
router.get('/unread-count', authenticateToken, newsletterController.getUnreadCount);
router.get('/:id', newsletterController.getNewsletterById);
router.post('/:id/mark-viewed', authenticateToken, newsletterController.markNewsletterAsViewed);

// Admin routes
router.get('/admin/all', authenticateToken, adminAuth, newsletterController.getAdminNewsletters);
router.post('/admin/create', authenticateToken, adminAuth, newsletterController.createNewsletter);
router.put('/admin/:id', authenticateToken, adminAuth, newsletterController.updateNewsletter);
router.delete('/admin/:id', authenticateToken, adminAuth, newsletterController.deleteNewsletter);

export default router; 