import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Grow,
  useTheme
} from '@mui/material';
import { SearchResult } from '../types/movie';

interface MovieCardSearchProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  searchResults: SearchResult[];
  onAddMovie: (movie: SearchResult) => void;
  isMovieInList: (imdbId: string) => boolean;
}

/**
 * @az Film Axtarış Kartı
 * @desc API axtarışı nəticələri üçün şaquli düzəndə gösterilən film kartı komponenti
 */
const MovieCardSearch: React.FC<MovieCardSearchProps> = ({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isLoading,
  searchResults,
  onAddMovie,
  isMovieInList
}) => {
  const theme = useTheme();

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="IMDb-də film axtar..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyPress={handleKeyPress}
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
          onClick={onSearch}
          disabled={isLoading}
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
          {isLoading ? (
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
                    {movie.Genre?.split(',').map(genre => {
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
                    onClick={() => onAddMovie(movie)}
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
    </>
  );
};

export default MovieCardSearch; 