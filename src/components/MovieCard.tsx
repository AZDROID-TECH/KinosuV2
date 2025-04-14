import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  Box, 
  Rating,
  Chip,
  alpha,
  useTheme
} from '@mui/material';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/movieHelpers';
import PersonIcon from '@mui/icons-material/Person';

interface Movie {
  id: number;
  title: string;
  imdb_id: string;
  poster: string;
  imdb_rating: number;
  user_rating?: number;
  status: 'watchlist' | 'watching' | 'watched';
  created_at: string;
  user_id: number;
}

interface User {
  id: number;
  username: string;
}

interface MovieCardProps {
  movie: Movie;
  onStatusChange?: (movieId: number, status: 'watchlist' | 'watching' | 'watched') => void;
  onDelete?: (movieId: number) => void;
  onMovieClick?: (movie: Movie) => void;
  users?: User[];
}

/**
 * @az Film Kartı
 * @desc Tek bir filmi göstərən kart komponenti
 */
const MovieCard: React.FC<MovieCardProps> = ({ 
  movie, 
  onStatusChange, 
  onDelete,
  onMovieClick,
  users
}) => {
  const muiTheme = useTheme();
  const { darkMode } = useCustomTheme();
  const { username } = useAuth();
  const navigate = useNavigate();
  
  // Kullanıcı profiline gitme fonksiyonu
  const handleUserClick = (e: React.MouseEvent, userId: number) => {
    e.stopPropagation(); // Film kartı tıklamasını engelle
    navigate(`/user/${userId}`);
  };
  
  // Kullanıcı bilgisi varsa
  const addedByUser = users?.find(u => u.id === movie.user_id);
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 2,
        transition: 'all 0.2s',
        cursor: onMovieClick ? 'pointer' : 'default',
        bgcolor: darkMode ? alpha(muiTheme.palette.background.paper, 0.8) : muiTheme.palette.background.paper,
        '&:hover': {
          transform: onMovieClick ? 'translateY(-4px)' : 'none',
          boxShadow: onMovieClick ? `0 6px 16px ${alpha(muiTheme.palette.common.black, darkMode ? 0.3 : 0.1)}` : 'none',
        },
      }}
      onClick={() => onMovieClick && onMovieClick(movie)}
    >
      <Box sx={{ position: 'relative', paddingTop: '150%', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          image={movie.poster}
          alt={movie.title}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Box>
      
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography 
          variant="subtitle1" 
          component="div" 
          sx={{ 
            fontWeight: 'bold',
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.2,
          }}
        >
          {movie.title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary" mr={0.5}>
            IMDb:
          </Typography>
          <Typography 
            variant="body2"
            sx={{ fontWeight: 'bold', color: 'primary.main' }}
          >
            {movie.imdb_rating}
          </Typography>
        </Box>
        
        <Rating 
          value={movie.user_rating || 0} 
          precision={0.5} 
          size="small" 
          readOnly
          sx={{ mb: 1 }}
        />
        
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 'auto'
          }}
        >
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              fontSize: '0.7rem',
            }}
          >
            {formatDate(movie.created_at)}
          </Typography>
          
          {addedByUser && addedByUser.username !== username && (
            <Chip
              size="small"
              icon={<PersonIcon fontSize="small" />}
              label={addedByUser.username}
              onClick={(e) => handleUserClick(e, addedByUser.id)}
              variant="outlined"
              sx={{ 
                height: '24px',
                fontSize: '0.7rem',
                cursor: 'pointer',
                '&:hover': { 
                  bgcolor: alpha(muiTheme.palette.primary.main, 0.1) 
                }
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MovieCard; 