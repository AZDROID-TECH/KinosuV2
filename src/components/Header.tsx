import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  alpha,
  Avatar,
  Skeleton,
  ButtonGroup,
  IconButton,
  Badge,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../context/FriendContext';
import { useState, useEffect } from 'react';
import 'boxicons/css/boxicons.min.css';
import StatusAvatar from './Common/StatusAvatar';
import { useSocketContext } from '../context/SocketContext';
import { getLatestNewsletters, getUnreadCount, markNewsletterAsViewed, Newsletter } from '../services/newsletterService';
import { format } from 'date-fns';
import { apiClient } from '../services/apiClient';
import { useHeaderMenu } from '../context/HeaderMenuContext';

// Ortak stiller
const commonStyles = {
  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  transition: 'all 0.3s ease',
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useCustomTheme();
  const { isLoggedIn, username, avatar, logout, isLoadingAuth, isAdmin, userId } = useAuth();
  const { isUserOnline } = useSocketContext();
  const { profileAnchorEl, openProfileMenu, closeProfileMenu, isProfileMenuOpen, menuOrigin } = useHeaderMenu();
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [newsletterAnchorEl, setNewsletterAnchorEl] = useState<null | HTMLElement>(null);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNewsletters, setLoadingNewsletters] = useState<boolean>(false);
  const theme = useTheme();
  
  // Admin sayfalarında Header'ı tamamen gizle
  if (location.pathname.startsWith('/admin')) {
    return null;
  }
  
  const { 
    incomingRequests, 
    requestsCount, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    refreshIncomingRequests,
    refreshRequestsCount
  } = useFriends();

  const handleLogout = () => {
    closeProfileMenu();
    logout();
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
    refreshIncomingRequests();
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  // Newsletter popup menu functions
  const handleNewsletterMenuOpen = async (event: React.MouseEvent<HTMLElement>) => {
    setNewsletterAnchorEl(event.currentTarget);
    
    // Popup açıldığında önce ekranı temizle ve bir loading spinner göster
    setNewsletters([]);
    setLoadingNewsletters(true);
    
    // Her açılışta taze veri almaya zorla
    await fetchNewsletters();
  };

  const handleNewsletterMenuClose = () => {
    setNewsletterAnchorEl(null);
  };

  const fetchNewsletters = async () => {
    setLoadingNewsletters(true);
    try {
      // Orijinal newsletter servisine geri dönüş yapıyoruz
      const response = await getLatestNewsletters(5);
      if (response.success) {
        setNewsletters(response.data);
      } else {
        console.error("Newsletter service error:", response);
        setNewsletters([]);
      }
    } catch (error) {
      console.error('Newsletters fetch error:', error);
      setNewsletters([]);
    } finally {
      setLoadingNewsletters(false);
    }
  };

  const fetchUnreadCount = async (forceRefresh = false) => {
    if (!isLoggedIn) return;
    
    try {
      const response = await getUnreadCount();
      if (response.success) {
        setUnreadCount(response.count);
      }
    } catch (error) {
      console.error('Unread count fetch error:', error);
    }
  };

  const handleNewsletterClick = async (id: number) => {
    try {
      // Backend'e görüntülenme bildirimi yap
      await markNewsletterAsViewed(id);
      
      // Kullanıcıya görsel feedback ver - listeden kaldır
      setNewsletters(prev => prev.filter(item => item.id !== id));
      
      // Badge sayısını azalt (hata olmadığı sürece)
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Popup'ı kapat
      handleNewsletterMenuClose();
      
      // Detay sayfasına git
      navigate(`/newsletters/${id}`);
    } catch (error) {
      console.error('Mark as viewed error:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchUnreadCount();
      
      // Refresh unread count periodically (every 5 minutes)
      const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      refreshRequestsCount();
    }
  }, [isLoggedIn, refreshRequestsCount]);

  const handleAcceptRequest = async (requestId: number) => {
    await acceptFriendRequest(requestId);
    refreshRequestsCount();
  };

  const handleRejectRequest = async (requestId: number) => {
    await rejectFriendRequest(requestId);
    refreshRequestsCount();
  };

  // Giriş ve kayıt sayfalarında veya Landing Page'de butonları gizlemek/göstermek için kontrol
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';
  const isResetPage = location.pathname.includes('/reset-password');
  const isLandingPage = location.pathname === '/';
  
  // Sadece Login/Register/Reset sayfalarında Header'ı daha sade yap
  const isSimpleHeader = isLoginPage || isRegisterPage || isResetPage;

  // Kullanıcı menüsünü açan avatar bileşeni
  const userAvatar = (
    <IconButton
      size="small"
      aria-controls="menu-appbar"
      aria-haspopup="true"
      onClick={openProfileMenu}
      color="inherit"
      sx={{
        transition: 'all 0.3s ease',
        ml: { xs: 0, sm: 1 },
        p: 0.75,
        display: { xs: 'none', sm: 'flex' }, // Mobil görünümde gizle, tablet ve üzerinde göster
        '&:hover': {
          backgroundColor: (theme) => isSimpleHeader 
            ? alpha(theme.palette.primary.main, 0.08)
            : 'rgba(255, 255, 255, 0.1)'
        },
      }}
    >
      <StatusAvatar 
        src={avatar ? avatar : undefined} 
        alt={username || "User"} 
        size={35}
        isOnline={userId ? isUserOnline(userId) : false}
      />
    </IconButton>
  );

  return (
    <AppBar 
      position="sticky"
      elevation={0}
      sx={{
        background: isSimpleHeader
          ? (darkMode ? alpha(theme.palette.background.default, 0.8) : alpha(theme.palette.grey[100], 0.8))
          : (darkMode 
            ? alpha(theme.palette.background.paper, 0.85)
            : 'linear-gradient(45deg, #5c6bc0 0%, #7e57c2 100%)'),
        boxShadow: isSimpleHeader 
          ? 'none' 
          : '0 2px 10px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)',
        borderBottom: isSimpleHeader 
          ? `1px solid ${darkMode ? theme.palette.divider : theme.palette.grey[300]}`
          : `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'}`,
        borderRadius: 0,
      }}
    >
      <Toolbar>
        <Typography
          variant="h5"
          component="div"
          sx={{
            cursor: 'pointer',
            fontFamily: 'Righteous, cursive',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: (theme) => isSimpleHeader 
              ? theme.palette.text.primary 
              : '#fff',
            position: 'relative',
            ...commonStyles,
            textShadow: isSimpleHeader ? 'none' : '0 1px 3px rgba(0,0,0,0.4)',
            transition: 'opacity 0.3s ease',
            '&:hover': {
                opacity: 0.85
            }
          }}
          onClick={() => navigate('/')}
        >
          <img 
            src="/icon.svg" 
            alt="Kinosu Logo"
            style={{ 
              width: 32,
              height: 32,
              transition: 'all 0.3s ease',
            }} 
          />
          Kinosu
        </Typography>

        <Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          <ButtonGroup 
            variant="text" 
            aria-label="text button group"
            sx={{ 
              bgcolor: isSimpleHeader ? 'transparent' : alpha(theme.palette.common.white, 0.1),
              borderRadius: 2,
              boxShadow: isSimpleHeader ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <IconButton
              onClick={toggleDarkMode}
              className="theme-toggle"
              sx={{
                color: isSimpleHeader ? theme.palette.text.primary : '#fff',
                padding: '8px',
                transition: 'transform 0.3s ease, color 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  color: darkMode ? theme.palette.secondary.light : theme.palette.primary.light,
                  bgcolor: 'transparent',
                }
              }}
            >
              <i className={`bx ${darkMode ? 'bxs-sun' : 'bxs-moon'}`} style={{ fontSize: '22px' }}></i>
            </IconButton>
            {/* Mesajlaşma ikonu - masaüstü */}
            {isLoggedIn && !isLoadingAuth && (
              <IconButton
                disabled
                sx={{
                  color: isSimpleHeader ? theme.palette.text.primary : '#fff',
                  padding: '8px',
                  opacity: 0.6,
                  cursor: 'not-allowed',
                  transition: 'transform 0.3s ease, color 0.3s ease',
                  '&:hover': {
                    transform: 'none',
                    color: darkMode ? theme.palette.secondary.light : theme.palette.primary.light,
                    bgcolor: 'transparent',
                  }
                }}
                title="Mesajlar (tezliklə)"
              >
                <i className="bx bx-message-detail" style={{ fontSize: '22px' }}></i>
              </IconButton>
            )}
            
            {/* Newsletter ikonu */}
            {isLoggedIn && !isLoadingAuth && (
              <IconButton
                onClick={handleNewsletterMenuOpen}
                sx={{
                  color: isSimpleHeader ? theme.palette.text.primary : '#fff',
                  padding: '8px',
                  transition: 'transform 0.3s ease, color 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    color: darkMode ? theme.palette.secondary.light : theme.palette.primary.light,
                    bgcolor: 'transparent',
                  }
                }}
              >
                <Badge 
                  badgeContent={unreadCount} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      fontWeight: 'bold'
                  }
                }}
              >
                <i className='bx bxs-news' style={{ fontSize: '22px' }}></i>
                </Badge>
              </IconButton>
            )}
            
            {isLoggedIn && !isLoadingAuth && (
              <IconButton
                onClick={handleNotificationMenuOpen}
                sx={{
                  color: isSimpleHeader ? theme.palette.text.primary : '#fff',
                  padding: '8px',
                  transition: 'transform 0.3s ease, color 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    color: darkMode ? theme.palette.secondary.light : theme.palette.primary.light,
                    bgcolor: 'transparent',
                  }
                }}
              >
                <Badge 
                  badgeContent={requestsCount} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      fontWeight: 'bold'
                    }
                  }}
                >
                  <i className='bx bxs-bell' style={{ fontSize: '22px' }}></i>
                </Badge>
              </IconButton>
            )}
          </ButtonGroup>

          {isLoadingAuth ? (
            <Skeleton variant="circular" width={35} height={35} sx={{ ml: { xs: 0, sm: 0.5 } }} />
          ) : isLoggedIn ? (
            <>
              {userAvatar}
              <Menu
                anchorEl={profileAnchorEl}
                open={isProfileMenuOpen}
                onClose={closeProfileMenu}
                PaperProps={{
                  elevation: 5,
                  sx: {
                    minWidth: '220px',
                    mt: menuOrigin === 'bottom' ? 0 : 1.5,
                    mb: menuOrigin === 'bottom' ? 2 : 0,
                    transform: menuOrigin === 'bottom' ? 'translateY(-10px) !important' : 'none',
                    borderRadius: '16px',
                    backdropFilter: 'blur(12px)',
                    backgroundColor: darkMode 
                      ? alpha(theme.palette.background.paper, 0.92)
                      : alpha('#ffffff', 0.98),
                    border: darkMode 
                      ? '1px solid rgba(255, 255, 255, 0.12)' 
                      : '1px solid rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    zIndex: 1400,
                    boxShadow: darkMode
                      ? '0 10px 40px rgba(0, 0, 0, 0.35)'
                      : '0 10px 40px rgba(0, 0, 0, 0.15)',
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: darkMode 
                        ? 'linear-gradient(90deg, #9c27b0, #3f51b5)'
                        : 'linear-gradient(90deg, #5c6bc0, #7e57c2)',
                    }
                  },
                }}
                transformOrigin={{ 
                  horizontal: 'right', 
                  vertical: menuOrigin === 'bottom' ? 'bottom' : 'top' 
                }}
                anchorOrigin={{ 
                  horizontal: 'right', 
                  vertical: menuOrigin === 'bottom' ? 'top' : 'bottom'
                }}
                style={{ zIndex: 1400 }}
              >
                {/* Kullanıcı Profil Özeti */}
                <Box sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  background: darkMode 
                    ? 'linear-gradient(45deg, rgba(156, 39, 176, 0.1), rgba(63, 81, 181, 0.1))'
                    : 'linear-gradient(45deg, rgba(92, 107, 192, 0.05), rgba(126, 87, 194, 0.05))',
                  borderBottom: '1px solid',
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                  mb: 0.5
                }}>
                  <StatusAvatar
                    src={avatar ? avatar : undefined}
                    alt={username || 'İstifadəçi'}
                    isOnline={userId ? isUserOnline(userId) : false}
                    size={42}
                    sx={{
                      boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
                      transition: 'all 0.3s ease',
                      border: `2px solid ${alpha(theme.palette.common.white, 0.9)}`,
                    }}
                  />
                  <Box>
                    <Typography variant="subtitle1" 
                      sx={{ 
                        fontWeight: 700,
                        lineHeight: 1.2,
                        fontSize: '0.95rem',
                        color: darkMode ? theme.palette.primary.light : theme.palette.primary.main,
                      }}
                    >
                      {username}
                    </Typography>
                    <Typography variant="caption" 
                      sx={{ 
                        display: 'block',
                        color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                        fontFamily: "'Montserrat', sans-serif",
                      }}
                    >
                      {isUserOnline(userId || 0) ? 'İndi onlayn' : 'Offlayn'}
                    </Typography>
                  </Box>
                </Box>

                <MenuItem 
                  onClick={() => {
                    closeProfileMenu();
                    navigate('/profile');
                  }} 
                  sx={{ 
                    py: 1.5,
                    px: 2,
                    transition: 'all 0.2s ease',
                    color: darkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.75)',
                    '&:hover': {
                      backgroundColor: darkMode 
                        ? alpha('#9c27b0', 0.12)
                        : alpha('#3f51b5', 0.06),
                      color: darkMode ? '#bb86fc' : '#3f51b5',
                      transform: 'translateX(4px)',
                    }
                  }}
                >
                  <i className='bx bx-user' style={{ 
                    marginRight: '12px', 
                    fontSize: '20px', 
                    color: darkMode ? '#bb86fc' : '#5c6bc0',
                    transition: 'color 0.2s ease',
                  }}></i>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 500,
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                  Profilim
                  </Typography>
                </MenuItem>
                <MenuItem 
                  onClick={() => {
                    closeProfileMenu();
                    navigate('/friends');
                  }} 
                  sx={{ 
                    py: 1.5,
                    px: 2,
                    transition: 'all 0.2s ease',
                    color: darkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.75)',
                    '&:hover': {
                      backgroundColor: darkMode 
                        ? alpha('#9c27b0', 0.12)
                        : alpha('#3f51b5', 0.06),
                      color: darkMode ? '#bb86fc' : '#3f51b5',
                      transform: 'translateX(4px)',
                    }
                  }}
                >
                  <i className='bx bx-group' style={{ 
                    marginRight: '12px', 
                    fontSize: '20px', 
                    color: darkMode ? '#bb86fc' : '#5c6bc0',
                    transition: 'color 0.2s ease',
                  }}></i>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 500,
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                  Dost siyahısı
                  </Typography>
                </MenuItem>
                
                {isAdmin && (
                  <Box 
                    sx={{ 
                      mx: 2, 
                      my: 1, 
                      borderRadius: '10px', 
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: darkMode ? alpha('#9575cd', 0.3) : alpha('#7e57c2', 0.2),
                      boxShadow: darkMode 
                        ? '0 4px 15px rgba(97, 97, 255, 0.1)'
                        : '0 4px 15px rgba(0, 0, 0, 0.05)',
                      background: darkMode
                        ? 'linear-gradient(45deg, rgba(103, 58, 183, 0.15), rgba(97, 97, 255, 0.1))'
                        : 'linear-gradient(45deg, rgba(149, 117, 205, 0.08), rgba(126, 87, 194, 0.05))'
                    }}
                  >
                  <MenuItem 
                    onClick={() => {
                      closeProfileMenu();
                      navigate('/admin');
                    }} 
                    sx={{ 
                        py: 1.5,
                      transition: 'all 0.2s ease',
                        color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.75)',
                      '&:hover': {
                        backgroundColor: darkMode 
                            ? alpha('#673ab7', 0.2)
                            : alpha('#673ab7', 0.1),
                        color: darkMode ? '#b39ddb' : '#673ab7',
                          transform: 'translateY(-2px)',
                      }
                    }}
                  >
                      <i className='bx bxs-shield-alt-2' style={{ 
                        marginRight: '12px', 
                      fontSize: '20px', 
                        color: darkMode ? '#b39ddb' : '#673ab7',
                      transition: 'color 0.2s ease',
                    }}></i>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.9rem', 
                          fontWeight: 600,
                          fontFamily: "'Montserrat', sans-serif",
                          letterSpacing: '0.3px'
                        }}
                      >
                    Admin Paneli
                      </Typography>
                  </MenuItem>
                  </Box>
                )}
                <Divider sx={{ 
                  my: 0.5,
                  borderColor: darkMode 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(0, 0, 0, 0.05)',
                }} />
                <MenuItem 
                  onClick={handleLogout} 
                  sx={{ 
                    py: 1.5,
                    px: 2,
                    mt: 0.5,
                  transition: 'all 0.2s ease',
                    color: darkMode ? alpha('#f44336', 0.9) : alpha('#f44336', 0.8),
                  '&:hover': {
                    backgroundColor: darkMode 
                        ? 'rgba(244, 67, 54, 0.12)' 
                        : 'rgba(244, 67, 54, 0.08)',
                    color: '#f44336',
                      transform: 'translateX(4px)',
                  }
                  }}
                >
                  <i className='bx bx-log-out' style={{ 
                    marginRight: '12px', 
                    fontSize: '20px',
                    transition: 'color 0.2s ease',
                  }}></i>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 500,
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                  Çıxış
                  </Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            !isLoggedIn && isLandingPage && (
              <Button 
                component={RouterLink} 
                to="/login" 
                variant="contained"
                size="small"
                disableElevation
                sx={{
                  px: 2,
                  py: 0.8,
                  borderRadius: 4,
                  fontSize: '0.85rem',
                  bgcolor: '#9c27b0',
                  color: '#fff',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                  transition: 'box-shadow 0.2s ease, background-color 0.3s ease',
                  '&:hover': {
                    bgcolor: '#7b1fa2',
                    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)',
                  }
                }}
              >
                Daxil Ol
              </Button>
            )
          )}

          {/* Newsletter Menu */}
          <Menu
            anchorEl={newsletterAnchorEl}
            open={Boolean(newsletterAnchorEl)}
            onClose={handleNewsletterMenuClose}
            PaperProps={{
              elevation: 5,
              sx: {
                minWidth: '320px',
                maxWidth: '380px',
                mt: 1.5,
                borderRadius: '16px',
                backdropFilter: 'blur(12px)',
                backgroundColor: darkMode 
                  ? alpha(theme.palette.background.paper, 0.92)
                  : alpha('#ffffff', 0.98),
                border: darkMode 
                  ? '1px solid rgba(255, 255, 255, 0.12)' 
                  : '1px solid rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                boxShadow: darkMode
                  ? '0 10px 40px rgba(0, 0, 0, 0.35)'
                  : '0 10px 40px rgba(0, 0, 0, 0.15)',
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: darkMode 
                    ? 'linear-gradient(90deg, #9c27b0, #3f51b5)'
                    : 'linear-gradient(90deg, #5c6bc0, #7e57c2)',
                }
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: darkMode 
                ? 'linear-gradient(45deg, rgba(156, 39, 176, 0.1), rgba(63, 81, 181, 0.1))'
                : 'linear-gradient(45deg, rgba(92, 107, 192, 0.05), rgba(126, 87, 194, 0.05))',
              borderBottom: '1px solid',
              borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
            }}>
              <Typography variant="subtitle1" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: darkMode ? theme.palette.primary.light : theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <i className='bx bxs-news' style={{ fontSize: '22px' }}></i>
                Yeniliklər
              </Typography>
            </Box>

            {loadingNewsletters ? (
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[1, 2, 3].map((_, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                    <Skeleton variant="rectangular" width={50} height={50} sx={{ borderRadius: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="80%" height={24} />
                      <Skeleton variant="text" width="60%" height={20} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : newsletters.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Hal-hazırda yenilik yoxdur
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                {newsletters.map((newsletter) => (
                  <MenuItem 
                    key={newsletter.id}
                    onClick={() => handleNewsletterClick(newsletter.id)}
                    sx={{ 
                      py: 1.5,
                      px: 2,
                      transition: 'all 0.2s ease',
                      color: darkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.75)',
                      backgroundColor: newsletter.is_viewed 
                        ? 'transparent' 
                        : (darkMode ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.primary.main, 0.05)),
                      '&:hover': {
                        backgroundColor: darkMode 
                          ? alpha('#9c27b0', 0.12)
                          : alpha('#3f51b5', 0.06),
                        color: darkMode ? '#bb86fc' : '#3f51b5',
                      },
                      position: 'relative',
                      borderLeft: newsletter.is_important 
                        ? `3px solid ${theme.palette.error.main}`
                        : (newsletter.is_viewed 
                            ? 'none'
                            : `3px solid ${theme.palette.primary.main}`),
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: newsletter.is_viewed ? 400 : 600,
                          fontSize: '0.9rem',
                          pr: 2, // Space for date
                          color: newsletter.is_important 
                            ? theme.palette.error.main
                            : 'inherit'
                        }}
                      >
                        {newsletter.title}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mt: 0.5,
                        justifyContent: 'space-between'
                      }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          <i className='bx bx-calendar' style={{ fontSize: '14px' }}></i>
                          {format(new Date(newsletter.created_at), 'dd.MM.yyyy')}
                        </Typography>
                        
                        {!newsletter.is_viewed && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: theme.palette.primary.main,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Box>
            )}
            
            <Divider />
            <MenuItem
              onClick={() => {
                handleNewsletterMenuClose();
                navigate('/newsletters');
              }}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                py: 1.5,
                color: theme.palette.primary.main,
                fontWeight: 500,
                textAlign: 'center',
                '&:hover': {
                  backgroundColor: darkMode 
                    ? alpha(theme.palette.primary.main, 0.1)
                    : alpha(theme.palette.primary.main, 0.05),
                }
              }}
            >
              Bütün Yeniliklər
            </MenuItem>
          </Menu>

          {/* Bildirim Menüsü */}
          <Menu
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationMenuClose}
            PaperProps={{
              elevation: 5,
              sx: {
                minWidth: '320px',
                maxWidth: '380px',
                mt: 1.5,
                borderRadius: '16px',
                backdropFilter: 'blur(12px)',
                backgroundColor: darkMode 
                  ? alpha(theme.palette.background.paper, 0.92)
                  : alpha('#ffffff', 0.98),
                border: darkMode 
                  ? '1px solid rgba(255, 255, 255, 0.12)' 
                  : '1px solid rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                boxShadow: darkMode
                  ? '0 10px 40px rgba(0, 0, 0, 0.35)'
                  : '0 10px 40px rgba(0, 0, 0, 0.15)',
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: darkMode 
                    ? 'linear-gradient(90deg, #9c27b0, #3f51b5)'
                    : 'linear-gradient(90deg, #5c6bc0, #7e57c2)',
                }
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: darkMode 
                ? 'linear-gradient(45deg, rgba(156, 39, 176, 0.1), rgba(63, 81, 181, 0.1))'
                : 'linear-gradient(45deg, rgba(92, 107, 192, 0.05), rgba(126, 87, 194, 0.05))',
                borderBottom: '1px solid', 
              borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
            }}>
              <Typography variant="subtitle1" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: darkMode ? theme.palette.primary.light : theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <i className='bx bxs-bell' style={{ fontSize: '22px' }}></i>
              Bildirişlər
            </Typography>
            </Box>
            
            {incomingRequests.length === 0 ? (
              <Box sx={{ 
                p: 3, 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}>
                <i className='bx bx-bell-off' style={{ 
                  fontSize: '32px', 
                  color: darkMode ? alpha(theme.palette.text.secondary, 0.5) : alpha(theme.palette.text.secondary, 0.4)
                }}></i>
                <Typography variant="body2" color="text.secondary">
                  Heç bir yeni bildiriş yoxdur
                </Typography>
              </Box>
            ) : (
              <>
                {/* Arkadaşlık İstekleri Başlığı */}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    px: 2, 
                    py: 1, 
                    display: 'block', 
                    fontWeight: 600,
                    color: darkMode ? alpha(theme.palette.text.primary, 0.7) : theme.palette.text.secondary,
                    bgcolor: darkMode ? alpha(theme.palette.background.paper, 0.5) : alpha(theme.palette.background.paper, 0.4)
                  }}
                >
                  Dostluq İstəkləri ({incomingRequests.length})
                </Typography>
                
                {/* İstekler Listesi */}
                <Box sx={{ maxHeight: '320px', overflow: 'auto' }}>
                {incomingRequests.map((request) => (
                  <Box key={request.id} sx={{ 
                    borderBottom: '1px solid', 
                      borderColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: darkMode 
                          ? alpha(theme.palette.primary.dark, 0.08)
                          : alpha(theme.palette.primary.light, 0.05),
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5 }}>
                        <ListItemAvatar sx={{ minWidth: 'auto', mr: 1.5 }}>
                        <Avatar 
                          src={request.sender?.avatar_url || undefined} 
                          alt={request.sender?.username}
                            sx={{ 
                              width: 42, 
                              height: 42,
                              boxShadow: `0 3px 8px ${alpha(theme.palette.common.black, 0.1)}`,
                              border: `2px solid ${alpha(theme.palette.background.paper, 0.8)}`,
                            }}
                        >
                          {!request.sender?.avatar_url && request.sender?.username?.[0].toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <Box sx={{ flexGrow: 1, mr: 1, overflow: 'hidden' }}>
                        <Typography 
                          variant="body2" 
                          component={RouterLink} 
                          to={`/user/${request.sender?.id}`}
                          sx={{ 
                              fontWeight: 600, 
                              fontSize: '0.9rem',
                              color: darkMode ? theme.palette.primary.light : theme.palette.primary.main,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={handleNotificationMenuClose}
                        >
                          {request.sender?.username}
                        </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            noWrap 
                            display="block"
                            sx={{ mt: 0.5, fontSize: '0.75rem' }}
                          >
                          sizə dostluq istəyi göndərib
                        </Typography>
                      </Box>
                      
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => handleAcceptRequest(request.id)}
                          sx={{ 
                            bgcolor: alpha(theme.palette.primary.main, 0.1), 
                              '&:hover': { 
                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                          }}
                        >
                          <i className='bx bx-check' style={{ fontSize: '18px' }}></i>
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleRejectRequest(request.id)}
                          sx={{ 
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': { 
                                bgcolor: alpha(theme.palette.error.main, 0.2),
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                          }}
                        >
                          <i className='bx bx-x' style={{ fontSize: '18px' }}></i>
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                ))}
                </Box>
              </>
            )}
            
            {incomingRequests.length > 0 && (
              <MenuItem
                onClick={() => {
                  handleNotificationMenuClose();
                  navigate('/friends');
                }}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  py: 1.5,
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                textAlign: 'center', 
                  '&:hover': {
                    backgroundColor: darkMode 
                      ? alpha(theme.palette.primary.main, 0.1)
                      : alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                Bütün İstəkləri Göstər
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;