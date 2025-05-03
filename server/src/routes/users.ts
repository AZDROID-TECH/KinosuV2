import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as userController from '../controllers/userController';

const router = express.Router();

// Kullanıcı arama rotasını ekle
router.get('/search', authenticateToken, userController.searchUsers); 

export default router; 