import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
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
  Fade,
  Divider,
  Pagination,
  useMediaQuery,
  useTheme,
  Skeleton,
  Menu,
  MenuItem
} from '@mui/material';
import { movieAPI } from '../services/api';
import { Movie, SearchResult, MovieData } from '../types/movie';
import { sortMovies, formatDate, getSortLabel } from '../utils/movieHelpers';
import 'boxicons/css/boxicons.min.css';
import MovieCardList from '../components/MovieCardList';
import MovieCardSearch from '../components/MovieCardSearch';

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

  // Paginasiya edilmiş filmlər
  const paginatedMovies = useMemo(() => {
    return filteredMovies.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE
    );
  }, [filteredMovies, page, ITEMS_PER_PAGE]);

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

  // IMDb film axtarışı
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
    // Dialog kapandığında arama state'ini sıfırla
    setSearchResults([]);
    setImdbSearchQuery('');
  };

  // Siralama menüsü işlemleri
  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortSelect = (value: string) => {
    setSelectedSort(value);
    localStorage.setItem('selectedSort', value);
    handleSortClose();
    
    // State üzerinden sıralama (API isteği olmadan)
    setMovies(prevMovies => sortMovies([...prevMovies], value));
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Film liste durumunu kontrol et
  const isMovieInList = (imdbId: string) => {
    return movieImdbIdsSet.has(imdbId);
  };

  // Skeleton kart
  const SkeletonCard = () => (
    <Skeleton 
      variant="rectangular" 
      width="100%" 
      height={180} 
      sx={{ 
        borderRadius: 1, 
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
      }} 
    />
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          Filmlərim
        </Typography>
        <Button
          variant="contained"
          onClick={() => setOpenDialog(true)}
          className="add-movie-button"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: 'none',
            display: { xs: 'none', sm: 'flex' },
            '&:hover': {
              boxShadow: 'none',
              bgcolor: 'primary.dark',
            },
          }}
          startIcon={<i className='bx bx-plus'></i>}
        >
          Film Əlavə Et
        </Button>
      </Box>

      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
        }}
      >
        {/* Mobil görünüm için düzen */}
        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            flexDirection: 'column',
            width: '100%',
            gap: 2
          }}
        >
          {/* Arama kutusu - Mobil */}
        <TextField
            placeholder="Film axtar..."
          size="small"
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
                <i
                  className="bx bx-search"
                  style={{ fontSize: '20px', marginRight: '8px' }}
                ></i>
              ),
            }}
            sx={{
              width: '100%',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          {/* Filtreleme ve Sıralama - Mobil */}
      <Box sx={{ 
        display: 'flex', 
            width: '100%', 
        justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box sx={{ 
              width: 'calc(100% - 60px)', 
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              scrollbarWidth: 'none'
      }}>
      <Tabs
        value={status}
                onChange={(_, value) => setStatus(value)}
                variant="scrollable"
                scrollButtons={false}
          sx={{
                  minHeight: '40px',
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
                    minHeight: '40px',
                    py: 0,
                    px: 1,
                    minWidth: 0,
                  },
                  '& .MuiTabs-flexContainer': {
                    gap: 0.5
                  }
                }}
              >
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2">Hamısı</Typography>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2">İzləniləcək</Typography>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2">İzlənilir</Typography>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2">İzlənildi</Typography>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
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
            </Box>
            
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
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Masaüstü görünüm için Grid düzeni */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'grid' },
            gridTemplateColumns: '250px 1fr auto',
            width: '100%',
            alignItems: 'center',
          }}
        >
          {/* Sol Sütun: Arama Kutusu */}
          <Box>
            <TextField
              placeholder="Film axtar..."
              size="small"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <i
                    className="bx bx-search"
                    style={{ fontSize: '20px', marginRight: '8px' }}
                  ></i>
                ),
              }}
              sx={{
                width: 250,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          {/* Orta Sütun: Filtreleme Sekmeleri */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tabs
              value={status}
              onChange={(_, value) => setStatus(value)}
              centered
              sx={{
                minHeight: '40px',
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
                '& .MuiTab-root': {
                  minHeight: '40px',
                  py: 0,
                  px: 2,
                  minWidth: 100,
                },
              }}
      >
          <Tab 
            label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2">Hamısı</Typography>
                <Box
                  sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2">İzləniləcək</Typography>
                <Box
                  sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2">İzlənilir</Typography>
                <Box
                  sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2">İzlənildi</Typography>
                <Box
                  sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
          </Box>
        
          {/* Sağ Sütun: Sıralama Butonu */}
          <Box sx={{ justifySelf: 'end' }}>
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
                  fontWeight: 500
              }}
            >
              {getSortLabel(selectedSort)}
            </Typography>
          </Button>
          </Box>
        </Box>
      </Box>

      {/* Menu bileşeni - iki buttona da hizmet ediyor */}
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

      {/* MovieCardList komponenti */}
      <MovieCardList 
        movies={filteredMovies}
        isLoading={isMoviesLoading}
        page={page}
        itemsPerPage={ITEMS_PER_PAGE}
        onUpdateMovie={handleUpdateMovie}
        onDeleteMovie={handleDeleteMovie}
        skeletonCard={SkeletonCard}
        isMobile={isMobile}
        onAddMovieClick={() => setOpenDialog(true)}
      />

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
          {/* MovieCardSearch komponenti */}
          <MovieCardSearch
            searchQuery={imdbSearchQuery}
            onSearchQueryChange={setImdbSearchQuery}
            onSearch={handleImdbSearch}
            isLoading={loading}
            searchResults={searchResults}
            onAddMovie={handleAddMovie}
            isMovieInList={isMovieInList}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Dashboard; 