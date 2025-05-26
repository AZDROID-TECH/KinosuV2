import { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Grid,
  Avatar, 
  Button, 
  Divider, 
  Skeleton, 
  CircularProgress,
  Input,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  useTheme as useMuiTheme,
  alpha
} from '@mui/material';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import PersonIcon from '@mui/icons-material/Person';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EmailIcon from '@mui/icons-material/Email';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import EditIcon from '@mui/icons-material/Edit';
import LockResetIcon from '@mui/icons-material/LockReset';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import dayjs from 'dayjs';
import { formatDate } from '../utils/movieHelpers';
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from '../utils/toastHelper';

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
  email: string | null;
  avatar_url: string | null;
  createdAt: string;
  watchlist?: {
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
  const { username, refreshProfile, updateAvatar, userId } = useAuth();
  
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

  // Şifrə görünürlüyü üçün state'lər
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Şifrə inputları üçün state'lər
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

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
      showSuccessToast('Profil şəkli uğurla yeniləndi.');
    } catch (err) {
      console.error('Avatar yükləmə xətası:', err);
      setError('Avatar yükləmə zamanı xəta baş verdi');
      showErrorToast('Avatar yüklənərkən xəta baş verdi.');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Avatar'ı sil (Custom Toast ilə)
  const deleteAvatar = async () => {
    let confirmationToastId: number | null = null;

    const performDelete = async () => {
      try {
        setAvatarLoading(true);
        await userAPI.deleteAvatar();
        updateAvatar(null);
        await loadProfile();
        await refreshProfile();
        showSuccessToast('Avatar uğurla silindi.');
      } catch (err) {
        console.error('Avatar silmə xətası:', err);
        setError('Avatar silmə zamanı xəta baş verdi');
        showErrorToast('Avatar silinərkən xəta baş verdi.');
      } finally {
        setAvatarLoading(false);
      }
    };

    // Custom confirmation toast (uyğun bir dialog ile)
    // Burada react-toastify'nin custom dialogunu kaldırıyoruz, isterseniz modal ile özelleştirebilirsiniz.
    if (window.confirm('Avatarınızı silmək istədiyinizə əminsinizmi?')) {
      performDelete();
    }
  };

  // Şifrə dəyişdirmə funksiyası
  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordLoading(true);
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      showErrorToast('Bütün şifrə sahələrini doldurun.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorToast('Yeni şifrələr uyğun gəlmir.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      showErrorToast('Yeni şifrə ən az 6 simvol olmalıdır.');
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await userAPI.changePassword({
        currentPassword,
        newPassword,
      });
      showSuccessToast(response.message || 'Şifrə uğurla dəyişdirildi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Şifrə dəyişdirmə xətası:', err);
      const errorMessage = err.error || 'Şifrə dəyişdirilərkən xəta baş verdi.';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Şifrə görünürlüyünü dəyişdirən funksiyalar
  const handleClickShowPassword = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter((show) => !show);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Sol Panel: Avatar ve Bilgiler */}
          <Grid item xs={12} md={5}>
            <Paper 
              elevation={0}
              sx={{
                width: '100%', 
                p: 3,
                borderRadius: 3,
                textAlign: 'center',
                background: darkMode ? alpha(muiTheme.palette.grey[900], 0.5) : alpha(muiTheme.palette.primary.light, 0.05),
                border: `1px solid ${muiTheme.palette.divider}`,
                position: 'relative',
                height: '100%'
              }}
            >
              <Stack spacing={2} alignItems="center">
                <Skeleton variant="circular" width={160} height={160} />
                <Skeleton variant="text" width="40%" height={40} />
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="rectangular" width="60%" height={32} sx={{ borderRadius: 2 }} />
              </Stack>
            </Paper>
          </Grid>
          {/* Sağ Panel: Hesap Ayarları */}
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ width: '100%', p: 2.5, borderRadius: 3, border: `1px solid ${muiTheme.palette.divider}`, height: '100%' }}>
              <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Skeleton variant="rectangular" width={140} height={40} sx={{ borderRadius: 2 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>
          {/* İstatistik Kutuları */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ width: '100%', p: 2.5, borderRadius: 3, border: `1px solid ${muiTheme.palette.divider}` }}>
              <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} divider={<Divider orientation="vertical" flexItem />} justifyContent="space-around">
                <Box sx={{ textAlign: 'center' }}>
                  <Skeleton variant="text" width={60} height={40} sx={{ mx: 'auto' }} />
                  <Skeleton variant="text" width={80} height={24} sx={{ mx: 'auto' }} />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Skeleton variant="text" width={60} height={40} sx={{ mx: 'auto' }} />
                  <Skeleton variant="text" width={80} height={24} sx={{ mx: 'auto' }} />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Skeleton variant="text" width={60} height={40} sx={{ mx: 'auto' }} />
                  <Skeleton variant="text" width={80} height={24} sx={{ mx: 'auto' }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !profileData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 3, 
            textAlign: 'center',
            bgcolor: alpha(muiTheme.palette.error.light, 0.1)
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            {error || 'Profil məlumatları tapılmadı'}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Profil məlumatlarınızı yükləyərkən problem yarandı. Zəhmət olmasa daha sonra yenidən cəhd edin.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 1.5,
            mb: 3, 
            bgcolor: alpha(muiTheme.palette.error.main, 0.1), 
            color: muiTheme.palette.error.dark,
            border: `1px solid ${alpha(muiTheme.palette.error.main, 0.3)}`,
            borderRadius: 2,
            textAlign: 'center'
          }}
        >
          <Typography variant="body2">{error}</Typography>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper 
            elevation={0}
            sx={{
              width: '100%', 
              p: 3,
              borderRadius: 3,
              textAlign: 'center',
              background: darkMode ? alpha(muiTheme.palette.grey[900], 0.5) : alpha(muiTheme.palette.primary.light, 0.05),
              border: `1px solid ${muiTheme.palette.divider}`,
              position: 'relative',
              height: '100%'
            }}
          >
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 1 }}>
                  <Avatar
                src={profileData.avatar_url || undefined}
                alt={profileData.username}
                    sx={{
                  width: 160, 
                  height: 160, 
                  border: `4px solid ${muiTheme.palette.background.paper}`,
                  boxShadow: `0 6px 20px ${alpha(muiTheme.palette.common.black, 0.15)}`,
                  mx: 'auto'
                }}
              >
                {!profileData.avatar_url && <PersonIcon sx={{ fontSize: 90 }} />}
                  </Avatar>
                  {avatarLoading && (
                  <CircularProgress 
                    size={170} 
                    thickness={2} 
                    sx={{ position: 'absolute', top: -5, left: -5, zIndex: 1, color: muiTheme.palette.primary.light }} 
                  />
                  )}
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex',
                justifyContent: 'center', 
                    gap: 1,
                mb: 2,
                flexWrap: 'wrap'
              }}
            >
              {/* Dəyişdir Düyməsi (Standart input ilə) */}
                    <Button
                      variant="contained"
                      color="primary"
                size="small"
                component="label" // Input'u trigger etmək üçün label kimi davranır
                startIcon={<PhotoCamera fontSize="inherit" />}
                disabled={avatarLoading}
                htmlFor="avatar-upload-input" // Input'a bağlamaq üçün
              >
                Dəyişdir
                {/* Standart HTML input, görünməz */}
                <input 
                  type="file"
                  accept="image/*"
                  id="avatar-upload-input"
                  hidden // Və ya style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={avatarLoading}
                />
                    </Button>
                  
              {profileData.avatar_url && (
                    <Button
                      variant="outlined"
                  size="small"
                      color="error"
                  startIcon={<DeleteIcon fontSize="inherit" />}
                      onClick={deleteAvatar}
                  disabled={avatarLoading}
                    >
                  {avatarLoading ? <CircularProgress size={16} color="inherit" /> : 'Sil'}
                    </Button>
                  )}
                </Box>

            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 0.5 }}>
              {profileData.username}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <EmailIcon fontSize="inherit" sx={{ mr: 0.5, opacity: 0.7 }} /> {profileData.email}
            </Typography>
            <Chip 
              icon={<CalendarMonthIcon fontSize="small" />} 
              label={`Üzv: ${formatDate(profileData.createdAt)}`}
              size="small"
              variant="filled"
              color="secondary"
              sx={{ 
                bgcolor: darkMode ? alpha(muiTheme.palette.secondary.dark, 0.3) : alpha(muiTheme.palette.secondary.light, 0.3),
                color: darkMode ? muiTheme.palette.secondary.light : muiTheme.palette.secondary.dark,
                border: 'none',
                fontSize: '0.75rem'
              }}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={7}>
           <Paper elevation={0} sx={{ width: '100%', p: 2.5, borderRadius: 3, border: `1px solid ${muiTheme.palette.divider}`, height: '100%' }}>
             <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>Hesab Ayarları</Typography>
             
             <Stack spacing={2} component="form" noValidate autoComplete="off" onSubmit={handleChangePassword}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                  <LockResetIcon sx={{ mr: 1, opacity: 0.8 }} /> Şifrəni Dəyişdir
                </Typography>
                <TextField
                  type={showCurrentPassword ? 'text' : 'password'}
                  label="Mövcud Şifrə"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={passwordLoading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => handleClickShowPassword(setShowCurrentPassword)}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          disabled={passwordLoading}
                        >
                          {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  type={showNewPassword ? 'text' : 'password'}
                  label="Yeni Şifrə"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={passwordLoading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => handleClickShowPassword(setShowNewPassword)}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          disabled={passwordLoading}
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                   type={showConfirmPassword ? 'text' : 'password'}
                   label="Yeni Şifrəni Təsdiqlə"
                   variant="outlined"
                   size="small"
                   fullWidth
                   value={confirmPassword}
                   onChange={(e) => setConfirmPassword(e.target.value)}
                   disabled={passwordLoading}
                   InputProps={{
                     endAdornment: (
                       <InputAdornment position="end">
                         <IconButton
                           onClick={() => handleClickShowPassword(setShowConfirmPassword)}
                           onMouseDown={handleMouseDownPassword}
                           edge="end"
                           disabled={passwordLoading}
                         >
                           {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                         </IconButton>
                       </InputAdornment>
                     ),
                   }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    sx={{ mt: 1, position: 'relative' }}
                  >
                    {passwordLoading ? <CircularProgress size={24} sx={{ color: 'inherit', position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px' }} /> : 'Şifrəni Yenilə'}
                  </Button>
                </Box>
             </Stack>
          </Paper>
        </Grid>

        {profileData.watchlist && (
           <Grid item xs={12}>
             <Paper elevation={0} sx={{ width: '100%', p: 2.5, borderRadius: 3, border: `1px solid ${muiTheme.palette.divider}` }}>
               <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>İzləmə Statistikası</Typography>
               <Stack 
                 direction={{ xs: 'column', sm: 'row' }}
                 spacing={2} 
                 divider={<Divider orientation="vertical" flexItem />}
                 justifyContent="space-around"
               >
                 <Box sx={{ textAlign: 'center' }}>
                   <Typography variant="h4" sx={{ color: muiTheme.palette.info.main, fontWeight: 'bold' }}>
                     {profileData.watchlist.watchlist ?? 0}
                   </Typography>
                   <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <WatchLaterIcon fontSize="inherit" sx={{ mr: 0.5 }} /> Siyahıda
                      </Typography>
                    </Box>
                 <Box sx={{ textAlign: 'center' }}>
                   <Typography variant="h4" sx={{ color: muiTheme.palette.warning.main, fontWeight: 'bold' }}>
                     {profileData.watchlist.watching ?? 0}
                   </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <VisibilityIcon fontSize="inherit" sx={{ mr: 0.5 }} /> İzlənilir
                   </Typography>
                  </Box>
                 <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: muiTheme.palette.success.main, fontWeight: 'bold' }}>
                     {profileData.watchlist.watched ?? 0}
                   </Typography>
                   <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <CheckCircleIcon fontSize="inherit" sx={{ mr: 0.5 }} /> İzlənildi
                  </Typography>
                </Box>
               </Stack>
          </Paper>
        </Grid>
        )}
      </Grid>
      
      <Dialog open={openCropModal} onClose={() => setOpenCropModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Profil Şəklini Kırp</DialogTitle>
        <DialogContent sx={{ position: 'relative', height: 400 }}>
            {selectedFile && (
              <Crop
                image={selectedFile}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              cropShape="round"
              showGrid={false}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', p: 2 }}>
           <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
             <Typography sx={{ mr: 2 }}>Yaxınlaşdır:</Typography>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
                aria-labelledby="Zoom"
                onChange={(e, zoom) => setZoom(zoom as number)}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
             <Button onClick={() => setOpenCropModal(false)}>Ləğv et</Button>
          <Button 
            onClick={uploadCroppedImage} 
            variant="contained" 
                disabled={avatarLoading || !croppedAreaPixels}
          >
               {avatarLoading ? <CircularProgress size={24} /> : 'Yadda Saxla'}
          </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 