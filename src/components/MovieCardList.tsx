import React, { useState, useCallback } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Box,
  Rating,
  Tooltip,
  Button,
  Grid,
  useTheme,
  useMediaQuery,
  Skeleton,
  Avatar,
  IconButton,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Movie, MovieData } from '../types/movie';
import { formatDate } from '../utils/movieHelpers';
import { useAuth } from '../context/AuthContext';

interface MovieCardListProps {
  movies: Movie[];
  isLoading: boolean;
  page: number;
  itemsPerPage: number;
  onUpdateMovie: (movieId: number, updates: Partial<MovieData>) => void;
  onDeleteMovie: (movieId: number) => void;
  skeletonCard: () => JSX.Element;
  isMobile: boolean;
}

/**
 * @az Film Siyahısı Kartı
 * @desc İstifadəçinin filmləri üçün yatay düzəndə gösterilən film kartı komponenti
 */
const MovieCardList: React.FC<MovieCardListProps> = ({
  movies,
  isLoading,
  page,
  itemsPerPage,
  onUpdateMovie,
  onDeleteMovie,
  skeletonCard: SkeletonCard,
  isMobile
}) => {
  const theme = useTheme();
  const { isLoggedIn } = useAuth();
  
  // Film puanını formatla (Keep this function)
  const formatRating = (rating?: number | null): string => {
    if (rating === null || rating === undefined) return "Reytinq yoxdur";
    return rating.toFixed(1);
  };

  // Paginated movies hesaplanır
  const paginatedMovies = movies.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <>
      <Grid container spacing={2}>
        {isLoading 
          ? (
            // Loading halında skeleton gösterilir
            Array.from(new Array(itemsPerPage)).map((_, index) => (
              <Grid item xs={12} sm={6} md={6} lg={4} key={`skeleton-${index}`}>
                <SkeletonCard />
              </Grid>
            ))
          ) 
          : (
            // Asıl film kartları yüklendikten sonra gösterilir
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
                      onDeleteMovie(movie.id);
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
                      transition: 'all 0.2s',
                      color: 'black',
                      zIndex: 2,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '#f44336';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = 'black';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <i className='bx bx-trash' style={{ fontSize: '18px' }}></i>
                  </button>

                  <RouterLink 
                    to={`/movie/${movie.imdb_id || movie.id}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <CardMedia
                      component="img"
                      sx={{
                        width: 120,
                        height: '100%',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                      image={movie.poster}
                      alt={movie.title}
                    />
                  </RouterLink>

                  <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <CardContent sx={{ p: 2, pb: 1 }}>
                      <RouterLink
                        to={`/movie/${movie.imdb_id || movie.id}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
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
                            }}
                          >
                            {movie.title}
                          </Typography>
                        </Tooltip>
                      </RouterLink>
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
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          mb: 1
                        }}
                      >
                        <i className='bx bx-time-five' style={{ fontSize: '14px' }}></i>
                        {formatDate(movie.created_at)}
                      </Typography>
                      <Rating
                        size="small"
                        value={movie.user_rating}
                        onChange={(event, newValue) => {
                          onUpdateMovie(movie.id, { user_rating: newValue || 0 });
                        }}
                      />
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0, mt: 'auto' }}>
                      <Box sx={{ display: 'flex', gap: 0.5, width: '100%' }}>
                        <Button
                          size="small"
                          variant={movie.status === 'watchlist' ? 'contained' : 'text'}
                          onClick={(e) => {
                            onUpdateMovie(movie.id, { status: 'watchlist' })
                          }}
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
                          onClick={(e) => {
                            onUpdateMovie(movie.id, { status: 'watching' })
                          }}
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
                          onClick={(e) => {
                            onUpdateMovie(movie.id, { status: 'watched' })
                          }}
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
    </>
  );
};

export default MovieCardList; 