import { Container, Typography, Button, Box, useTheme, CircularProgress, Grid, Stack, Paper, Icon } from '@mui/material';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCallback } from 'react';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type Engine, MoveDirection, OutMode } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { useState, useEffect } from 'react';
import 'boxicons/css/boxicons.min.css';

// Komponentin Azərbaycan dilində başlığı
/**
 * @az Qonaqlar üçün Açılış Səhifəsi (Modern Dizayn + İkonlar)
 * @desc Sayta daxil olmuş amma giriş etməmiş istifadəçilər üçün göstərilən, ikonlarla zənginləşdirilmiş modern dizaynlı səhifə.
 *       Əgər istifadəçi giriş edibsə, avtomatik /dashboard səhifəsinə yönləndirir.
 *       AuthContext və Particles engine yüklənərkən gözləyir.
 */
const LandingPage = () => {
  const { isLoggedIn, isLoadingAuth } = useAuth();
  const theme = useTheme();
  const [particlesInit, setParticlesInit] = useState(false);

  // tsParticles motorunu yalnız bir dəfə başlat
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesInit(true);
    });
  }, []);

  // Yüklənmə vəziyyətləri (Auth və Particles)
  if (isLoadingAuth || !particlesInit) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}> {/* Header yüksekliğini düşündüm */}
        <CircularProgress />
      </Box>
    );
  }

  // Oturum açıksa /dashboard'a yönlendir
  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  // Parçacık konfigürasyonu
  const particleOptions = {
    background: {
      color: {
        value: theme.palette.background.default, // Tema arxa plan rəngi
      },
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onClick: {
          enable: false, // Tıklama eventi deaktiv
          mode: "push",
        },
        onHover: {
          enable: true,
          mode: "repulse", // Üzerine gelince itme effekti
        },
      },
      modes: {
        push: {
          quantity: 4,
        },
        repulse: {
          distance: 150, // itme mesafesi
          duration: 0.4,
        },
      },
    },
    particles: {
      color: {
        value: theme.palette.mode === 'dark' ? "#ffffff" : "#000000", // Temaya göre renk
      },
      links: {
        color: theme.palette.mode === 'dark' ? "#ffffff" : "#000000",
        distance: 150,
        enable: true,
        opacity: 0.3,
        width: 1,
      },
      move: {
        direction: MoveDirection.none,
        enable: true,
        outModes: {
          default: OutMode.bounce, // String yerine OutMode enum kullanıldı
        },
        random: false,
        speed: 2, // Hareket hızı
        straight: false,
      },
      number: {
        density: {
          enable: true,
        },
        value: 80, // Parçacık sayısı
      },
      opacity: {
        value: 0.3, // Parçacık şeffaflığı
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1, max: 5 }, // Parçacık boyutları
      },
    },
    detectRetina: true,
  };

  return (
    <Box 
      sx={{ 
        minHeight: 'calc(100vh - 64px)', 
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: '100%',
        py: { xs: 3, sm: 4, md: 6 },
      }}
    >
      {particlesInit && (
        <Particles
          id="tsparticles"
          options={particleOptions}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%', 
            zIndex: 0, 
          }}
        />
      )}
      {/* İçerik Kutusu */}
      <Container 
        maxWidth="lg" 
        sx={{ position: 'relative', zIndex: 1 }}
      >
        <Grid container spacing={{ xs: 3, sm: 4, md: 6 }} justifyContent="center" alignItems="center">
          {/* Sol Taraf: Başlık, Açıklama, Buton */}
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom 
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: { xs: '2.0rem', sm: '3rem', md: '4rem' },
                lineHeight: { xs: 1.2, sm: 1.3 },
                mb: { xs: 2, md: 3 },
                textShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
              }}
            >
              Film Dünyanız,
              <br />
              Sizin Nəzarətinizdə.
            </Typography>
            <Typography 
              variant="h6" 
              color={theme.palette.text.secondary}
              paragraph 
              sx={{ 
                mb: { xs: 3, md: 5 }, 
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' },
                maxWidth: { md: '500px' },
              }}
            >
              Minlərlə film arasında axtarın, öz izləmə siyahılarınızı yaradın, qiymətləndirin və film təcrübənizi fərdiləşdirin.
            </Typography>
            <Button 
              component={RouterLink} 
              to="/register" 
              variant="contained" 
              size="large"
              sx={{
                px: { xs: 3, sm: 5 }, 
                py: { xs: 1.2, sm: 1.8 }, 
                borderRadius: 4,
                fontSize: { xs: '0.85rem', sm: '1rem' },
                bgcolor: '#9c27b0',
                color: '#fff',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease',
                '&:hover': {
                  bgcolor: '#7b1fa2',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                }
              }}
            >
              Pulsuz Qeydiyyatdan Keç
            </Button>
          </Grid>
          
          {/* Sağ Taraf: İkonlu Özellik Kutuları */}
          <Grid item xs={12} md={6}>
            <Stack spacing={{ xs: 2, sm: 3 }}>
              {/* Özellik 1: Axtarış */}
              <Paper elevation={3} sx={featurePaperStyle(theme)}>
                <Box sx={iconBoxStyle(theme, 'primary', true)}>
                  <i className='bx bx-search-alt' style={{ fontSize: '24px' }}></i>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.15rem' } }}>Limitsiz Axtarış</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Geniş film arxivində istədiyiniz filmi asanlıqla tapın.</Typography>
                </Box>
              </Paper>
              {/* Özellik 2: Siyahılar */}
              <Paper elevation={3} sx={featurePaperStyle(theme)}>
                <Box sx={iconBoxStyle(theme, 'secondary', true)}>
                   <i className='bx bx-list-ul' style={{ fontSize: '24px' }}></i>
                </Box>
                 <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.15rem' } }}>Fərdi Siyahılar</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>"İzləniləcək", "İzlənilir", "İzlənildi" siyahıları ilə filmlərinizi təşkil edin.</Typography>
                </Box>
              </Paper>
              {/* Özellik 3: Qiymətləndirmə */}
              <Paper elevation={3} sx={featurePaperStyle(theme)}>
                <Box sx={iconBoxStyle(theme, 'warning', true)}>
                   <i className='bx bx-star' style={{ fontSize: '24px' }}></i>
                </Box>
                 <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.15rem' } }}>Qiymətləndirmə</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>İzlədiyiniz filmlərə öz xalınızı verin və təcrübənizi paylaşın.</Typography>
                </Box>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

// Yardımcı stil fonksiyonları
const featurePaperStyle = (theme: any) => ({
  p: { xs: 2, sm: 2.5 },
  display: 'flex',
  alignItems: 'center',
  gap: { xs: 1.5, sm: 2 },
  borderRadius: 3,
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`, 
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'scale(1.03)',
    boxShadow: theme.shadows[6],
  }
});

const iconBoxStyle = (theme: any, color: 'primary' | 'secondary' | 'warning' | 'error' | 'info' | 'success', isMobile?: boolean) => ({
  bgcolor: theme.palette[color].main,
  color: theme.palette[color].contrastText,
  borderRadius: '50%',
  width: isMobile ? { xs: 40, sm: 50 } : 50,
  height: isMobile ? { xs: 40, sm: 50 } : 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  boxShadow: `0 4px 8px ${theme.palette[color].dark}50`,
});

export default LandingPage; 