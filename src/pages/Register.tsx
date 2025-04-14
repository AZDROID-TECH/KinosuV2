import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  InputAdornment,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import 'boxicons/css/boxicons.min.css';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDarkMode = theme.palette.mode === 'dark';

  // Mobil cihazlarda zoom sorununu çözmek için meta viewport tag'ini düzenleme
  useEffect(() => {
    // Mevcut viewport meta tag'ini al
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    
    // Eğer viewport meta tag'i varsa, maximum-scale ve user-scalable özelliklerini ekle
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    } else {
      // Yoksa yeni bir viewport meta tag'i oluştur
      const newViewportMeta = document.createElement('meta');
      newViewportMeta.name = 'viewport';
      newViewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(newViewportMeta);
    }
    
    // Component unmount olduğunda orijinal viewport ayarlarını geri yükle
    return () => {
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Təkrarlanan şifrə eyni olmalıdır');
      return;
    }

    try {
      console.log('Qeydiyyat başladılır:', {
        username: formData.username,
        email: formData.email,
        passwordLength: formData.password.length
      });

      // authAPI servisini kullanarak kayıt işlemi
      await authAPI.register(formData);

      console.log('Qeydiyyat uğurlu oldu');
      navigate('/login');
    } catch (err: any) {
      console.error('Qeydiyyat xətası:', err);
      setError(err.message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 64px)', sm: 'calc(100vh - 128px)' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        py: { xs: 2, sm: 4 },
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' 
          : 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 50%, #9fa8da 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDarkMode
            ? 'radial-gradient(circle at 25% 25%, rgba(63, 81, 181, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(156, 39, 176, 0.15) 0%, transparent 50%)'
            : 'radial-gradient(circle at 25% 25%, rgba(63, 81, 181, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(156, 39, 176, 0.1) 0%, transparent 50%)',
        }
      }}
    >
      <Container 
        component="main" 
        maxWidth="sm" 
        sx={{ 
          position: 'relative', 
          zIndex: 1,
          px: { xs: 2, sm: 3 },
          maxWidth: { xs: '95%', sm: '500px', md: '550px' },
          height: { sm: 'auto', md: 'auto' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: isDarkMode 
              ? alpha(theme.palette.background.paper, 0.7)
              : alpha('#ffffff', 0.7),
            backdropFilter: 'blur(15px)',
            boxShadow: isDarkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
              : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5) inset',
            border: isDarkMode
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.7)',
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: isDarkMode
                ? '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15) inset'
                : '0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.6) inset',
            },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: isDarkMode
                ? 'linear-gradient(90deg, #3f51b5, #9c27b0, #3f51b5)'
                : 'linear-gradient(90deg, #3f51b5, #9c27b0, #3f51b5)',
              backgroundSize: '200% 100%',
              animation: 'gradient 3s ease infinite',
              '@keyframes gradient': {
                '0%': {
                  backgroundPosition: '0% 50%'
                },
                '50%': {
                  backgroundPosition: '100% 50%'
                },
                '100%': {
                  backgroundPosition: '0% 50%'
                },
              },
            }}
          />

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center', 
            justifyContent: { xs: 'center', sm: 'flex-start' },
            gap: { xs: 0.5, sm: 3 }, 
            mb: 2,
            mt: 0.5,
            width: '100%'
          }}>
            <Box
              sx={{
                width: { xs: '60px', sm: '65px' },
                height: { xs: '60px', sm: '65px' },
                borderRadius: '50%',
                background: isDarkMode
                  ? 'linear-gradient(135deg, #3f51b5 0%, #9c27b0 100%)'
                  : 'linear-gradient(135deg, #3f51b5 0%, #9c27b0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isDarkMode
                  ? '0 4px 20px rgba(63, 81, 181, 0.4)'
                  : '0 4px 20px rgba(63, 81, 181, 0.3)',
                mb: { xs: 1, sm: 0 },
                border: isDarkMode
                  ? '3px solid rgba(255, 255, 255, 0.1)'
                  : '3px solid rgba(255, 255, 255, 0.8)',
                flexShrink: 0
              }}
            >
              <i className='bx bx-user-plus' style={{ fontSize: '32px', color: 'white' }}></i>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: { xs: 'center', sm: 'flex-start' }
            }}>
              <Typography
                component="h1"
                variant={isMobile ? "h5" : "h4"}
                sx={{ 
                  fontWeight: 'bold',
                  letterSpacing: '0.5px',
                  color: isDarkMode ? '#fff' : '#3f51b5',
                  textAlign: { xs: 'center', sm: 'left' },
                  mb: 0.5,
                  textShadow: isDarkMode 
                    ? '0 2px 4px rgba(0,0,0,0.3)' 
                    : 'none',
                }}
              >
                Qeydiyyat
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  textAlign: { xs: 'center', sm: 'left' },
                  maxWidth: '100%',
                  mb: 0.5,
                  fontSize: { xs: '0.85rem', sm: '0.875rem' }
                }}
              >
                Film dünyasına qoşulmaq üçün Kinosu hesabı yaradın
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%', 
                mb: 2,
                py: 0.6,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderRadius: 2,
                backgroundColor: isDarkMode 
                  ? alpha('#f44336', 0.15) 
                  : alpha('#f44336', 0.1),
                color: isDarkMode ? '#ff8a80' : '#d32f2f',
                border: `1px solid ${isDarkMode ? alpha('#f44336', 0.3) : alpha('#f44336', 0.2)}`,
                '& .MuiAlert-message': {
                  fontSize: '0.85rem',
                }
              }}
              icon={<i className='bx bx-error-circle' style={{ fontSize: '18px' }}></i>}
            >
              {error}
            </Alert>
          )}

          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ width: '100%' }}
          >
            <TextField
              required
              fullWidth
              size={isMobile ? "small" : "medium"}
              label="İstifadəçi adı"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className='bx bx-user' style={{ 
                      fontSize: isMobile ? '18px' : '20px', 
                      color: isDarkMode ? '#9c27b0' : '#3f51b5' 
                    }}></i>
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: isDarkMode 
                    ? alpha(theme.palette.background.paper, 0.4)
                    : alpha('#ffffff', 0.6),
                  '&:hover fieldset': {
                    borderColor: isDarkMode ? '#9c27b0' : '#3f51b5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: isDarkMode ? '#9c27b0' : '#3f51b5',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  '&.Mui-focused': {
                    color: isDarkMode ? '#9c27b0' : '#3f51b5',
                  },
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                },
                '& .MuiInputBase-input': {
                  color: isDarkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                },
              }}
            />
            <TextField
              required
              fullWidth
              size={isMobile ? "small" : "medium"}
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className='bx bx-envelope' style={{ 
                      fontSize: isMobile ? '18px' : '20px', 
                      color: isDarkMode ? '#9c27b0' : '#3f51b5' 
                    }}></i>
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: isDarkMode 
                    ? alpha(theme.palette.background.paper, 0.4)
                    : alpha('#ffffff', 0.6),
                  '&:hover fieldset': {
                    borderColor: isDarkMode ? '#9c27b0' : '#3f51b5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: isDarkMode ? '#9c27b0' : '#3f51b5',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  '&.Mui-focused': {
                    color: isDarkMode ? '#9c27b0' : '#3f51b5',
                  },
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                },
                '& .MuiInputBase-input': {
                  color: isDarkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                },
              }}
            />
            <TextField
              required
              fullWidth
              size={isMobile ? "small" : "medium"}
              name="password"
              label="Şifrə"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className='bx bx-lock-alt' style={{ 
                      fontSize: isMobile ? '18px' : '20px', 
                      color: isDarkMode ? '#9c27b0' : '#3f51b5' 
                    }}></i>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
                      }}
                    >
                      <i className={`bx ${showPassword ? 'bx-show' : 'bx-hide'}`} style={{ fontSize: isMobile ? '18px' : '20px' }}></i>
                    </button>
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: isDarkMode 
                    ? alpha(theme.palette.background.paper, 0.4)
                    : alpha('#ffffff', 0.6),
                  '&:hover fieldset': {
                    borderColor: isDarkMode ? '#9c27b0' : '#3f51b5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: isDarkMode ? '#9c27b0' : '#3f51b5',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  '&.Mui-focused': {
                    color: isDarkMode ? '#9c27b0' : '#3f51b5',
                  },
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                },
                '& .MuiInputBase-input': {
                  color: isDarkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                },
              }}
            />
            <TextField
              required
              fullWidth
              size={isMobile ? "small" : "medium"}
              name="confirmPassword"
              label="Şifrəni təkrarlayın"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className='bx bx-lock-alt' style={{ 
                      fontSize: isMobile ? '18px' : '20px', 
                      color: isDarkMode ? '#9c27b0' : '#3f51b5' 
                    }}></i>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
                      }}
                    >
                      <i className={`bx ${showPassword ? 'bx-show' : 'bx-hide'}`} style={{ fontSize: isMobile ? '18px' : '20px' }}></i>
                    </button>
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: isDarkMode 
                    ? alpha(theme.palette.background.paper, 0.4)
                    : alpha('#ffffff', 0.6),
                  '&:hover fieldset': {
                    borderColor: isDarkMode ? '#9c27b0' : '#3f51b5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: isDarkMode ? '#9c27b0' : '#3f51b5',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  '&.Mui-focused': {
                    color: isDarkMode ? '#9c27b0' : '#3f51b5',
                  },
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                },
                '& .MuiInputBase-input': {
                  color: isDarkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size={isMobile ? "medium" : "large"}
              sx={{
                py: isMobile ? 1 : 1.2,
                borderRadius: 2,
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: isMobile ? '0.9rem' : '1rem',
                boxShadow: isDarkMode 
                  ? '0 4px 20px rgba(156, 39, 176, 0.4)' 
                  : '0 4px 20px rgba(63, 81, 181, 0.3)',
                transition: 'all 0.3s',
                background: isDarkMode
                  ? 'linear-gradient(45deg, #9c27b0 0%, #673ab7 100%)'
                  : 'linear-gradient(45deg, #3f51b5 0%, #673ab7 100%)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: isDarkMode 
                    ? '0 6px 25px rgba(156, 39, 176, 0.5)' 
                    : '0 6px 25px rgba(63, 81, 181, 0.4)',
                  background: isDarkMode
                    ? 'linear-gradient(45deg, #9c27b0 30%, #673ab7 90%)'
                    : 'linear-gradient(45deg, #3f51b5 30%, #673ab7 90%)',
                },
              }}
            >
              <i className='bx bx-user-check' style={{ fontSize: isMobile ? '20px' : '22px', marginRight: '8px' }}></i>
              Qeydiyyatdan keç
            </Button>

            <Box 
              sx={{ 
                my: 2,
                textAlign: 'center',
                position: 'relative',
                '&::before, &::after': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  width: '42%',
                  height: '1px',
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                },
                '&::before': { left: 0 },
                '&::after': { right: 0 }
              }}
            >
              <Typography 
                variant="caption" 
                component="span"
                sx={{ 
                  px: 2,
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                }}
              >
                və ya
              </Typography>
            </Box>

            <Link
              to="/login"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Button
                fullWidth
                variant="outlined"
                size={isMobile ? "medium" : "large"}
                sx={{
                  py: isMobile ? 1 : 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  transition: 'all 0.3s',
                  borderWidth: '2px',
                  borderColor: isDarkMode ? '#9c27b0' : '#3f51b5',
                  color: isDarkMode ? '#fff' : '#3f51b5',
                  backgroundColor: 'transparent',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderWidth: '2px',
                    borderColor: isDarkMode ? '#bb86fc' : '#5c6bc0',
                    backgroundColor: isDarkMode 
                      ? alpha('#9c27b0', 0.1) 
                      : alpha('#3f51b5', 0.05),
                  },
                }}
              >
                <i className='bx bx-log-in' style={{ fontSize: isMobile ? '20px' : '22px', marginRight: '8px' }}></i>
                Daxil ol
              </Button>
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register; 