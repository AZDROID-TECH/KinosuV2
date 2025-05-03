// Kullanıcı arama rotasını ekle
router.get('/search', authenticateToken, userController.searchUsers); 