import React, { useState, useEffect, useMemo } from 'react';
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
  Badge,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { userAPI } from '../services/api';
import { formatDate } from '../utils/movieHelpers';
import { LocalMovies, Visibility, CheckCircle, CalendarMonth, Person, PersonAdd, PersonRemove } from '@mui/icons-material';
import MovieIcon from '@mui/icons-material/Movie';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import { keyframes } from '@mui/system';
import { useAuth } from '../context/AuthContext';
import { useFriends, FriendshipStatusResponse } from '../context/FriendContext';
import { showSuccessToast, showErrorToast } from '../utils/toastHelper';
import StatusAvatar from '../components/Common/StatusAvatar';
import { useSocketContext } from '../context/SocketContext';

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
  const { isLoggedIn, userId: loggedInUserId } = useAuth();
  const { checkFriendshipStatus, sendFriendRequest, removeFriend } = useFriends();
  const { isUserOnline, lastSeen, formatLastSeen, requestUserLastSeen } = useSocketContext();
  
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [currentSort, setCurrentSort] = useState<string>('rating');
  const [visibleMovieCount, setVisibleMovieCount] = useState<number>(6);
  const [profileLastSeen, setProfileLastSeen] = useState<Date | null>(null);

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

  useEffect(() => {
    const checkStatus = async () => {
      if (!isLoggedIn || !profile || profile.id === loggedInUserId) {
        return;
      }
      
      setStatusLoading(true);
      try {
        const status = await checkFriendshipStatus(profile.id);
        setFriendshipStatus(status);
      } catch (error) {
        console.error('Dostluq durumu yoxlanılarkən xəta:', error);
      } finally {
        setStatusLoading(false);
      }
    };
    
    checkStatus();
  }, [isLoggedIn, profile, loggedInUserId, checkFriendshipStatus]);

  // Profil yüklendikten sonra, son görülme zamanını bir kez iste
  useEffect(() => {
    if (profile && !isUserOnline(profile.id)) {
      requestUserLastSeen(profile.id);
    }
  }, [profile, requestUserLastSeen, isUserOnline]);

  // Son görülme zamanını izle ve state'e kaydet
  useEffect(() => {
    if (profile) {
      setProfileLastSeen(lastSeen(profile.id));
    }
  }, [profile, lastSeen]);

  const handleSendFriendRequest = async () => {
    if (!profile) return;
    
    setActionLoading(true);
    try {
      await sendFriendRequest(profile.id);
      const status = await checkFriendshipStatus(profile.id);
      setFriendshipStatus(status);
    } catch (error) {
      console.error('Dostluq istəyi göndərilməsi zamanı xəta:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!profile) return;
    
    setActionLoading(true);
    try {
      await removeFriend(profile.id);
      const status = await checkFriendshipStatus(profile.id);
      setFriendshipStatus(status);
      showSuccessToast('Dostluq əlaqəsi silindi');
    } catch (error) {
      console.error('Dostluq əlaqəsi silinərkən xəta:', error);
      showErrorToast('Dostluq əlaqəsi silinə bilmədi');
    } finally {
      setActionLoading(false);
    }
  };

  // Arkadaşlık durumuna göre butonları render et
  const renderFriendshipButtons = () => {
    if (!friendshipStatus) return null;

    if (statusLoading) {
      return <CircularProgress size={24} />;
    }

    if (friendshipStatus.status === 'pending') {
      if (friendshipStatus.message.includes('göndərilmiş')) {
        return (
          <Button
            variant="outlined"
            fullWidth
            color="warning"
            startIcon={<i className="bx bx-time"></i>}
            disabled
          >
            İstək göndərildi
          </Button>
        );
      } else {
        // Gelen istekleri kabul/reddetme butonları burada olabilir
        return null;
      }
    }

    if (friendshipStatus.status === 'accepted') {
      return (
        <Button
          variant="outlined"
          fullWidth
          color="error"
          startIcon={<PersonRemove />}
          disabled={actionLoading}
          onClick={handleRemoveFriend}
        >
          {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Dostluqdan Çıxar'}
        </Button>
      );
    }

    return (
      <Button
        variant="contained"
        fullWidth
        color="primary"
        startIcon={<PersonAdd />}
        disabled={actionLoading}
        onClick={handleSendFriendRequest}
      >
        {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Dost Əlavə Et'}
      </Button>
    );
  };

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

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = (filter?: string) => {
    if (filter) {
      setCurrentFilter(filter);
    }
    setFilterAnchorEl(null);
  };
  
  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };
  
  const handleSortClose = (sort?: string) => {
    if (sort) {
      setCurrentSort(sort);
    }
    setSortAnchorEl(null);
  };
  
  const getFilteredMovies = () => {
    if (!profile || !profile.topRatedMovies) return [];
    
    if (currentFilter === 'all') return profile.topRatedMovies;
    
    return profile.topRatedMovies.filter(movie => movie.status === currentFilter);
  };
  
  const getSortedMovies = () => {
    const filteredMovies = getFilteredMovies();
    
    switch (currentSort) {
      case 'rating':
        return [...filteredMovies].sort((a, b) => b.user_rating - a.user_rating);
      case 'imdb':
        return [...filteredMovies].sort((a, b) => b.imdb_rating - a.imdb_rating);
      case 'date':
        return [...filteredMovies].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      default:
        return filteredMovies;
    }
  };
  
  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case 'all': return 'Bütün Filmlər';
      case 'watchlist': return 'İzləməli';
      case 'watching': return 'İzləyirəm';
      case 'watched': return 'İzlədim';
      default: return 'Filmlər';
    }
  };
  
  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'rating': return 'İstifadəçi Xalı';
      case 'imdb': return 'IMDb Xalı';
      case 'date': return 'Tarix';
      default: return 'Sıralama';
    }
  };

  const handleLoadMore = () => {
    setVisibleMovieCount(prevCount => prevCount + 3);
  };

  // Kullanıcı profil gösterimi
  const renderProfile = () => {
    if (!profile) return null;

  return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 2,
              bgcolor: darkMode ? alpha(materialTheme.palette.background.paper, 0.6) : materialTheme.palette.background.paper,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ position: 'relative', mb: 2 }}>
                <StatusAvatar
                  src={profile.avatar || undefined}
                  alt={profile.username}
                  isOnline={isUserOnline(profile.id)}
                  size={120}
                  sx={{
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    border: `4px solid ${materialTheme.palette.background.paper}`,
                  }}
                />
              </Box>
              
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {profile.username}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 2 }}>
                {isUserOnline(profile.id) ? (
                  <Chip 
                    label="İndi onlayn"
                    color="success"
                    size="small"
                    sx={{ 
                      fontWeight: 500,
                      height: 24,
                      px: 1,
                      '& .MuiChip-label': { px: 1 },
                      animation: `${pulseAnimation} 2s infinite`
                    }}
                  />
                ) : (
                  <Chip 
                    label={`${formatLastSeen(profileLastSeen)} aktiv idi`}
                    color="default"
                    size="small"
                    sx={{ 
                      fontWeight: 500,
                      height: 24,
                      px: 1,
                      color: 'text.secondary',
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                )}
              
                <Chip 
                  label={`Üzv: ${formatDate(profile.createdAt)}`}
                  variant="outlined" 
                  size="small"
                  icon={<CalendarMonth fontSize="small" />}
                  sx={{ 
                    borderColor: alpha(materialTheme.palette.divider, 0.6),
                    px: 1
                  }}
                />
              </Box>
              
              {isLoggedIn && profile.id !== loggedInUserId && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  {renderFriendshipButtons()}
                  </Box>
              )}
              
              <Divider sx={{ width: '100%', my: 3 }} />
              
              <Stack spacing={2} width="100%">
                <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                  Film Statistikaları
                </Typography>
                
                {/* Film istatistikleri */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">
                      {profile.stats.total || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ümumi
                    </Typography>
                    </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">
                      {profile.stats.watchlist || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      İzləməli
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">
                      {profile.stats.watching || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      İzləyirəm
                    </Typography>
                    </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">
                      {profile.stats.watched || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      İzlədim
                    </Typography>
                  </Box>
                  </Box>
                </Stack>
            </Box>
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
          
          {/* En Yüksek Puanlı Filmler -> İzleyicinin film zevki */}
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Typography variant="h6" sx={{
                position: 'relative',
                display: 'inline-block',
                mb: { xs: 2, sm: 0 },
                textAlign: 'left',
                width: { xs: '100%', sm: 'auto' },
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
                  İstifadəçinin film siyahısı
              </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                  <Tooltip title="Filtr">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<FilterListIcon />}
                      onClick={handleFilterClick}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        borderColor: alpha(materialTheme.palette.primary.main, 0.5)
                      }}
                    >
                      {getFilterLabel(currentFilter)}
                    </Button>
                  </Tooltip>
                  
                  <Menu
                    anchorEl={filterAnchorEl}
                    open={Boolean(filterAnchorEl)}
                    onClose={() => handleFilterClose()}
                  >
                    <MenuItem onClick={() => handleFilterClose('all')}>Bütün Filmlər</MenuItem>
                    <MenuItem onClick={() => handleFilterClose('watchlist')}>İzləməli</MenuItem>
                    <MenuItem onClick={() => handleFilterClose('watching')}>İzləyirəm</MenuItem>
                    <MenuItem onClick={() => handleFilterClose('watched')}>İzlədim</MenuItem>
                  </Menu>
                  
                  <Tooltip title="Sıralama">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SortIcon />}
                      onClick={handleSortClick}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        borderColor: alpha(materialTheme.palette.primary.main, 0.5)
                      }}
                    >
                      {getSortLabel(currentSort)}
                    </Button>
                  </Tooltip>
                  
                  <Menu
                    anchorEl={sortAnchorEl}
                    open={Boolean(sortAnchorEl)}
                    onClose={() => handleSortClose()}
                  >
                    <MenuItem onClick={() => handleSortClose('rating')}>İstifadəçi Xalı</MenuItem>
                    <MenuItem onClick={() => handleSortClose('imdb')}>IMDb Xalı</MenuItem>
                    <MenuItem onClick={() => handleSortClose('date')}>Tarix</MenuItem>
                  </Menu>
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                {getSortedMovies().slice(0, visibleMovieCount).map((movie, index) => (
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
              
              {getSortedMovies().length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    {currentFilter === 'all' 
                      ? 'İstifadəçi film əlavə etməyib.' 
                      : `İstifadəçinin "${getFilterLabel(currentFilter)}" statusunda filmi yoxdur.`}
                  </Typography>
                </Box>
              )}
              
              {getSortedMovies().length > visibleMovieCount && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleLoadMore}
                    size="small"
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                      px: 3
                    }}
                  >
                    Daha çox
                  </Button>
                </Box>
              )}
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
                      İstifadəçinin sosial film platforması üçün izləmə cədvəlini görə biləcəksiniz.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
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
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: darkMode ? alpha(materialTheme.palette.background.paper, 0.6) : materialTheme.palette.background.paper,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => navigate(-1)}
            sx={{ mt: 2 }}
          >
            Geri qayıt
          </Button>
        </Paper>
      ) : (
        renderProfile()
      )}
    </Container>
  );
};

export default UserProfilePage; 