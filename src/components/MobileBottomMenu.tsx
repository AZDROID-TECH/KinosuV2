import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Badge, 
  useTheme, 
  alpha, 
  Dialog, 
  DialogContent, 
  Typography, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  IconButton,
  Fade,
  Zoom
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusAvatar from './Common/StatusAvatar';
import { useFriends } from '../context/FriendContext';
import { useOnlineStatus } from '../context/OnlineStatusContext';

/**
 * @az Mobil Alt Menü
 * @desc Mobil görünümdə sadə alt navigasiya paneli
 */
const MobileBottomMenu: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, avatar, userId, username, logout, isAdmin } = useAuth();
  const { requestsCount } = useFriends();
  const { isUserOnline } = useOnlineStatus();
  
  // Profil modali için state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  
  // Admin sayfalarında menüyü gösterme
  if (location.pathname.startsWith('/admin')) {
    return null;
  }
  
  // Giriş yapılmadıysa menüyü gösterme
  if (!isLoggedIn) {
    return null;
  }
  
  // Aktif navigasyon öğesini kontrol et
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Film ekleme işlemi
  const handleAddMovie = () => {
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
      setTimeout(() => {
        const addMovieButton = document.querySelector('.add-movie-button') as HTMLElement;
        if (addMovieButton) {
          addMovieButton.click();
        }
      }, 300);
    } else {
      const addMovieButton = document.querySelector('.add-movie-button') as HTMLElement;
      if (addMovieButton) {
        addMovieButton.click();
      }
    }
  };

  // Profil modalini aç
  const handleProfileClick = () => {
    setProfileModalOpen(true);
  };

  // Profil modalini kapat
  const handleCloseProfileModal = () => {
    setProfileModalOpen(false);
  };

  // Çıkış yapma işlemi
  const handleLogout = () => {
    setProfileModalOpen(false);
    logout();
  };

  // Menü öğesi stili
  const getButtonStyle = (path: string) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60px',
    height: '100%',
    position: 'relative' as const,
    cursor: path === 'messages' ? 'not-allowed' : 'pointer',
    opacity: path === 'messages' ? 0.6 : 1,
    transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    '&:hover': {
      transform: path !== 'messages' ? 'translateY(-2px)' : 'none',
    },
    '&:active': {
      transform: path !== 'messages' ? 'translateY(0)' : 'none',
    },
    color: isActive('/' + path) ? theme.palette.primary.main : theme.palette.text.secondary,
    fontWeight: isActive('/' + path) ? 700 : 500,
  });

  // İkon stili
  const getIconStyle = (path: string) => ({
    fontSize: path === 'profile' ? 28 : 24,
  });

  // Aktif durum göstergesi
  const getActiveIndicator = (path: string) => {
    if (isActive('/' + path)) {
      return {
        '&::after': {
          content: '""',
          position: 'absolute' as const,
          bottom: 0,
          width: '24px',
          height: '3px',
          background: theme.palette.primary.main,
          borderRadius: '3px 3px 0 0',
        }
      };
    }
    return {};
  };

  return (
    <>
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1000,
          display: { xs: 'block', sm: 'none' },
          borderRadius: '16px 16px 0 0',
          overflow: 'hidden',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        }} 
        elevation={3}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            height: '64px',
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(to top, ${alpha(theme.palette.background.paper, 0.95)} 70%, ${alpha(theme.palette.background.paper, 0.4)} 100%)` 
              : `linear-gradient(to top, #ffffff 70%, rgba(255,255,255,0.4) 100%)`,
          }}
        >
          {/* Ana səhifə */}
          <Box 
            onClick={() => navigate('/dashboard')}
            sx={{
              ...getButtonStyle('dashboard'),
              ...getActiveIndicator('dashboard'),
            }}
          >
            <Box component="i" className={isActive('/dashboard') ? "bx bxs-home" : "bx bx-home"} sx={getIconStyle('dashboard')} />
          </Box>
          
          {/* Dostlar */}
          <Box 
            onClick={() => navigate('/friends')}
            sx={{
              ...getButtonStyle('friends'),
              ...getActiveIndicator('friends'),
            }}
          >
            <Badge
              badgeContent={requestsCount > 0 ? requestsCount : 0}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.7rem',
                  height: 16,
                  minWidth: 16,
                  top: -2,
                  right: -2
                },
              }}
            >
              <Box component="i" className={isActive('/friends') ? "bx bxs-group" : "bx bx-group"} sx={getIconStyle('friends')} />
            </Badge>
          </Box>
          
          {/* Film əlavə et */}
          <Box 
            onClick={handleAddMovie}
            sx={{
              ...getButtonStyle('add'),
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Box
              component="i"
              className="bx bx-plus"
              sx={{
                fontSize: 28,
                padding: '10px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: theme.palette.common.white,
                boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.5)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.08)',
                  boxShadow: `0 6px 12px ${alpha(theme.palette.primary.main, 0.6)}`,
                },
                '&:active': {
                  transform: 'scale(0.96)',
                  boxShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.4)}`,
                }
              }}
            />
          </Box>
          
          {/* Mesajlar - devre dışı */}
          <Box 
            sx={{
              ...getButtonStyle('messages'),
            }}
          >
            <Box component="i" className="bx bx-message-detail" sx={getIconStyle('messages')} />
          </Box>
          
          {/* Profil */}
          <Box 
            onClick={handleProfileClick}
            sx={{
              ...getButtonStyle('profile'),
              ...getActiveIndicator('profile'),
            }}
          >
            <StatusAvatar
              src={avatar ? avatar : undefined}
              alt="Profil"
              size={28}
              isOnline={userId ? isUserOnline(userId) : false}
            />
          </Box>
        </Box>
      </Paper>

      {/* Profil Modalı */}
      <Dialog
        open={profileModalOpen}
        onClose={handleCloseProfileModal}
        fullWidth
        maxWidth="xs"
        TransitionComponent={Zoom}
        transitionDuration={300}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.95)
              : alpha(theme.palette.background.paper, 0.98),
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
            backgroundImage: 'none',
            maxHeight: '80vh',
            margin: 2
          }
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 2,
            py: 1.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Profil</Typography>
          <IconButton onClick={handleCloseProfileModal}>
            <Box component="i" className="bx bx-x" sx={{ fontSize: 24 }}/>
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {/* Kullanıcı profil özeti */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 3,
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(120, 40, 140, 0.3), rgba(60, 60, 140, 0.3))'
                : 'linear-gradient(135deg, rgba(92, 107, 192, 0.1), rgba(126, 87, 194, 0.1))',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <StatusAvatar
              src={avatar ? avatar : undefined}
              alt={username || "İstifadəçi"}
              size={80}
              isOnline={userId ? isUserOnline(userId) : false}
              sx={{ 
                mb: 1.5,
                border: `3px solid ${theme.palette.mode === 'dark' ? alpha('#9c27b0', 0.5) : alpha('#3f51b5', 0.3)}`,
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {username || "İstifadəçi"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Sizin ID: {typeof userId === 'string' && userId ? userId.substring(0, 8) : (userId ? String(userId).substring(0, 8) : 'N/A')}
            </Typography>
          </Box>

          {/* Menü seçenekleri */}
          <List sx={{ p: 0 }}>
            <ListItem 
              button 
              onClick={() => {
                handleCloseProfileModal();
                navigate('/profile');
              }}
              sx={{ 
                py: 1.5, 
                px: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: theme.palette.mode === 'dark' ? alpha('#9c27b0', 0.1) : alpha('#3f51b5', 0.05),
                  pl: 3,
                }
              }}
            >
              <ListItemIcon>
                <Box 
                  component="i" 
                  className="bx bx-user" 
                  sx={{ 
                    fontSize: 22, 
                    color: theme.palette.mode === 'dark' ? '#bb86fc' : '#5c6bc0' 
                  }}
                />
              </ListItemIcon>
              <ListItemText 
                primary="Profilim" 
                primaryTypographyProps={{ 
                  fontWeight: 500,
                }}
              />
            </ListItem>

            {/* Admin Panel Bağlantısı */}
            {isAdmin && (
              <ListItem 
                button 
                onClick={() => {
                  handleCloseProfileModal();
                  navigate('/admin');
                }}
                sx={{ 
                  py: 1.5, 
                  px: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: theme.palette.mode === 'dark' ? alpha('#9c27b0', 0.1) : alpha('#3f51b5', 0.05),
                    pl: 3,
                  }
                }}
              >
                <ListItemIcon>
                  <Box 
                    component="i" 
                    className="bx bx-shield-quarter" 
                    sx={{ 
                      fontSize: 22, 
                      color: theme.palette.mode === 'dark' ? '#bb86fc' : '#5c6bc0' 
                    }}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary="Admin Panel" 
                  primaryTypographyProps={{ 
                    fontWeight: 500,
                  }}
                />
              </ListItem>
            )}

            <Divider sx={{ my: 1 }} />

            <ListItem 
              button 
              onClick={handleLogout}
              sx={{ 
                py: 1.5, 
                px: 2,
                color: theme.palette.error.main,
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: alpha(theme.palette.error.main, 0.1),
                  pl: 3,
                }
              }}
            >
              <ListItemIcon>
                <Box 
                  component="i" 
                  className="bx bx-log-out" 
                  sx={{ 
                    fontSize: 22, 
                    color: theme.palette.error.main 
                  }}
                />
              </ListItemIcon>
              <ListItemText 
                primary="Çıxış" 
                primaryTypographyProps={{ 
                  fontWeight: 500,
                  color: theme.palette.error.main,
                }}
              />
            </ListItem>
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MobileBottomMenu;