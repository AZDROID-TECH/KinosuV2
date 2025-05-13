import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import 'boxicons/css/boxicons.min.css';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { showSuccessToast, showErrorToast } from '../utils/toastHelper';
import SlideCaptcha from '../components/Common/SlideCaptcha';
import useCaptcha from '../hooks/useCaptcha';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDarkMode = theme.palette.mode === 'dark';

  // Captcha hook'unu kullan
  const { 
    isCaptchaOpen, 
    isCaptchaVerified, 
    openCaptcha, 
    closeCaptcha, 
    verifyCaptcha, 
    resetCaptcha 
  } = useCaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form alanlarının boş olup olmadığını kontrol et
    if (!formData.username.trim()) {
      showErrorToast('İstifadəçi adı daxil edin');
      return;
    }

    if (!formData.email.trim()) {
      showErrorToast('Email ünvanı daxil edin');
      return;
    }

    // Email formatını kontrol et
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showErrorToast('Düzgün email formatı daxil edin');
      return;
    }

    if (!formData.password.trim()) {
      showErrorToast('Şifrə daxil edin');
      return;
    }

    // Şifre uzunluğunu kontrol et
    if (formData.password.length < 6) {
      showErrorToast('Şifrə ən azı 6 simvol olmalıdır');
      return;
    }

    if (!formData.confirmPassword.trim()) {
      showErrorToast('Şifrəni təkrarlayın');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showErrorToast('Təkrarlanan şifrə eyni olmalıdır');
      return;
    }

    // Doğrulama yapılmadıysa captcha aç
    if (!isCaptchaVerified) {
      openCaptcha();
      return;
    }

    try {
      await authAPI.register(formData);
      showSuccessToast('Hesabınız uğurla yaradıldı! İndi daxil ola bilərsiniz.');
      // İşlem tamamlandıktan sonra captcha'yı sıfırla
      resetCaptcha();
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (err: any) {
      if (typeof err === 'object' && err !== null && 'error' in err) {
        const errorMsg = err.error as string;
        
        // Spesifik hataları kontrol et ve daha açıklayıcı mesajlar göster
        if (errorMsg.includes('istifadə olunur')) {
          showErrorToast('Bu istifadəçi adı və ya email artıq istifadə olunur');
        } else if (errorMsg.includes('email')) {
          showErrorToast('Düzgün email ünvanı daxil edin');
        } else if (errorMsg.includes('Verilənlər bazası')) {
          showErrorToast('Server xətası: verilənlər bazası problemi');
        } else {
          showErrorToast(errorMsg);
        }
      } else if (err && typeof err.message === 'string') {
        if (err.message.includes('istifadə olunur')) {
          showErrorToast('Bu istifadəçi adı və ya email artıq istifadə olunur');
        } else if (err.message.includes('email')) {
          showErrorToast('Düzgün email ünvanı daxil edin');
        } else {
          showErrorToast(err.message);
        }
      } else {
        showErrorToast('Qeydiyyat zamanı xəta baş verdi.');
      }
      // Hata durumunda da captcha'yı sıfırla
      resetCaptcha();
    }
  };

  // Captcha doğrulandığında kayıt işlemini gerçekleştir
  const handleCaptchaVerified = async () => {
    verifyCaptcha();
    
    // Form alanlarının boş olup olmadığını kontrol et
    if (!formData.username.trim()) {
      showErrorToast('İstifadəçi adı daxil edin');
      return;
    }

    if (!formData.email.trim()) {
      showErrorToast('Email ünvanı daxil edin');
      return;
    }

    // Email formatını kontrol et
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showErrorToast('Düzgün email formatı daxil edin');
      return;
    }

    if (!formData.password.trim()) {
      showErrorToast('Şifrə daxil edin');
      return;
    }

    // Şifre uzunluğunu kontrol et
    if (formData.password.length < 6) {
      showErrorToast('Şifrə ən azı 6 simvol olmalıdır');
      return;
    }

    if (!formData.confirmPassword.trim()) {
      showErrorToast('Şifrəni təkrarlayın');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showErrorToast('Təkrarlanan şifrə eyni olmalıdır');
      return;
    }

    try {
      await authAPI.register(formData);
      showSuccessToast('Hesabınız uğurla yaradıldı! İndi daxil ola bilərsiniz.');
      // İşlem tamamlandıktan sonra captcha'yı sıfırla
      resetCaptcha();
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (err: any) {
      if (typeof err === 'object' && err !== null && 'error' in err) {
        const errorMsg = err.error as string;
        
        // Spesifik hataları kontrol et ve daha açıklayıcı mesajlar göster
        if (errorMsg.includes('istifadə olunur')) {
          showErrorToast('Bu istifadəçi adı və ya email artıq istifadə olunur');
        } else if (errorMsg.includes('email')) {
          showErrorToast('Düzgün email ünvanı daxil edin');
        } else if (errorMsg.includes('Verilənlər bazası')) {
          showErrorToast('Server xətası: verilənlər bazası problemi');
        } else {
          showErrorToast(errorMsg);
        }
      } else if (err && typeof err.message === 'string') {
        if (err.message.includes('istifadə olunur')) {
          showErrorToast('Bu istifadəçi adı və ya email artıq istifadə olunur');
        } else if (err.message.includes('email')) {
          showErrorToast('Düzgün email ünvanı daxil edin');
        } else {
          showErrorToast(err.message);
        }
      } else {
        showErrorToast('Qeydiyyat zamanı xəta baş verdi.');
      }
      // Hata durumunda da captcha'yı sıfırla
      resetCaptcha();
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
                Sosial Film Platformasına qoşulmaq üçün Kinosu hesabı yaradın
              </Typography>
            </Box>
          </Box>

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
              sx={{
                mt: 3, 
                mb: 2, 
                py: 1.2,
                background: isCaptchaVerified
                  ? 'linear-gradient(90deg, #3f51b5, #9c27b0)'
                  : 'linear-gradient(90deg, #7986cb, #ba68c8)',
                transition: 'all 0.3s',
                position: 'relative',
                overflow: 'hidden',
                fontWeight: 500,
                boxShadow: isDarkMode 
                  ? '0 4px 10px rgba(0, 0, 0, 0.3)'
                  : '0 4px 10px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  background: isCaptchaVerified
                    ? 'linear-gradient(90deg, #303f9f, #7b1fa2)'
                    : 'linear-gradient(90deg, #5c6bc0, #ab47bc)',
                  boxShadow: isDarkMode 
                    ? '0 6px 15px rgba(0, 0, 0, 0.4)'
                    : '0 6px 15px rgba(0, 0, 0, 0.2)',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                  transition: 'all 0.8s',
                },
                '&:hover::after': {
                  left: '100%',
                }
              }}
              startIcon={<i className='bx bx-shield-quarter' style={{ fontSize: 20 }}></i>}
            >
              Qeydiyyatdan keç
            </Button>

            {/* Captcha bileşeni */}
            <SlideCaptcha 
              isOpen={isCaptchaOpen} 
              onClose={closeCaptcha} 
              onVerify={handleCaptchaVerified} 
            />

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
