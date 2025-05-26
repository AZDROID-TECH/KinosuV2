import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';

interface FullScreenLoadingModalProps {
  open: boolean;
  title?: string;
  message?: string;
}

const FullScreenLoadingModal: React.FC<FullScreenLoadingModalProps> = ({ open, title, message }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkMode
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
          : 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 50%, #9fa8da 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Animasyonlu modern efekt */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Parlayan dairesel efektler */}
        <Box
          sx={{
            position: 'absolute',
            top: isMobile ? 40 : 80,
            left: isMobile ? 30 : 120,
            width: isMobile ? 120 : 220,
            height: isMobile ? 120 : 220,
            borderRadius: '50%',
            background: isDarkMode
              ? 'radial-gradient(circle, #9c27b0 0%, transparent 70%)'
              : 'radial-gradient(circle, #3f51b5 0%, transparent 70%)',
            filter: 'blur(32px)',
            opacity: 0.5,
            animation: 'pulse1 3s infinite alternate',
            '@keyframes pulse1': {
              '0%': { transform: 'scale(1)' },
              '100%': { transform: 'scale(1.15)' },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: isMobile ? 40 : 80,
            right: isMobile ? 30 : 120,
            width: isMobile ? 100 : 180,
            height: isMobile ? 100 : 180,
            borderRadius: '50%',
            background: isDarkMode
              ? 'radial-gradient(circle, #3f51b5 0%, transparent 70%)'
              : 'radial-gradient(circle, #9c27b0 0%, transparent 70%)',
            filter: 'blur(32px)',
            opacity: 0.4,
            animation: 'pulse2 4s infinite alternate',
            '@keyframes pulse2': {
              '0%': { transform: 'scale(1)' },
              '100%': { transform: 'scale(1.12)' },
            },
          }}
        />
      </Box>
      {/* Yükleme içeriği */}
      <Box sx={{ zIndex: 2, textAlign: 'center', p: 4, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.04)', boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(63,81,181,0.08)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: isDarkMode
                ? 'linear-gradient(135deg, #3f51b5 0%, #9c27b0 100%)'
                : 'linear-gradient(135deg, #3f51b5 0%, #9c27b0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isDarkMode
                ? '0 4px 20px rgba(63, 81, 181, 0.4)'
                : '0 4px 20px rgba(63, 81, 181, 0.2)',
              animation: 'spin 2.5s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          >
            <i className='bx bx-loader-alt bx-spin' style={{ fontSize: 38, color: '#fff' }}></i>
          </Box>
        </Box>
        <Typography variant="h5" sx={{ color: isDarkMode ? '#fff' : '#3f51b5', fontWeight: 700, mb: 1, letterSpacing: 1 }}>
          {title || 'Giriş yoxlanılır...'}
        </Typography>
        <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(63,81,181,0.7)', fontWeight: 400 }}>
          {message || 'Zəhmət olmasa bir az gözləyin'}
        </Typography>
      </Box>
    </Box>
  );
};

export default FullScreenLoadingModal; 