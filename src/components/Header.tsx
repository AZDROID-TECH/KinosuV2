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
} from '@mui/material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

// Ortak stiller
const commonStyles = {
  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  transition: 'all 0.3s ease',
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useCustomTheme();
  const { isLoggedIn, username, avatar, logout, isLoadingAuth, isAdmin } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();

  // Giriş ve kayıt sayfalarında veya Landing Page'de butonları gizlemek/göstermek için kontrol
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';
  const isResetPage = location.pathname.includes('/reset-password');
  const isLandingPage = location.pathname === '/';
  
  // Sadece Login/Register/Reset sayfalarında Header'ı daha sade yap
  const isSimpleHeader = isLoginPage || isRegisterPage || isResetPage;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

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
            {isLoggedIn && !isLoadingAuth && (
              <IconButton
                onClick={() => { /* Notification logic will be added later */ }}
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
                <i className='bx bxs-bell' style={{ fontSize: '22px' }}></i>
              </IconButton>
            )}
          </ButtonGroup>

          {isLoadingAuth ? (
            <Skeleton variant="circular" width={35} height={35} sx={{ ml: { xs: 0, sm: 0.5 } }} />
          ) : isLoggedIn ? (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  ml: { xs: 0, sm: 0.5 },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.15),
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={handleMenuOpen}
              >
                <Avatar
                  src={avatar || undefined}
                  alt={username || 'User'}
                  sx={{
                    bgcolor: darkMode ? '#9c27b0' : '#3f51b5',
                    width: 35,
                    height: 35,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {!avatar && username?.[0].toUpperCase()}
                </Avatar>
                <Typography
                  variant="subtitle1"
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    fontWeight: 600,
                    color: isSimpleHeader ? '#fff' : (darkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)'),
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {username}
                </Typography>
              </Box>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    minWidth: '200px',
                    mt: 1.5,
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)',
                    backgroundColor: darkMode 
                      ? alpha(theme.palette.background.paper, 0.9)
                      : alpha('#ffffff', 0.9),
                    border: darkMode 
                      ? '1px solid rgba(255, 255, 255, 0.1)' 
                      : '1px solid rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: darkMode
                      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                      : '0 8px 32px rgba(0, 0, 0, 0.1)',
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem 
                  onClick={() => {
                    handleMenuClose();
                    navigate('/profile');
                  }} 
                  sx={{ 
                    py: 1.2,
                    transition: 'all 0.2s ease',
                    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                    '&:hover': {
                      backgroundColor: darkMode 
                        ? alpha('#9c27b0', 0.1)
                        : alpha('#3f51b5', 0.05),
                      color: darkMode ? '#bb86fc' : '#3f51b5',
                    }
                  }}
                >
                  <i className='bx bx-user' style={{ 
                    marginRight: '8px', 
                    fontSize: '20px', 
                    color: darkMode ? '#9c27b0' : '#3f51b5',
                    transition: 'color 0.2s ease',
                  }}></i>
                  Profilim
                </MenuItem>
                {isAdmin && (
                  <MenuItem 
                    onClick={() => {
                      handleMenuClose();
                      navigate('/admin');
                    }} 
                    sx={{ 
                      py: 1.2,
                      transition: 'all 0.2s ease',
                      color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                      '&:hover': {
                        backgroundColor: darkMode 
                          ? alpha('#673ab7', 0.1)
                          : alpha('#673ab7', 0.05),
                        color: darkMode ? '#b39ddb' : '#673ab7',
                      }
                    }}
                  >
                    <i className='bx bx-shield-quarter' style={{ 
                      marginRight: '8px', 
                      fontSize: '20px', 
                      color: darkMode ? '#9575cd' : '#7e57c2',
                      transition: 'color 0.2s ease',
                    }}></i>
                    Admin Paneli
                  </MenuItem>
                )}
                <Divider sx={{ 
                  my: 0.5,
                  borderColor: darkMode 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)',
                }} />
                <MenuItem onClick={handleLogout} sx={{ 
                  color: 'error.main',
                  py: 1.2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: darkMode 
                      ? 'rgba(244, 67, 54, 0.08)' 
                      : 'rgba(244, 67, 54, 0.05)',
                    color: '#f44336',
                  }
                }}>
                  <i className='bx bx-log-out' style={{ 
                    marginRight: '8px', 
                    fontSize: '20px',
                    transition: 'color 0.2s ease',
                  }}></i>
                  Çıxış
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
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;