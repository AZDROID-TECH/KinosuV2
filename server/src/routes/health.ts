import express from 'express';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Sunucu sağlık kontrolü için basit bir endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

export default router; 