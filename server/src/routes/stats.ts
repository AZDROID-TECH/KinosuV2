import express from 'express';
import { getAdminStats } from '../controllers/statsController';
import { authenticateToken } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Admin statistikalarını gətir
router.get('/admin', authenticateToken, adminAuth, getAdminStats);

export default router; 