import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriends,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  checkFriendshipStatus,
  getFriendRequestsCount
} from '../controllers/friendController';

const router = express.Router();

// Tüm arkadaşlık rotaları için kimlik doğrulama gereklidir
router.use(authenticateToken);

// Arkadaş listesini getir
router.get('/', getFriends);

// Arkadaşlık isteği gönder
router.post('/request/:receiverId', sendFriendRequest);

// Arkadaşlık isteğini kabul et
router.put('/accept/:requestId', acceptFriendRequest);

// Arkadaşlık isteğini reddet
router.put('/reject/:requestId', rejectFriendRequest);

// Arkadaşlıktan çıkar
router.delete('/:friendId', removeFriend);

// Gelen bekleyen arkadaşlık isteklerini getir
router.get('/requests/incoming', getIncomingFriendRequests);

// Gönderilen bekleyen arkadaşlık isteklerini getir
router.get('/requests/outgoing', getOutgoingFriendRequests);

// İki kullanıcı arasındaki arkadaşlık durumunu kontrol et
router.get('/status/:otherUserId', checkFriendshipStatus);

// Bildirim sayısını getir (bekleyen arkadaşlık istekleri)
router.get('/requests/count', getFriendRequestsCount);

export default router; 