import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Container, Grid, Avatar, Button, Divider, Skeleton, CircularProgress } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import PersonIcon from '@mui/icons-material/Person';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckIcon from '@mui/icons-material/Check';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EmailIcon from '@mui/icons-material/Email';
import dayjs from 'dayjs';

// Resim Kırpma Modalı için gerekli bileşenler
import Crop from 'react-easy-crop';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slider from '@mui/material/Slider';
import { Point, Area } from 'react-easy-crop/types';

interface UserProfileData {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  watchlist: {
    watchlist: number;
    watching: number;
    watched: number;
  };
}

const getCroppedImg = (
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context is not available'));
        return;
      }
      
      // Kare canvas boyutu
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      
      // Resmi kırp ve çiz
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      
      // Canvas'ı blob olarak dönüştür
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    };
    
    image.onerror = () => {
      reject(new Error('Error loading image'));
    };
  });
};

const Profile = () => {
  const { darkMode } = useCustomTheme();
  const muiTheme = useMuiTheme();
  const { username, refreshProfile, updateAvatar } = useAuth();
  
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Avatar işlemleri için state'ler
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [openCropModal, setOpenCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Profil bilgilerini yükle
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userAPI.getProfile();
      setProfileData(data);
      setError(null);
    } catch (err) {
      setError('Profil məlumatları yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Resim seçildiğinde
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.readAsDataURL(file);
      reader.onload = () => {
        setSelectedFile(reader.result as string);
        setOpenCropModal(true);
      };
    }
  };

  // Kırpma tamamlandığında
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Kırpılmış resmi yükle
  const uploadCroppedImage = async () => {
    if (!selectedFile || !croppedAreaPixels) return;
    
    try {
      setAvatarLoading(true);
      const croppedImage = await getCroppedImg(selectedFile, croppedAreaPixels);
      
      // Dosya nesnesini oluştur
      const file = new File([croppedImage], 'avatar.jpg', { type: 'image/jpeg' });
      
      // Resmi yükle
      const response = await userAPI.uploadAvatar(file);
      
      // AuthContext'te avatar'ı güncelle
      updateAvatar(response.avatar);
      
      // Profil bilgilerini yenile
      await loadProfile();
      await refreshProfile();
      
      // Modalı kapat
      setOpenCropModal(false);
      setSelectedFile(null);
    } catch (err) {
      console.error('Avatar yükləmə xətası:', err);
      setError('Avatar yükləmə zamanı xəta baş verdi');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Avatar'ı sil
  const deleteAvatar = async () => {
    if (!window.confirm('Avatarınızı silmək istədiyinizə əminsiniz?')) return;
    
    try {
      setAvatarLoading(true);
      await userAPI.deleteAvatar();
      
      // AuthContext'te avatar'ı temizle
      updateAvatar(null);
      
      // Profil bilgilerini yenile
      await loadProfile();
      await refreshProfile();
    } catch (err) {
      console.error('Avatar silmə xətası:', err);
      setError('Avatar silmə zamanı xəta baş verdi');
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: 'error.main', 
            color: 'white',
            borderRadius: 2 
          }}
        >
          <Typography>{error}</Typography>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        {/* Profil Kartı */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 3,
              background: darkMode 
                ? 'rgba(30, 30, 40, 0.8)'
                : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              boxShadow: darkMode 
                ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {loading ? (
              <>
                <Skeleton 
                  variant="circular" 
                  width={150} 
                  height={150} 
                  sx={{ mb: 2 }} 
                />
                <Skeleton variant="text" width="60%" height={30} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" width="100%" height={40} />
              </>
            ) : (
              <>
                <Box sx={{ position: 'relative', mb: 3 }}>
                  <Avatar
                    src={profileData?.avatar || undefined}
                    sx={{
                      width: 150,
                      height: 150,
                      bgcolor: darkMode ? '#9c27b0' : '#3f51b5',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                      border: '4px solid',
                      borderColor: darkMode ? 'rgba(156, 39, 176, 0.5)' : 'rgba(63, 81, 181, 0.5)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {!profileData?.avatar && (
                      <PersonIcon sx={{ fontSize: 80 }} />
                    )}
                  </Avatar>
                  
                  {avatarLoading && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: '50%'
                      }}
                    >
                      <CircularProgress color="secondary" />
                    </Box>
                  )}
                </Box>
                
                <Typography 
                  variant="h4" 
                  gutterBottom
                  sx={{ 
                    color: darkMode ? '#bb86fc' : '#3f51b5',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  {profileData?.username}
                </Typography>
                
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 3
                  }}
                >
                  <CalendarMonthIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {profileData?.createdAt 
                      ? `Qoşuldu: ${dayjs(profileData.createdAt).format('DD.MM.YYYY')}`
                      : 'Qeydiyyat tarixi mövcud deyil'}
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 3,
                    alignSelf: 'flex-start'
                  }}
                >
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {profileData?.email || 'Email mövcud deyil'}
                  </Typography>
                </Box>
                
                <Box sx={{ width: '100%', mt: 1 }}>
                  <input
                    accept="image/*"
                    id="avatar-upload"
                    type="file"
                    hidden
                    onChange={handleFileChange}
                  />
                  <label htmlFor="avatar-upload">
                    <Button
                      component="span"
                      variant="contained"
                      color="primary"
                      startIcon={<PhotoCamera />}
                      fullWidth
                      sx={{ 
                        mb: 2,
                        borderRadius: 2,
                        py: 1,
                        background: darkMode 
                          ? 'linear-gradient(45deg, #9c27b0 0%, #673ab7 100%)'
                          : 'linear-gradient(45deg, #3f51b5 0%, #673ab7 100%)',
                        boxShadow: darkMode 
                          ? '0 4px 20px rgba(156, 39, 176, 0.3)'
                          : '0 4px 20px rgba(63, 81, 181, 0.3)',
                      }}
                    >
                      Profil şəkli yüklə
                    </Button>
                  </label>
                  
                  {profileData?.avatar && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      fullWidth
                      onClick={deleteAvatar}
                      sx={{ borderRadius: 2, py: 1 }}
                    >
                      Şəkli sil
                    </Button>
                  )}
                </Box>
              </>
            )}
          </Paper>
        </Grid>
        
        {/* İzleme Listesi İstatistikleri */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 3,
              background: darkMode 
                ? 'rgba(30, 30, 40, 0.8)'
                : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              boxShadow: darkMode 
                ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              height: '100%',
            }}
          >
            <Typography 
              variant="h5" 
              gutterBottom
              sx={{ 
                color: darkMode ? '#bb86fc' : '#3f51b5',
                fontWeight: 'bold',
                mb: 3
              }}
            >
              İzləmə siyahısı statistikası
            </Typography>
            
            {loading ? (
              <>
                <Skeleton variant="rectangular" height={70} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={70} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} />
              </>
            ) : (
              <Box>
                <Box 
                  sx={{ 
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: darkMode ? 'rgba(244, 143, 177, 0.15)' : 'rgba(244, 143, 177, 0.1)',
                    p: 2,
                    borderRadius: 2,
                    mb: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
                    <VisibilityIcon 
                      sx={{ 
                        color: '#f48fb1',
                        mr: 2,
                        fontSize: 32
                      }} 
                    />
                    <Box>
                      <Typography variant="h6">İzləmək istədiklərim</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Gələcəkdə izləmək üçün seçilmiş filmlər
                      </Typography>
                    </Box>
                  </Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#f48fb1',
                      ml: { xs: 0, sm: 2 }
                    }}
                  >
                    {profileData?.watchlist.watchlist || 0}
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: darkMode ? 'rgba(129, 199, 132, 0.15)' : 'rgba(129, 199, 132, 0.1)',
                    p: 2,
                    borderRadius: 2,
                    mb: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
                    <PlayArrowIcon 
                      sx={{ 
                        color: '#81c784',
                        mr: 2,
                        fontSize: 32
                      }} 
                    />
                    <Box>
                      <Typography variant="h6">İzləməkdə olduğum</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hal-hazırda izlənilən filmlər
                      </Typography>
                    </Box>
                  </Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#81c784',
                      ml: { xs: 0, sm: 2 }
                    }}
                  >
                    {profileData?.watchlist.watching || 0}
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: darkMode ? 'rgba(144, 202, 249, 0.15)' : 'rgba(144, 202, 249, 0.1)',
                    p: 2,
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
                    <CheckIcon 
                      sx={{ 
                        color: '#90caf9',
                        mr: 2,
                        fontSize: 32
                      }} 
                    />
                    <Box>
                      <Typography variant="h6">İzlədiklərim</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Artıq izlənilmiş filmlər
                      </Typography>
                    </Box>
                  </Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#90caf9',
                      ml: { xs: 0, sm: 2 }
                    }}
                  >
                    {profileData?.watchlist.watched || 0}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Resim Kırpma Modalı */}
      <Dialog 
        open={openCropModal} 
        onClose={() => setOpenCropModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>Profil şəklinizi kəsin</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ position: 'relative', height: 300, mb: 3 }}>
            {selectedFile && (
              <Crop
                image={selectedFile}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </Box>
          <Box sx={{ px: 1 }}>
            <Typography gutterBottom>Böyütmə</Typography>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e, newValue) => setZoom(newValue as number)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCropModal(false)}>İmtina</Button>
          <Button 
            onClick={uploadCroppedImage} 
            variant="contained" 
            disabled={avatarLoading}
          >
            {avatarLoading ? 'Yüklənir...' : 'Şəkli saxla'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 