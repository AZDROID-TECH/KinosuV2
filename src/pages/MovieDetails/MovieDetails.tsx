import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Container,
    Grid,
    Paper,
    Chip,
    TextField,
    Button,
    Divider,
    Avatar,
    CardMedia,
    useTheme,
    useMediaQuery,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Star,
    CalendarToday,
    InfoOutlined,
    ArrowBack,
    ErrorOutline,
    AccessTime
} from '@mui/icons-material';
import styles from './MovieDetails.module.css';
import axios from 'axios';
import { Movie } from '../../types/movie';
import CommentList from '../../components/Comments/CommentList';
import CommentForm from '../../components/Comments/CommentForm';

// OMDb API yanıtı için basit bir tip (İhtiyaç duyulursa genişletilebilir)
interface OMDbMovieData {
    Title: string;
    Year: string;
    Rated: string;
    Released: string;
    Runtime: string;
    Genre: string;
    Director: string;
    Writer: string;
    Actors: string;
    Plot: string;
    Language: string;
    Country: string;
    Awards: string;
    Poster: string;
    Ratings: { Source: string; Value: string }[];
    Metascore: string;
    imdbRating: string;
    imdbVotes: string;
    imdbID: string;
    Type: string;
    DVD: string;
    BoxOffice: string;
    Production: string;
    Website: string;
    Response: string; // "True" veya "False"
    Error?: string; // Response "False" ise hata mesajı
}

const MovieDetails: React.FC = () => {
    const { movieId } = useParams<{ movieId: string }>();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [movie, setMovie] = useState<OMDbMovieData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [comment, setComment] = useState<string>('');
    const [commentRefreshKey, setCommentRefreshKey] = useState<number>(0);

    useEffect(() => {
        let isMounted = true;

        const fetchDetailsFromOMDb = async () => {
            if (!movieId) {
                if (isMounted) {
                    setError('Film ID tapılmadı.');
                    setLoading(false);
                }
                return;
            }

            // API Anahtarı (Environment variable'dan alınmalı)
            // .env dosyasında VITE_OMDB_API_KEY olarak tanımlanmalı
            const apiKey = import.meta.env.VITE_OMDB_API_KEY || "YOUR_OMDB_API_KEY"; // Placeholder
            if (apiKey === "YOUR_OMDB_API_KEY") {
                 console.error("OMDb API Anahtarı (.env faylında VITE_OMDB_API_KEY) konfiqurasiya edilməyib!");
                 if (isMounted) {
                    setError("API konfiqurasiya edilmədiyi üçün film detalları yüklənə bilmir.");
                    setLoading(false);
                 }
                 return;
            }

            const apiUrl = `https://www.omdbapi.com/?i=${movieId}&apikey=${apiKey}&plot=full`;

            if (isMounted) {
                setLoading(true);
                setError(null);
                setMovie(null);
            }

            try {
                const response = await axios.get<OMDbMovieData>(apiUrl);

                if (response.data && response.data.Response === "True") {
                    if (isMounted) {
                        setMovie(response.data);
                        setError(null); 
                    }
                } else {
                    console.error("OMDb API xətası:", response.data.Error);
                    setError(response.data.Error || 'Film tapılmadı və ya API xətası.');
                    setMovie(null);
                }

            } catch (err: any) {
                console.error('OMDb API çağırışı zamanı xəta:', err);
                 if (isMounted) {
                    setError(err.message || 'Film detalları yüklənərkən bir xəta baş verdi.');
                    setMovie(null);
                 }
            } finally {
                 if (isMounted) {
                    setLoading(false);
                 }
            }
        };

        fetchDetailsFromOMDb();

        return () => {
            isMounted = false;
        };

    }, [movieId]);

    const handleGoBack = () => {
        window.history.back();
    };

    const handleCommentAdded = () => {
        setCommentRefreshKey(prev => prev + 1);
    };

    const renderLoading = () => (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Film Detalları Yüklənir...</Typography>
        </Box>
    );

    const renderError = () => (
        <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
             <Alert severity="error" icon={<ErrorOutline />} variant="outlined" sx={{ mb: 2, justifyContent: 'center' }}>
                 {error || 'Bilinməyən bir xəta baş verdi.'}
             </Alert>
             <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleGoBack}>
                 Geri Qayıt
             </Button>
        </Container>
    );

    const renderMovieDetails = () => {
        if (!movie || movie.Response !== "True") { 
             if (!loading && !error) {
                 setError("Film məlumatları düzgün formatda deyil.");
                 return renderError();
             }
             return null;
        }

        const genres = typeof movie.Genre === 'string' ? movie.Genre.split(',').map((g: string) => g.trim()) : [];

        return (
            <Paper elevation={isMobile ? 0 : 3} sx={{
                p: { xs: 2, sm: 3, md: 4 },
                mt: 2,
                bgcolor: 'background.paper',
                borderRadius: isMobile ? 0 : 2
            }}>
                <Button 
                    startIcon={<ArrowBack />} 
                    onClick={handleGoBack}
                    sx={{ mb: 2, display: { xs: 'none', sm: 'inline-flex' } }}
                >
                    Geri
                </Button>

                <Grid container spacing={{ xs: 3, md: 4 }}> 
                    <Grid item xs={12} sm={4} md={3} sx={{ textAlign: 'center' }}>
                        <CardMedia
                             component="img"
                            image={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder-image.png'}
                            alt={`${movie.Title} posteri`}
                            className={styles['movie-poster']}
                            sx={{
                                borderRadius: 2,
                                width: '100%',
                                maxWidth: { xs: '200px', sm: '100%' },
                                height: 'auto',
                                objectFit: 'cover',
                                mb: 2,
                                boxShadow: `0 4px 12px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'}`,
                                display: 'inline-block'
                            }}
                         />
                    </Grid>

                    <Grid item xs={12} sm={8} md={9}>
                        <Typography 
                            variant={isMobile ? "h5" : "h4"} 
                            component="h1" 
                            gutterBottom 
                            sx={{ fontWeight: 'bold' }}
                        >
                            {movie.Title || 'Başlıq Yoxdur'}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 1, sm: 1.5 }, mb: 2.5 }}>
                            {movie.Year && movie.Year !== 'N/A' && <Chip icon={<CalendarToday />} label={movie.Year} variant="outlined" size="small" />}
                            {movie.Runtime && movie.Runtime !== 'N/A' && <Chip icon={<AccessTime />} label={movie.Runtime} variant="outlined" size="small" />}
                            {movie.imdbRating && movie.imdbRating !== 'N/A' && <Chip icon={<Star sx={{ color: '#f5c518' }} />} label={`IMDb: ${movie.imdbRating}`} variant="outlined" size="small" />}
                        </Box>
                        
                        {genres.length > 0 && genres[0] !== 'N/A' && (
                             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 3 }}>
                                {genres.map((genre: string) => (
                                    <Chip key={genre} label={genre} size="small" className={styles['genre-chip']} sx={{ 
                                         bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                         color: 'text.secondary',
                                         fontWeight: 500
                                    }} /> 
                                ))}
                            </Box>
                        )}
                        
                        <Divider sx={{ mb: 2.5 }} />

                        <Typography variant="h6" gutterBottom>Məzmun</Typography>
                        <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
                           {movie.Plot && movie.Plot !== 'N/A' ? movie.Plot : 'Məzmun məlumatı mövcud deyil.'}
                        </Typography>

                        {(movie.Director && movie.Director !== 'N/A' || movie.Actors && movie.Actors !== 'N/A') && <Divider sx={{ my: 3 }} />} 
                        {movie.Director && movie.Director !== 'N/A' && (
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="overline" display="block" color="text.secondary">Rejissor</Typography>
                                <Typography variant="body2">{movie.Director}</Typography>
                            </Box>
                        )}
                        {movie.Actors && movie.Actors !== 'N/A' && (
                            <Box>
                                 <Typography variant="overline" display="block" color="text.secondary">Aktyorlar</Typography>
                                <Typography variant="body2">{movie.Actors}</Typography>
                            </Box>
                        )}
                    </Grid> 
                </Grid>
            </Paper>
        );
    };
    
    const renderCommentsSection = () => {
        if (!movie || movie.Response !== "True" || !movieId) return null;
        
        return (
            <Paper elevation={isMobile ? 0 : 3} sx={{
                p: { xs: 2, sm: 3 }, 
                mt: 3,
                bgcolor: 'background.paper',
                borderRadius: isMobile ? 0 : 2
            }}>
                <Typography variant="h6" component="h2" gutterBottom>
                    Şərhlər
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                     <Typography variant="subtitle1" component="h3" gutterBottom sx={{ fontWeight: 'medium' }}>
                         Şərhinizi Bildirin
                     </Typography>
                     <CommentForm 
                         movieId={movieId} 
                         onCommentAdded={handleCommentAdded} 
                     />
                 </Box>
                
                <Divider sx={{ mb: 2 }} />

                 <CommentList movieId={movieId} refreshKey={commentRefreshKey} />
            </Paper>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ mt: { xs: 0, sm: 2 }, mb: 4 }}>
            <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', p: 1.5, bgcolor: 'background.paper' }}>
                <IconButton onClick={handleGoBack} size="small" sx={{ mr: 1 }}><ArrowBack /></IconButton>
                <Typography variant="h6" noWrap>{loading ? 'Yüklənir...' : (movie?.Title || 'Film Detalları')}</Typography>
            </Box>

            {loading && renderLoading()}
            {error && renderError()}
            {!loading && !error && movie && (
                 <Box>
                    {renderMovieDetails()}
                    {renderCommentsSection()}
                </Box>
            )}
            {!loading && !error && !movie && renderError()} 
        </Container>
    );
};

export default MovieDetails; 