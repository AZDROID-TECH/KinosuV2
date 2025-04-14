import { Box, Container, Typography, Divider, useTheme, alpha } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import 'boxicons/css/boxicons.min.css';

// Ortak stiller
const commonStyles = {
  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  transition: 'all 0.3s ease',
};

const socialIconStyles = {
  color: '#fff',
  textDecoration: 'none',
  transition: 'all 0.2s ease',
  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
};

const Footer = () => {
  const location = useLocation();
  const theme = useTheme();
  const { darkMode } = useCustomTheme();
  
  // Giriş ve kayıt sayfalarında farklı stil için kontrol
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname.includes('/reset-password');

  return (
    <Box
      component="footer"
      sx={{
        py: isAuthPage ? { xs: 2, sm: 3 } : 3,
        px: 2,
        mt: 'auto',
        background: darkMode 
          ? alpha(theme.palette.background.paper, 0.95)
          : 'linear-gradient(45deg, #3f51b5 0%, #673ab7 100%)',
        borderTop: isAuthPage ? 'none' : `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'}`,
        backdropFilter: isAuthPage ? 'blur(10px)' : 'blur(5px)',
        position: isAuthPage ? 'relative' : 'static',
        zIndex: 1,
        transition: 'all 0.3s ease-in-out',
        borderRadius: isAuthPage ? 0 : '8px 8px 0 0',
        boxShadow: isAuthPage 
          ? 'none' 
          : '0 -2px 10px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <img 
              src="/icon.svg" 
              alt="Kinosu" 
              style={{ 
                width: 28, 
                height: 28,
                transition: 'all 0.3s ease'
              }} 
            />
            <span style={{
              color: isAuthPage
                ? '#fff'
                : darkMode
                  ? '#bb86fc'
                  : '#fff',
              display: 'inline-block',
              fontWeight: 'bold',
              textShadow: isAuthPage 
                ? '0 2px 4px rgba(0,0,0,0.3)' 
                : (darkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.3)'),
              transition: 'color 0.3s ease',
            }}>
              Kinosu
            </span>
          </Typography>
        </Box>

        <Divider sx={{ 
          my: 2, 
          borderColor: isAuthPage 
            ? (darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)') 
            : 'rgba(255,255,255,0.2)',
          opacity: isAuthPage ? 0.7 : 0.8,
        }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{ 
              textAlign: { xs: 'center', sm: 'left' },
              color: isAuthPage 
                ? (darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.9)') 
                : (darkMode ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.95)'),
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              fontWeight: 500,
              letterSpacing: '0.3px',
            }}
          >
            © {new Date().getFullYear()} Kinosu | AZDROID Tech. Bütün hüquqlar qorunur.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <a
              href="https://www.linkedin.com/in/azdroid/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...socialIconStyles
              }}
              className="social-icon"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.color = darkMode ? '#bb86fc' : '#757de8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.color = '#fff';
              }}
            >
              <i className='bx bxl-linkedin' style={{ fontSize: '20px' }}></i>
            </a>
            <a
              href="https://www.tiktok.com/@azdroid.dev"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...socialIconStyles
              }}
              className="social-icon"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.color = darkMode ? '#bb86fc' : '#757de8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.color = '#fff';
              }}
            >
              <i className='bx bxl-tiktok' style={{ fontSize: '20px' }}></i>
            </a>
            <a
              href="https://www.instagram.com/azdroid.dev/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...socialIconStyles
              }}
              className="social-icon"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.color = darkMode ? '#bb86fc' : '#757de8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.color = '#fff';
              }}
            >
              <i className='bx bxl-instagram' style={{ fontSize: '20px' }}></i>
            </a>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 