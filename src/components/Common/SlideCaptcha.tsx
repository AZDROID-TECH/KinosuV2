import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Typography, 
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  CircularProgress,
  alpha,
  Slide,
  styled
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import 'boxicons/css/boxicons.min.css';

// Özel stilli kaydırma izini için styled component
const SlideTrack = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 40,
  borderRadius: 20,
  backgroundColor: alpha(theme.palette.mode === 'dark' 
    ? theme.palette.primary.main 
    : theme.palette.primary.light, 0.2),
  position: 'relative',
  cursor: 'pointer',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  boxShadow: theme.palette.mode === 'dark' 
    ? 'inset 0 2px 4px rgba(0,0,0,0.3)' 
    : 'inset 0 2px 4px rgba(0,0,0,0.1)',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: theme.palette.mode === 'dark' 
      ? 'linear-gradient(135deg, rgba(63, 81, 181, 0.1) 25%, transparent 25%, transparent 50%, rgba(63, 81, 181, 0.1) 50%, rgba(63, 81, 181, 0.1) 75%, transparent 75%, transparent)'
      : 'linear-gradient(135deg, rgba(63, 81, 181, 0.1) 25%, transparent 25%, transparent 50%, rgba(63, 81, 181, 0.1) 50%, rgba(63, 81, 181, 0.1) 75%, transparent 75%, transparent)',
    backgroundSize: '10px 10px',
    opacity: 0.5,
  }
}));

// Özel stilli kaydırma topuzu için styled component
const SlideKnob = styled(Box)(({ theme }) => ({
  width: 36,
  height: 36,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  cursor: 'grab',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 3px 8px rgba(0,0,0,0.5)' 
    : '0 3px 8px rgba(0,0,0,0.2)',
  border: theme.palette.mode === 'dark' 
    ? '2px solid rgba(255,255,255,0.1)' 
    : '2px solid rgba(255,255,255,0.8)',
  transition: 'background-color 0.2s',
  zIndex: 2,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  '&:active': {
    cursor: 'grabbing',
    backgroundColor: theme.palette.secondary.main,
  }
}));

// Özel stilli ilerleyiş göstergesi
const ProgressTrack = styled(Box)<{ progress: number }>(({ theme, progress }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  width: `${progress}%`,
  backgroundColor: alpha(theme.palette.primary.main, 0.3),
  backgroundImage: theme.palette.mode === 'dark' 
    ? `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.5)}, ${alpha(theme.palette.secondary.main, 0.5)})`
    : `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.5)}, ${alpha(theme.palette.secondary.main, 0.5)})`,
  transition: 'width 0.1s ease-out',
  borderRadius: 20,
  zIndex: 1,
}));

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface SlideCaptchaProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
}

const SlideCaptcha: React.FC<SlideCaptchaProps> = ({ isOpen, onClose, onVerify }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [currentX, setCurrentX] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  // Kaydırma işlemi tamamlandığında onay işlemi
  const handleVerification = () => {
    if (progress >= 100) {
      setIsVerifying(true);
      
      // Sunucu onayını simüle ediyoruz (gerçek bir API isteği burada olacak)
      setTimeout(() => {
        setIsVerifying(false);
        setIsVerified(true);
        
        // Onay işlemi sonrası küçük bir gecikme ile callback çağrılır
        setTimeout(() => {
          onVerify();
          onClose();
        }, 500);
      }, 1000);
    }
  };

  // Kaydırma işlemi başladığında
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isVerified || isVerifying) return;
    
    setIsDragging(true);
    if (trackRef.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      setStartX(e.clientX - trackRect.left - currentX);
    }
    
    // Tıklanıldığında hareketli görünmesi için grabbing stil
    if (knobRef.current) {
      knobRef.current.style.cursor = 'grabbing';
    }
  };

  // Dokunmatik cihazlar için kaydırma başlangıcı
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isVerified || isVerifying) return;
    
    setIsDragging(true);
    if (trackRef.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      setStartX(e.touches[0].clientX - trackRect.left - currentX);
    }
    
    // Dokunulduğunda hareketli görünmesi için grabbing stil
    if (knobRef.current) {
      knobRef.current.style.cursor = 'grabbing';
    }
  };

  // Kaydırma hareketi
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isVerified || isVerifying) return;
    
    if (trackRef.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      const trackWidth = trackRect.width - 36; // Knob genişliğini çıkarıyoruz
      
      // Kaydırma miktarı hesaplanıyor
      let newPosition = e.clientX - trackRect.left - startX;
      
      // Sınırlar kontrol ediliyor
      if (newPosition < 0) newPosition = 0;
      if (newPosition > trackWidth) newPosition = trackWidth;
      
      // İlerleme yüzdesi hesaplanıyor
      const newProgress = (newPosition / trackWidth) * 100;
      setProgress(newProgress);
      setCurrentX(newPosition);
    }
  };

  // Dokunmatik cihazlar için kaydırma hareketi
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || isVerified || isVerifying) return;
    
    // Sayfanın kaymasını engelle
    e.preventDefault();
    
    if (trackRef.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      const trackWidth = trackRect.width - 36; // Knob genişliğini çıkarıyoruz
      
      // Kaydırma miktarı hesaplanıyor
      let newPosition = e.touches[0].clientX - trackRect.left - startX;
      
      // Sınırlar kontrol ediliyor
      if (newPosition < 0) newPosition = 0;
      if (newPosition > trackWidth) newPosition = trackWidth;
      
      // İlerleme yüzdesi hesaplanıyor
      const newProgress = (newPosition / trackWidth) * 100;
      setProgress(newProgress);
      setCurrentX(newPosition);
    }
  };

  // Kaydırma işlemi bitti
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      
      if (knobRef.current) {
        knobRef.current.style.cursor = 'grab';
      }
      
      // Eğer %95'den fazla tamamlandıysa, doğrulama işlemi başlatılır
      if (progress >= 95) {
        setProgress(100);
        setCurrentX(trackRef.current ? trackRef.current.getBoundingClientRect().width - 36 : 0);
        handleVerification();
      } else {
        // Yeterli kaydırma olmadıysa başa dön
        setProgress(0);
        setCurrentX(0);
      }
    }
  };

  // Global event listener'ları ekle/kaldır
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const handleGlobalTouchMove = (e: TouchEvent) => handleTouchMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();
    
    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      window.addEventListener('touchend', handleGlobalMouseUp);
    } else {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging, progress, isVerified, isVerifying]);

  // Modal kapandığında state'leri sıfırla
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setProgress(0);
        setCurrentX(0);
        setIsVerified(false);
        setIsVerifying(false);
        setIsDragging(false);
      }, 300);
    }
  }, [isOpen]);

  return (
    <Dialog
      open={isOpen}
      TransitionComponent={Transition}
      keepMounted
      onClose={onClose}
      aria-describedby="slide-captcha-description"
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: isDarkMode 
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' 
            : 'linear-gradient(135deg, #f5f5f7 0%, #e8eaf6 100%)',
          boxShadow: isDarkMode 
            ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
            : '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #3f51b5, #9c27b0, #3f51b5)',
          backgroundSize: '200% 100%',
          animation: 'gradient 3s ease infinite',
          '@keyframes gradient': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
          },
        }}
      />
      
      <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 500, color: isDarkMode ? '#fff' : '#333' }}>
          Təhlükəsizlik Yoxlaması
        </Typography>
        <IconButton 
          onClick={onClose} 
          edge="end" 
          sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}
        >
          <i className='bx bx-x' style={{ fontSize: '24px' }}></i>
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
            Robot olmadığınızı təsdiqləmək üçün dairəni sağa sürükləyin
          </Typography>
        </Box>
        
        <Box 
          sx={{ 
            position: 'relative', 
            height: 70, 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            mx: 1,
            mb: 2
          }}
          className="slide-captcha-container"
        >
          <SlideTrack 
            ref={trackRef} 
            sx={{ width: '100%', mx: 3 }}
            onTouchStart={(e) => {
              // Sayfanın kaymasını engelle
              e.preventDefault();
              handleTouchStart(e);
            }}
            onTouchMove={(e) => {
              // Sayfanın kaymasını engelle
              e.preventDefault();
            }}
          >
            <ProgressTrack progress={progress} />
            <SlideKnob 
              ref={knobRef}
              sx={{ 
                left: currentX,
                backgroundColor: isVerified 
                  ? theme.palette.success.main 
                  : isVerifying 
                    ? theme.palette.info.main 
                    : theme.palette.primary.main
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              {isVerifying ? (
                <CircularProgress size={22} sx={{ color: '#fff' }} />
              ) : isVerified ? (
                <i className='bx bx-check' style={{ fontSize: '22px' }}></i>
              ) : (
                <i className='bx bx-right-arrow-alt' style={{ fontSize: '22px' }}></i>
              )}
            </SlideKnob>
          </SlideTrack>
        </Box>
        
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}>
            Powered by Kinosu Security
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SlideCaptcha; 