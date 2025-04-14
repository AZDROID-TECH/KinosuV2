import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Grid,
  Box,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Rating,
  InputAdornment,
  Fade,
  Grow,
  Menu,
  MenuItem,
  Divider,
  Pagination,
  Tooltip,
  useMediaQuery,
  useTheme,
  Skeleton,
} from '@mui/material';
import { movieAPI } from '../services/api';
import { Movie, SearchResult, MovieData } from '../types/movie';
import { sortMovies, formatDate, getSortLabel } from '../utils/movieHelpers';
import 'boxicons/css/boxicons.min.css';

/**
 * @az İdarə Paneli Səhifəsi
 * @desc İstifadəçinin daxil olduqdan sonra gördüyü əsas səhifə. Filmləri siyahılayır, axtarış və idarəetmə imkanları sunar.
 */
const Dashboard = () => {
  const { isLoggedIn } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [imdbSearchQuery, setImdbSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSort, setSelectedSort] = useState<string>(() => {
    return localStorage.getItem('selectedSort') || 'newest';
  });
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isMoviesLoading, setIsMoviesLoading] = useState(true);

  // 1. Filmləri filterləmək üçün useMemo istifadə et
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      // Başlıq yoxdursa və ya null deyilsə, boş bir string olaraq qəbul et
      const title = movie.title || ''; 
      const matchesSearch = title
        .toLowerCase()
        .includes(localSearchQuery.toLowerCase());
      const matchesStatus = status === 'all' ? true : movie.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [movies, localSearchQuery, status]);

  // 2. Mövcud filmlərin imdb_id-lərini Set-də saxlamaq üçün useMemo
  const movieImdbIdsSet = useMemo(() => new Set(movies.map(m => m.imdb_id)), [movies]);

  const fetchMovies = useCallback(async () => {
    setIsMoviesLoading(true);
    try {
      const data = await movieAPI.getMovies();
      const sortedMovies = sortMovies([...data], selectedSort);
      setMovies(sortedMovies);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setIsMoviesLoading(false);
    }
  }, [selectedSort]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchMovies();
    }
  }, [isLoggedIn, fetchMovies]);

  useEffect(() => {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    } else {
      const newViewportMeta = document.createElement('meta');
      newViewportMeta.name = 'viewport';
      newViewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(newViewportMeta);
    }
    
    return () => {
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, []);

  // IMDb film arama
  const handleImdbSearch = async () => {
    if (!imdbSearchQuery.trim()) return;

    setLoading(true);
    try {
      const data = await movieAPI.searchMovies(imdbSearchQuery);
      setSearchResults(data.Search || []);
    } catch (error) {
      console.error('Error searching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovie = async (movie: SearchResult) => {
    try {
      const movieData: MovieData = {
        title: movie.Title,
        imdb_id: movie.imdbID,
        poster: movie.Poster,
        imdb_rating: parseFloat(movie.imdbRating) || 0,
        status: 'watchlist',
        created_at: new Date().toISOString(),
        user_rating: 0
      };
      
      // API'den dönen yeni filmi al (ID'si ile birlikte)
      const newAddedMovie: Movie = await movieAPI.addMovie(movieData);
      
      // API cavabını logla
      console.log('Yeni əlavə edilmiş film API cavabı:', newAddedMovie);

      // Dönen objenin geçerli olup olmadığını kontrol et (en azından bir id'si olmalı)
      if (!newAddedMovie || typeof newAddedMovie.id === 'undefined') {
        console.error('API-dən etibarsız film obyekti qayıtdı:', newAddedMovie);
        // Burada istifadəçiyə xəta mesajı göstərmək olar
        return; // State'i güncellemeyi durdur
      }

      // State'i güvenli bir şekilde güncelle
      try {
      setMovies((prevMovies) => {
        const updatedList = [...prevMovies, newAddedMovie];
        return sortMovies(updatedList, selectedSort); // Sıralamayı uygula
      });
      } catch (stateUpdateError) {
        console.error('Film siyahısını yeniləyərkən xəta baş verdi:', stateUpdateError);
        // State güncelleme hatası durumunda belki kullanıcıya bilgi verilebilir
        // Veya belki de listeyi yeniden fetch etmek daha güvenli olabilir
        // fetchMovies(); 
      }

    } catch (error) {
      console.error('Film əlavə edərkən xəta baş verdi:', error);
      // Burada istifadəçiyə xəta mesajı göstərmək olar
    }
  };

  const handleUpdateMovie = async (
    movieId: number,
    updates: Partial<MovieData>
  ) => {
    // 1. Orijinal state'i yedekle (geri alma için)
    const originalMovies = [...movies];

    // 2. State'i iyimser olarak güncelle
    const optimisticMovies = movies.map((movie) =>
      movie.id === movieId ? { ...movie, ...updates } : movie
    );
    setMovies(optimisticMovies);

    try {
      // 3. API isteğini gönder
      // const updatedMovie = await movieAPI.updateMovie(movieId, updates); // Dönen veri şimdilik kullanılmıyor
      await movieAPI.updateMovie(movieId, updates); 
      
      // Başarılı olursa: UI zaten güncel, bir şey yapmaya gerek yok.
      // İsteğe bağlı: API'dan dönen `updatedMovie` verisi ile state'i teyit edebiliriz.
      // setMovies((prevMovies) => prevMovies.map(movie => 
      //   movie.id === movieId ? updatedMovie : movie
      // ));

    } catch (error) {
      console.error('Film yeniləmə zamanı xəta baş verdi (Optimistic Update Rollback):', error);
      // 4. Hata durumunda state'i geri al
      setMovies(originalMovies);
      // Kullanıcıya hata bildirimi eklenebilir (örn. toast notification)
      alert('Film yeniləmə zamanı bir xəta baş verdi. Dəyişikliklər geri alındı.');
    }
  };

  const handleDeleteMovie = async (movieId: number) => {
    try {
      await movieAPI.deleteMovie(movieId);
      setMovies((prevMovies) => prevMovies.filter((movie) => movie.id !== movieId));
    } catch (error) {
      console.error('Error deleting movie:', error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setImdbSearchQuery('');
    setSearchResults([]);
  };

  // 3. isMovieInList funksiyasını optimallaşdır və useCallback ilə sar
  const isMovieInList = useCallback((imdbId: string) => {
    return movieImdbIdsSet.has(imdbId);
  }, [movieImdbIdsSet]);

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortSelect = (value: string) => {
    setSelectedSort(value);
    localStorage.setItem('selectedSort', value);
    const sortedMovies = sortMovies([...movies], value);
    setMovies(sortedMovies);
    handleSortClose();
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Sayfalama üçün filmleri böl
  const paginatedMovies = filteredMovies.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Skeleton Card Component
  const SkeletonCard = () => (
    <Card sx={{ display: 'flex', height: '180px' }}>
      <Skeleton variant="rectangular" width={120} height={180} />
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, p: 2 }}>
        <Skeleton variant="text" sx={{ fontSize: '1rem', width: '80%', mb: 1 }} />
        <Skeleton variant="text" sx={{ fontSize: '0.8rem', width: '40%', mb: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" sx={{ fontSize: '0.7rem', width: '50%' }} />
      </Box>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <TextField
          placeholder="Əlavə edilmiş filmlərdə axtar..."
          variant="outlined"
          size="small"
          sx={{ flexGrow: 1, mr: 2 }}
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <i className='bx bx-search' style={{ fontSize: '20px' }}></i>
              </InputAdornment>
            ),
          }}
        />
        <button
          onClick={() => setOpenDialog(true)}
          className="add-button"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#1976d2',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <i className='bx bx-plus' style={{ fontSize: '24px' }}></i>
        </button>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
      <Tabs
        value={status}
        onChange={(_, newValue) => setStatus(newValue)}
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              minHeight: 48,
              transition: 'all 0.2s',
              '&:hover': {
                color: 'primary.main',
              },
            },
          }}
        variant="scrollable"
        scrollButtons="auto"
      >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Hamısı</span>
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  {movies.length}
                </Box>
              </Box>
            }
            value="all"
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>İzləniləcək</span>
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  {movies.filter(movie => movie.status === 'watchlist').length}
                </Box>
              </Box>
            }
            value="watchlist"
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>İzlənilir</span>
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  {movies.filter(movie => movie.status === 'watching').length}
                </Box>
              </Box>
            }
            value="watching"
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>İzlənildi</span>
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  {movies.filter(movie => movie.status === 'watched').length}
                </Box>
              </Box>
            }
            value="watched"
          />
        </Tabs>
        
        <Box>
          <Button
            onClick={handleSortClick}
            size="small"
            sx={{
              textTransform: 'none',
              color: 'text.primary',
              bgcolor: 'action.hover',
              borderRadius: 2,
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <i className='bx bx-sort-alt-2' style={{ fontSize: '18px' }}></i>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {getSortLabel(selectedSort)}
            </Typography>
          </Button>
          <Menu
            anchorEl={sortAnchorEl}
            open={Boolean(sortAnchorEl)}
            onClose={handleSortClose}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2,
                boxShadow: (theme) => 
                  theme.palette.mode === 'dark' 
                    ? '0 4px 12px rgba(0,0,0,0.5)' 
                    : '0 4px 12px rgba(0,0,0,0.1)',
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 1, py: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 0.5,
                  color: 'text.secondary',
                  fontWeight: 600,
                  display: 'block',
                }}
              >
                Əlavə edilmə tarixi
              </Typography>
              <MenuItem
                onClick={() => handleSortSelect('newest')}
                selected={selectedSort === 'newest'}
                sx={{
                  borderRadius: 1,
                  fontSize: '0.875rem',
                  minWidth: 200,
                }}
              >
                <i className='bx bx-sort-down' style={{ fontSize: '18px', marginRight: '8px' }}></i>
                Ən yeni əlavə edilən
              </MenuItem>
              <MenuItem
                onClick={() => handleSortSelect('oldest')}
                selected={selectedSort === 'oldest'}
                sx={{
                  borderRadius: 1,
                  fontSize: '0.875rem',
                }}
              >
                <i className='bx bx-sort-up' style={{ fontSize: '18px', marginRight: '8px' }}></i>
                Ən əvvəl əlavə edilən
              </MenuItem>
            </Box>

            <Divider sx={{ my: 0.5 }} />

            <Box sx={{ px: 1, py: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 0.5,
                  color: 'text.secondary',
                  fontWeight: 600,
                  display: 'block',
                }}
              >
                IMDb Reytinqi
              </Typography>
              <MenuItem
                onClick={() => handleSortSelect('rating_high')}
                selected={selectedSort === 'rating_high'}
                sx={{
                  borderRadius: 1,
                  fontSize: '0.875rem',
                }}
              >
                <i className='bx bx-sort-down' style={{ fontSize: '18px', marginRight: '8px' }}></i>
                Yüksəkdən aşağı
              </MenuItem>
              <MenuItem
                onClick={() => handleSortSelect('rating_low')}
                selected={selectedSort === 'rating_low'}
                sx={{
                  borderRadius: 1,
                  fontSize: '0.875rem',
                }}
              >
                <i className='bx bx-sort-up' style={{ fontSize: '18px', marginRight: '8px' }}></i>
                Aşağıdan yüksəyə
              </MenuItem>
            </Box>

            <Divider sx={{ my: 0.5 }} />

            <Box sx={{ px: 1, py: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 0.5,
                  color: 'text.secondary',
                  fontWeight: 600,
                  display: 'block',
                }}
              >
                Mənim Reytinqim
              </Typography>
              <MenuItem
                onClick={() => handleSortSelect('user_rating_high')}
                selected={selectedSort === 'user_rating_high'}
                sx={{
                  borderRadius: 1,
                  fontSize: '0.875rem',
                }}
              >
                <i className='bx bx-sort-down' style={{ fontSize: '18px', marginRight: '8px' }}></i>
                Yüksəkdən aşağı
              </MenuItem>
              <MenuItem
                onClick={() => handleSortSelect('user_rating_low')}
                selected={selectedSort === 'user_rating_low'}
                sx={{
                  borderRadius: 1,
                  fontSize: '0.875rem',
                }}
              >
                <i className='bx bx-sort-up' style={{ fontSize: '18px', marginRight: '8px' }}></i>
                Aşağıdan yüksəyə
              </MenuItem>
            </Box>
          </Menu>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {isMoviesLoading 
          ? (
            // Show skeletons while loading
            Array.from(new Array(ITEMS_PER_PAGE)).map((_, index) => (
              <Grid item xs={12} sm={6} md={6} lg={4} key={`skeleton-${index}`}>
                <SkeletonCard />
              </Grid>
            ))
          ) 
          : (
            // Show actual movie cards when loaded
            paginatedMovies.map((movie) => (
              <Grid item xs={12} sm={6} md={6} lg={4} key={movie.id}>
                <Card 
                  sx={{ 
                    display: 'flex',
                    height: '180px',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    },
                    position: 'relative',
                  }}
                >
                  <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMovie(movie.id);
                      }}
                    className="delete-button"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'white',
                      border: 'none',
                      borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <i className='bx bx-trash' style={{ fontSize: '18px' }}></i>
                  </button>
                  <CardMedia
                    component="img"
                    sx={{
                      width: 120,
                      objectFit: 'cover',
                    }}
                    image={movie.poster}
                    alt={movie.title}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <CardContent sx={{ flex: '1 0 auto', p: 2 }}>
                      <Tooltip 
                        title={movie.title}
                        placement="top"
                        enterDelay={isMobile ? 100 : 200}
                        enterNextDelay={isMobile ? 100 : 200}
                        enterTouchDelay={0}
                        leaveTouchDelay={3000}
                        arrow
                        PopperProps={{
                          sx: {
                            '& .MuiTooltip-tooltip': {
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                              boxShadow: theme.palette.mode === 'dark' 
                                ? '0 4px 8px rgba(0, 0, 0, 0.5)' 
                                : '0 4px 8px rgba(0, 0, 0, 0.15)',
                              p: 1,
                              borderRadius: 1,
                              fontSize: '0.875rem',
                              maxWidth: 300,
                            },
                            '& .MuiTooltip-arrow': {
                              color: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                            },
                          },
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 'bold',
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.2,
                            cursor: 'pointer',
                          }}
                        >
                          {movie.title}
                        </Typography>
                      </Tooltip>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          IMDb:
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 'bold', color: 'primary.main' }}
                        >
                          {movie.imdb_rating}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Rating
                          size="small"
                          value={movie.user_rating}
                          onChange={(_, newValue) =>
                            handleUpdateMovie(movie.id, { user_rating: newValue || 0 })
                          }
                        />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            color: 'text.secondary',
                            fontSize: '0.7rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          <i className='bx bx-time-five' style={{ fontSize: '14px' }}></i>
                          {formatDate(movie.created_at)}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.5,
                          width: '100%',
                        }}
                      >
                      <Button
                          size="small"
                          variant={movie.status === 'watchlist' ? 'contained' : 'text'}
                          onClick={() =>
                            handleUpdateMovie(movie.id, { status: 'watchlist' })
                          }
                        sx={{
                            minWidth: 0,
                            flex: 1,
                            fontSize: '0.7rem',
                            borderRadius: 1.5,
                            py: 0.5,
                          textTransform: 'none',
                          boxShadow: 'none',
                            transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: 'none',
                              bgcolor: movie.status === 'watchlist' ? 'primary.dark' : 'action.hover',
                            },
                            ...(movie.status === 'watchlist' && {
                              '&:hover': {
                                bgcolor: 'primary.dark',
                              },
                            }),
                        }}
                      >
                          İzləniləcək
                      </Button>
                      <Button
                          size="small"
                          variant={movie.status === 'watching' ? 'contained' : 'text'}
                          onClick={() =>
                            handleUpdateMovie(movie.id, { status: 'watching' })
                          }
                        sx={{
                            minWidth: 0,
                            flex: 1,
                            fontSize: '0.7rem',
                            borderRadius: 1.5,
                            py: 0.5,
                          textTransform: 'none',
                          boxShadow: 'none',
                            transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: 'none',
                              bgcolor: movie.status === 'watching' ? 'primary.dark' : 'action.hover',
                            },
                            ...(movie.status === 'watching' && {
                              '&:hover': {
                                bgcolor: 'primary.dark',
                              },
                            }),
                          }}
                        >
                          İzlənilir
                        </Button>
                        <Button
                          size="small"
                          variant={movie.status === 'watched' ? 'contained' : 'text'}
                          onClick={() =>
                            handleUpdateMovie(movie.id, { status: 'watched' })
                          }
                          sx={{
                            minWidth: 0,
                            flex: 1,
                            fontSize: '0.7rem',
                            borderRadius: 1.5,
                            py: 0.5,
                            textTransform: 'none',
                            boxShadow: 'none',
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: 'none',
                              bgcolor: movie.status === 'watched' ? 'primary.dark' : 'action.hover',
                            },
                            ...(movie.status === 'watched' && {
                              '&:hover': {
                                bgcolor: 'primary.dark',
                              },
                            }),
                        }}
                      >
                          İzlənildi
                      </Button>
                    </Box>
                  </CardActions>
                  </Box>
                </Card>
              </Grid>
            ))
          )
        }
      </Grid>

      {filteredMovies.length > ITEMS_PER_PAGE && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 4,
            mb: 2,
          }}
        >
          <Pagination
            count={Math.ceil(filteredMovies.length / ITEMS_PER_PAGE)}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                '&.Mui-selected': {
                  fontWeight: 'bold',
                },
              },
            }}
          />
        </Box>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        TransitionComponent={Fade}
        transitionDuration={300}
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            overflow: 'hidden',
            maxHeight: '90vh'
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className='bx bx-movie-play' style={{ fontSize: '24px' }}></i>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Film Axtar
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseDialog}
            size="small"
            sx={{
              color: 'text.secondary',
              transition: 'all 0.2s',
              '&:hover': {
                color: 'text.primary',
                transform: 'rotate(90deg)',
              },
            }}
          >
            <i className='bx bx-x' style={{ fontSize: '24px' }}></i>
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ 
          p: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          },
        }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="IMDb-də film axtar..."
              value={imdbSearchQuery}
              onChange={(e) => setImdbSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleImdbSearch();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className='bx bx-search' style={{ fontSize: '20px', color: 'text.secondary' }}></i>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    '& > fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleImdbSearch}
              disabled={loading}
              sx={{
                minWidth: 100,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                  bgcolor: 'primary.dark',
                },
              }}
            >
              {loading ? (
                <i className='bx bx-loader-alt bx-spin' ></i>
              ) : (
                'Axtar'
              )}
            </Button>
          </Box>

          {!searchResults.length && (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                py: 4,
                color: 'text.secondary'
              }}
            >
              <i className='bx bx-movie-play' style={{ fontSize: '48px' }}></i>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Yeni bir film axtarın
              </Typography>
              <Typography variant="caption" sx={{ textAlign: 'center', maxWidth: 300 }}>
                Film adını yazın və ya IMDb ID-sini daxil edin
              </Typography>
            </Box>
          )}

          <Grid container spacing={1.5}>
            {searchResults.map((movie, index) => (
              <Grow
                in={true}
                key={movie.imdbID}
                timeout={200 + index * 50}
              >
                <Grid item xs={6} sm={4} md={3}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => `0 4px 12px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'}`,
                      '& .movie-poster': {
                        transform: 'scale(1.05)',
                      },
                    },
                  }}
                >
                  <Box sx={{ position: 'relative', paddingTop: '130%', overflow: 'hidden' }}>
                    <CardMedia
                      component="img"
                      className="movie-poster"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                      }}
                      image={movie.Poster}
                      alt={movie.Title}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                        p: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        }}
                      >
                        <i className='bx bxs-star' style={{ color: '#ffd700' }}></i>
                        {movie.imdbRating}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'white',
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        }}
                      >
                        {movie.Year}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ p: 1.5, flexGrow: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.2,
                      }}
                    >
                      {movie.Title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {movie.Genre.split(',').map(genre => {
                        const genreMap: { [key: string]: string } = {
                          'Action': 'Fəaliyyət',
                          'Adventure': 'Macəra',
                          'Animation': 'Animasiya',
                          'Biography': 'Bioqrafiya',
                          'Comedy': 'Komediya',
                          'Crime': 'Cinayət',
                          'Documentary': 'Sənədli',
                          'Drama': 'Drama',
                          'Family': 'Ailə',
                          'Fantasy': 'Fantaziya',
                          'Film-Noir': 'Film-Noir',
                          'History': 'Tarix',
                          'Horror': 'Dəhşət',
                          'Music': 'Musiqi',
                          'Musical': 'Müzikal',
                          'Mystery': 'Sirr',
                          'Romance': 'Romantika',
                          'Sci-Fi': 'Elmi Fantastika',
                          'Sport': 'İdman',
                          'Thriller': 'Triller',
                          'War': 'Müharibə',
                          'Western': 'Vestern'
                        };
                        return genreMap[genre.trim()] || genre.trim();
                      }).join(' • ')}
                    </Typography>
                  </Box>
                  <CardActions sx={{ p: 1, pt: 0 }}>
                    <Button
                      fullWidth
                      size="small"
                      variant={isMovieInList(movie.imdbID) ? "outlined" : "contained"}
                      disabled={isMovieInList(movie.imdbID)}
                      onClick={() => handleAddMovie(movie)}
                      startIcon={isMovieInList(movie.imdbID) ? 
                        <i className='bx bx-check' ></i> : 
                        <i className='bx bx-plus' ></i>
                      }
                      sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                          boxShadow: 'none',
                          bgcolor: isMovieInList(movie.imdbID) ? 'transparent' : 'primary.dark',
                        },
                        ...(isMovieInList(movie.imdbID) && {
                          bgcolor: 'action.disabledBackground',
                          color: 'text.disabled',
                          borderColor: 'transparent',
                        }),
                      }}
                    >
                      {isMovieInList(movie.imdbID) ? 'Əlavə edilib' : 'Əlavə et'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              </Grow>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Dashboard; 