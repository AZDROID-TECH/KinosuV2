import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Avatar, 
  Grid, 
  Divider, 
  Chip,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Skeleton,
  useTheme,
  alpha,
  Rating,
  CircularProgress,
  Badge
} from '@mui/material';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { userAPI } from '../services/api';
import { formatDate } from '../utils/movieHelpers';
import { LocalMovies, Visibility, CheckCircle, CalendarMonth, Person } from '@mui/icons-material';
import MovieIcon from '@mui/icons-material/Movie';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import { keyframes } from '@mui/system';

// Online durumu için pulse animasyon
const pulseAnimation = keyframes`
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 5px rgba(76, 175, 80, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
`;

const pulseAnimationRed = keyframes`
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 5px rgba(244, 67, 54, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
  }
`;

interface PublicUserProfile {
  id: number;
  username: string;
  avatar: string | null;
  createdAt: string;
  isOnline: boolean;
  stats: {
    watchlist: number;
    watching: number;
    watched: number;
    total: number;
  };
  latestMovie: {
    title: string;
    poster: string;
    imdb_rating: number;
    status: string;
    created_at: string;
  } | null;
  topRatedMovies: Array<{
    title: string;
    poster: string;
    imdb_rating: number;
    user_rating: number;
    status: string;
    created_at: string;
  }>;
}

/**
 * @az İstifadəçi Profil Səhifəsi
 * @desc İstifadəçi profilini görüntüləmək üçün açıq səhifə
 */
const UserProfilePage: React.FC = () => {
  const { userId, username } = useParams<{ userId?: string, username?: string }>();
  const navigate = useNavigate();
  const materialTheme = useTheme();
  const { darkMode } = useCustomTheme();
  
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let profileData: PublicUserProfile;
        
        if (userId) {
          profileData = await userAPI.getPublicProfile(userId);
        } else if (username) {
          profileData = await userAPI.getPublicProfileByUsername(username);
        } else {
          throw new Error('İstifadəçi ID\'si və ya istifadəçi adı tapılmadı');
        }
        
        setProfile(profileData);
      } catch (err: any) {
        console.error('İstifadəçi profili alınarkən xəta:', err);
        setError(err.response?.data?.error || err.error || 'İstifadəçi profili tapılmadı');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId, username]);

  // Film durumuna göre icon ve renk belirleme
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'watchlist':
        return { 
          icon: <WatchLaterIcon />, 
          label: 'İzləmə Siyahısında', 
          color: materialTheme.palette.info.main 
        };
      case 'watching':
        return { 
          icon: <VisibilityIcon />, 
          label: 'İzlənilir', 
          color: materialTheme.palette.warning.main 
        };
      case 'watched':
        return { 
          icon: <CheckCircleIcon />, 
          label: 'İzlənildi', 
          color: materialTheme.palette.success.main 
        };
      default:
        return { 
          icon: <MovieIcon />, 
          label: 'Bilinməyən', 
          color: materialTheme.palette.grey[500] 
        };
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Skeleton variant="circular" width={120} height={120} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="60%" height={36} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Skeleton variant="rectangular" height={120} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Skeleton variant="text" width="40%" height={36} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={100} />
            </Paper>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Skeleton variant="text" width="60%" height={36} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={240} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 3, 
            textAlign: 'center',
            bgcolor: alpha(materialTheme.palette.error.light, 0.1)
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            {error || 'İstifadəçi profili tapılmadı'}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Axtardığınız istifadəçi mövcud deyil və ya ona giriş icazəniz yoxdur.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Sol Panel - Profil Bilgileri */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              background: darkMode 
                ? alpha(materialTheme.palette.background.paper, 0.8)
                : alpha(materialTheme.palette.background.paper, 0.7),
              backdropFilter: 'blur(10px)'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Box
                    sx={{
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%',
                      bgcolor: profile.isOnline ? 'success.main' : 'error.main',
                      border: `2px solid ${materialTheme.palette.background.paper}`,
                      animation: profile.isOnline 
                        ? `${pulseAnimation} 2s infinite` 
                        : `${pulseAnimationRed} 2s infinite`
                    }}
                  />
                }
              >
                <Avatar
                  src={profile.avatar || undefined}
                  sx={{
                    width: 120,
                    height: 120,
                    mb: 2,
                    bgcolor: materialTheme.palette.primary.main,
                    boxShadow: `0 0 0 4px ${alpha(materialTheme.palette.primary.main, 0.2)}`
                  }}
                >
                  {!profile.avatar && <Person sx={{ fontSize: 60 }} />}
                </Avatar>
              </Badge>
              
              <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ 
                mt: 1,
                background: darkMode 
                  ? 'linear-gradient(45deg, #bb86fc 30%, #9c27b0 90%)' 
                  : 'linear-gradient(45deg, #3f51b5 30%, #9c27b0 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                fontSize: '1.6rem',
                letterSpacing: '0.5px'
              }}>
                {profile.username}
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'inline-block',
                    ml: 1,
                    color: profile.isOnline ? 'success.main' : 'text.secondary',
                    fontSize: '0.8rem',
                    fontWeight: 'normal',
                    WebkitTextFillColor: profile.isOnline ? '#4caf50' : '#9e9e9e',
                  }}
                >
                  ({profile.isOnline ? 'online' : 'offline'})
                </Box>
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ 
                mb: 1, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                backdropFilter: 'blur(4px)',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                bgcolor: alpha(materialTheme.palette.background.default, 0.3),
              }}>
                <CalendarMonth fontSize="small" />
                {formatDate(profile.createdAt)} tarixində qoşulub
              </Typography>
            </Box>
            
            <Divider sx={{ 
              my: 3,
              "&::before, &::after": {
                borderColor: darkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.2)",
              },
            }} />
            
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{
              position: 'relative',
              display: 'inline-block',
              mb: 2,
              "&:after": {
                content: '""',
                position: 'absolute',
                width: '40%',
                height: '3px',
                bottom: '-5px',
                left: 0,
                backgroundColor: darkMode ? '#bb86fc' : '#3f51b5',
                borderRadius: '2px',
              }
            }}>
              Film Statistikaları
            </Typography>
            
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WatchLaterIcon color="info" />
                  <Typography variant="body2">İzləmə Siyahısı</Typography>
                </Box>
                <Chip 
                  label={profile.stats.watchlist} 
                  size="small" 
                  color="info" 
                  variant="outlined" 
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VisibilityIcon color="warning" />
                  <Typography variant="body2">İzlənilir</Typography>
                </Box>
                <Chip 
                  label={profile.stats.watching} 
                  size="small" 
                  color="warning" 
                  variant="outlined" 
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="success" />
                  <Typography variant="body2">İzlənildi</Typography>
                </Box>
                <Chip 
                  label={profile.stats.watched} 
                  size="small" 
                  color="success" 
                  variant="outlined" 
                />
              </Box>
              
              <Divider />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MovieIcon color="secondary" />
                  <Typography variant="body1" fontWeight="bold">Ümumi</Typography>
                </Box>
                <Chip 
                  label={profile.stats.total} 
                  size="small" 
                  color="secondary" 
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Stack>
          </Paper>
        </Grid>
        
        {/* Sağ Panel - Son İzleme ve Aktiviteler */}
        <Grid item xs={12} md={8}>
          {/* Son Eklenen Film */}
          {profile.latestMovie && (
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: 3, 
                mb: 3,
                background: darkMode 
                  ? alpha(materialTheme.palette.background.paper, 0.8)
                  : alpha(materialTheme.palette.background.paper, 0.7),
                backdropFilter: 'blur(10px)'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{
                position: 'relative',
                display: 'inline-block',
                mb: 2,
                "&:after": {
                  content: '""',
                  position: 'absolute',
                  width: '30%',
                  height: '3px',
                  bottom: '-5px',
                  left: 0,
                  backgroundColor: darkMode ? '#bb86fc' : '#3f51b5',
                  borderRadius: '2px',
                }
              }}>
                Son Əlavə Edilən Film
              </Typography>
              <Card 
                sx={{ 
                  display: 'flex', 
                  borderRadius: 2,
                  border: `1px solid ${alpha(materialTheme.palette.divider, 0.1)}`,
                  boxShadow: `0 4px 12px ${alpha(materialTheme.palette.divider, 0.2)}`
                }}
              >
                <CardMedia
                  component="img"
                  sx={{ width: 120, objectFit: 'cover' }}
                  image={profile.latestMovie.poster}
                  alt={profile.latestMovie.title}
                />
                <CardContent sx={{ flex: '1 0 auto', py: 2 }}>
                  <Typography variant="h6" component="div">
                    {profile.latestMovie.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Rating 
                      value={profile.latestMovie.imdb_rating / 2} 
                      precision={0.5} 
                      readOnly 
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {profile.latestMovie.imdb_rating}/10
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {(() => {
                      const { icon, label, color } = getStatusInfo(profile.latestMovie.status);
                      return (
                        <Chip 
                          icon={icon}
                          label={label}
                          size="small"
                          sx={{ 
                            color: color,
                            bgcolor: alpha(color, 0.1),
                            borderColor: alpha(color, 0.3)
                          }}
                          variant="outlined"
                        />
                      );
                    })()}
                    
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(profile.latestMovie.created_at)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Paper>
          )}
          
          {/* En Yüksek Puanlı Filmler */}
          {profile.topRatedMovies && profile.topRatedMovies.length > 0 && (
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: 3,
                mb: 3,
                background: darkMode 
                  ? alpha(materialTheme.palette.background.paper, 0.8)
                  : alpha(materialTheme.palette.background.paper, 0.7),
                backdropFilter: 'blur(10px)'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{
                position: 'relative',
                display: 'inline-block',
                mb: 2,
                "&:after": {
                  content: '""',
                  position: 'absolute',
                  width: '30%',
                  height: '3px',
                  bottom: '-5px',
                  left: 0,
                  backgroundColor: darkMode ? '#bb86fc' : '#3f51b5',
                  borderRadius: '2px',
                }
              }}>
                Ən Yüksək Qiymətləndirilmiş Filmlər
              </Typography>
              
              <Grid container spacing={2}>
                {profile.topRatedMovies.map((movie, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card 
                      sx={{ 
                        display: 'flex',
                        height: '100%',
                        borderRadius: 2,
                        border: `1px solid ${alpha(materialTheme.palette.divider, 0.1)}`,
                        overflow: 'hidden',
                        boxShadow: `0 4px 8px ${alpha(materialTheme.palette.divider, 0.2)}`
                      }}
                    >
                      <CardMedia
                        component="img"
                        sx={{ width: 80, objectFit: 'cover' }}
                        image={movie.poster}
                        alt={movie.title}
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <CardContent sx={{ flex: '1 0 auto', py: 1.5, px: 2 }}>
                          <Typography 
                            variant="subtitle2" 
                            component="div"
                            sx={{
                              fontWeight: 'bold',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {movie.title}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                            <Rating 
                              value={movie.user_rating} 
                              readOnly 
                              size="small" 
                              precision={0.5}
                            />
                            <Chip
                              label={getStatusInfo(movie.status).label}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                height: 20,
                                fontSize: '0.625rem',
                                color: getStatusInfo(movie.status).color,
                                bgcolor: alpha(getStatusInfo(movie.status).color, 0.1),
                                borderColor: alpha(getStatusInfo(movie.status).color, 0.3)
                              }}
                            />
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            mt: 1,
                            fontSize: '0.75rem', 
                            color: 'text.secondary'
                          }}>
                            <Typography variant="caption">
                              IMDb: {movie.imdb_rating}/10
                            </Typography>
                            <Typography variant="caption">
                              {formatDate(movie.created_at)}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
          
          {/* Yakında eklenecek özellikler için bilgi kartı - Onlayn Status yerine başka öneri eklendi */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              background: darkMode 
                ? alpha(materialTheme.palette.background.paper, 0.8)
                : alpha(materialTheme.palette.background.paper, 0.7),
              backdropFilter: 'blur(10px)'
            }}
          >
            <Typography variant="h6" gutterBottom sx={{
              position: 'relative',
              display: 'inline-block',
              mb: 2,
              "&:after": {
                content: '""',
                position: 'absolute',
                width: '30%',
                height: '3px',
                bottom: '-5px',
                left: 0,
                backgroundColor: darkMode ? '#bb86fc' : '#3f51b5',
                borderRadius: '2px',
              }
            }}>
              Yakında Gələcək Xüsusiyyətlər
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ bgcolor: alpha(materialTheme.palette.info.main, 0.08), borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Film Müzakirələri
                    </Typography>
                    <Typography variant="body2">
                      İstifadəçinin filmlərlə bağlı yazdığı müzakirələri və rəylərini görəcəksiniz.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card sx={{ bgcolor: alpha(materialTheme.palette.success.main, 0.08), borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      İzləmə Cədvəli
                    </Typography>
                    <Typography variant="body2">
                      İstifadəçinin film və seriallar üçün izləmə cədvəlini görə biləcəksiniz.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserProfilePage; 