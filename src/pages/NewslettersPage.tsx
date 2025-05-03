import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Divider, 
  Grid, 
  Chip, 
  useTheme, 
  alpha, 
  Skeleton,
  Pagination,
  Card,
  CardContent,
  Button,
  Avatar,
  CardHeader,
  IconButton,
  CardActions,
  Fade,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import { 
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getNewsletters, Newsletter } from '../services/newsletterService';
import { format } from 'date-fns';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

interface NewsletterListState {
  newsletters: Newsletter[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
}

/**
 * @az Yeniliklər Səhifəsi
 * @desc Platformada yayınlanan bütün yenilikləri göstərir
 */
const NewslettersPage = () => {
  const theme = useTheme();
  const { darkMode } = useCustomTheme();
  const navigate = useNavigate();
  const [state, setState] = useState<NewsletterListState>({
    newsletters: [],
    loading: true,
    error: null,
    currentPage: 1,
    totalPages: 1
  });
  
  // Responsive design için breakpoint kontrolü
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const fetchNewsletters = async (page: number = 1) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await getNewsletters(page, 8);
      
      if (response.success) {
        setState({
          newsletters: response.data,
          loading: false,
          error: null,
          currentPage: response.currentPage || 1,
          totalPages: response.totalPages || 1
        });
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Yenilikləri yükləmək mümkün olmadı' 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Yenilikləri yükləmək mümkün olmadı' 
      }));
    }
  };
  
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    if (page !== state.currentPage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchNewsletters(page);
    }
  };
  
  const handleNewsletterClick = (id: number) => {
    navigate(`/newsletters/${id}`);
  };
  
  useEffect(() => {
    fetchNewsletters();
  }, []);
  
  const getFormattedDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy');
  };
  
  const truncateText = (text: string, maxLength: number = 180) => {
    const plainText = text.replace(/<[^>]*>?/gm, '');
    
    if (plainText.length <= maxLength) return plainText;
    
    return plainText.substring(0, maxLength) + '...';
  };
  
  const renderLoading = () => (
    <Fade in={state.loading}>
      <Grid container spacing={3}>
        {Array.from(new Array(4)).map((_, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                boxShadow: theme.shadows[2],
                borderRadius: 2,
                overflow: 'hidden',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                transition: 'all 0.3s ease',
              }}
            >
              <Box sx={{ 
                p: 2, 
                background: darkMode ? 
                  `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.05)} 100%)` :
                  `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(theme.palette.background.paper, 0.02)} 100%)`
              }}>
                <Skeleton variant="rectangular" height={32} width="70%" sx={{ mb: 1, borderRadius: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton variant="rectangular" height={20} width="30%" sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={20} width="30%" sx={{ borderRadius: 1 }} />
                </Box>
              </Box>
              <CardContent>
                <Skeleton variant="rectangular" height={20} sx={{ mb: 1, borderRadius: 1 }} />
                <Skeleton variant="rectangular" height={20} sx={{ mb: 1, borderRadius: 1 }} />
                <Skeleton variant="rectangular" height={20} width="80%" sx={{ mb: 1, borderRadius: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Fade>
  );
  
  const renderError = () => (
    <Fade in={!!state.error}>
      <Card 
        elevation={3}
        sx={{ 
          p: { xs: 3, md: 4 }, 
          mt: 4,
          textAlign: 'center',
          bgcolor: alpha(theme.palette.error.main, 0.05),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
          maxWidth: 700,
          mx: 'auto',
          transition: 'all 0.3s ease',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <ErrorIcon color="error" sx={{ fontSize: 50, mb: 2 }} />
          <Typography color="error" variant="h5" gutterBottom fontWeight="bold">
            {state.error}
          </Typography>
          <Typography color="text.secondary" variant="body1" sx={{ mb: 3 }}>
            Yeniliklərə dair məlumatları yükləyərkən xəta baş verdi. Zəhmət olmasa internet bağlantınızı yoxlayıb yenidən cəhd edin.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => fetchNewsletters()}
          startIcon={<RefreshIcon />}
          sx={{ 
            px: 3, 
            py: 1, 
            borderRadius: 2,
            boxShadow: theme.shadows[3],
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[6],
            },
          }}
        >
          Yenidən cəhd et
        </Button>
      </Card>
    </Fade>
  );
  
  const renderEmpty = () => (
    <Fade in={!state.loading && !state.error && state.newsletters.length === 0}>
      <Card 
        elevation={3}
        sx={{ 
          p: { xs: 3, md: 4 }, 
          mt: 4,
          textAlign: 'center',
          bgcolor: alpha(theme.palette.info.main, 0.05),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          maxWidth: 700,
          mx: 'auto',
          transition: 'all 0.3s ease',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <InfoIcon color="info" sx={{ fontSize: 50, mb: 2 }} />
          <Typography color="info.main" variant="h5" gutterBottom fontWeight="bold">
            Yenilik tapılmadı
          </Typography>
          <Typography color="text.secondary" variant="body1" sx={{ mb: 2 }}>
            Hal-hazırda heç bir yenilik yoxdur. Zəhmət olmasa daha sonra yenidən yoxlayın.
          </Typography>
        </Box>
      </Card>
    </Fade>
  );
  
  const renderContent = () => (
    <Fade in={!state.loading && !state.error && state.newsletters.length > 0}>
      <Box>
        <Grid container spacing={3}>
          {state.newsletters.map((newsletter) => (
            <Grid item xs={12} md={6} key={newsletter.id}>
              <Card 
                onClick={() => handleNewsletterClick(newsletter.id)}
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: theme.shadows[2],
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `1px solid ${alpha(theme.palette.divider, darkMode ? 0.1 : 0.05)}`,
                  position: 'relative',
                  '&:hover': {
                    boxShadow: `0 8px 16px ${alpha(theme.palette.common.black, darkMode ? 0.25 : 0.1)}`,
                    transform: 'translateY(-4px)',
                  }
                }}
              >
                {newsletter.is_important && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bgcolor: theme.palette.error.main,
                      color: '#fff',
                      px: { xs: 1.5, md: 2 },
                      py: 0.5,
                      borderBottomLeftRadius: 8,
                      fontWeight: 'bold',
                      fontSize: { xs: '0.7rem', md: '0.8rem' },
                      zIndex: 10,
                      boxShadow: `0 2px 4px ${alpha(theme.palette.error.main, 0.5)}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Vacib
                  </Box>
                )}
                
                <CardHeader
                  sx={{
                    p: 2,
                    pb: 1.5,
                    background: darkMode ? 
                      `linear-gradient(135deg, ${alpha(newsletter.is_important ? theme.palette.error.dark : theme.palette.primary.dark, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.05)} 100%)` :
                      `linear-gradient(135deg, ${alpha(newsletter.is_important ? theme.palette.error.light : theme.palette.primary.light, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.02)} 100%)`,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                  }}
                  title={
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: { xs: '1.05rem', md: '1.15rem' },
                        color: newsletter.is_important 
                          ? theme.palette.error.main 
                          : theme.palette.primary.main,
                        lineHeight: 1.3,
                        mb: 1,
                        transition: 'color 0.2s',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {newsletter.title}
                    </Typography>
                  }
                />

                <CardContent sx={{ p: 2, pt: 1.5 }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        src={newsletter.author?.avatar_url}
                        alt={newsletter.author?.username}
                        sx={{ 
                          width: 24, 
                          height: 24,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        }}
                      >
                        {newsletter.author?.username ? newsletter.author.username.charAt(0).toUpperCase() : 'S'}
                      </Avatar>
                      <Typography
                        variant="caption"
                        sx={{ 
                          color: theme.palette.text.secondary,
                          fontWeight: 500,
                        }}
                      >
                        {newsletter.author?.username}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        sx={{ 
                          width: 24, 
                          height: 24,
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.main, 
                        }}
                      >
                        <CalendarIcon sx={{ fontSize: 14 }} />
                      </Avatar>
                      <Typography 
                        variant="caption"
                        sx={{ 
                          fontWeight: 500,
                          color: alpha(theme.palette.text.secondary, 0.9),
                        }}
                      >
                        {getFormattedDate(newsletter.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      height: '4.8em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      mb: 1,
                    }}
                  >
                    {truncateText(newsletter.content)}
                  </Typography>
                  
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pt: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        sx={{ 
                          width: 24, 
                          height: 24,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main,
                        }}
                      >
                        <VisibilityIcon sx={{ fontSize: 14 }} />
                      </Avatar>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: alpha(theme.palette.text.secondary, 0.8),
                          fontWeight: 500,
                          fontSize: '0.75rem' 
                        }}
                      >
                        {newsletter.view_count || 0} görüntülənmə
                      </Typography>
                    </Box>
                    
                    <Tooltip title="Davamını oxu">
                      <Button
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                        sx={{ 
                          color: newsletter.is_important 
                            ? theme.palette.error.main 
                            : theme.palette.primary.main,
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          p: 0,
                          minWidth: 'auto',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            transform: 'translateX(2px)'
                          }
                        }}
                      >
                        Davamını oxu
                      </Button>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {state.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, mb: 3 }}>
            <Pagination 
              count={state.totalPages} 
              page={state.currentPage} 
              onChange={handlePageChange} 
              color="primary"
              variant="outlined"
              shape="rounded"
              size="large"
              sx={{
                '& .MuiPaginationItem-root': {
                  fontWeight: 600,
                  transition: 'all 0.2s',
                },
                '& .MuiPaginationItem-root.Mui-selected': {
                  boxShadow: theme.shadows[2],
                  backgroundColor: darkMode 
                    ? alpha(theme.palette.primary.main, 0.2)
                    : alpha(theme.palette.primary.main, 0.1),
                },
              }}
            />
          </Box>
        )}
      </Box>
    </Fade>
  );
  
  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: { xs: 4, md: 6 },
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box 
        sx={{
          mb: { xs: 4, md: 6 },
          textAlign: 'center',
          position: 'relative',
          pb: 4,
        }}
      >
        <Box 
          sx={{
            background: darkMode ? 
              `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.2)} 0%, ${alpha(theme.palette.background.paper, 0.05)} 100%)` :
              `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(theme.palette.background.paper, 0.02)} 100%)`,
            py: { xs: 3, md: 4 },
            px: { xs: 2, md: 4 },
            borderRadius: 3,
            mb: 4,
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, darkMode ? 0.2 : 0.05)}`,
            border: `1px solid ${alpha(theme.palette.divider, darkMode ? 0.1 : 0.05)}`,
          }}
        >
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              fontWeight: 800,
              fontSize: { xs: '2.2rem', sm: '2.5rem', md: '3rem' },
              mb: 2,
              color: theme.palette.text.primary,
              textShadow: darkMode ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
              position: 'relative',
              display: 'inline-block',
              '&::after': {
                content: '""',
                position: 'absolute',
                left: '50%',
                bottom: -10,
                height: '4px',
                width: '80px',
                borderRadius: '4px',
                backgroundColor: theme.palette.primary.main,
                transform: 'translateX(-50%)',
              }
            }}
          >
            Yeniliklər
          </Typography>
          <Typography 
            variant="subtitle1"
            sx={{ 
              maxWidth: '700px',
              mx: 'auto',
              mb: 1,
              mt: 3,
              lineHeight: 1.6,
              color: alpha(theme.palette.text.primary, 0.8),
              fontSize: { xs: '1rem', md: '1.1rem' },
            }}
          >
            Ən son platformamızla bağlı yenilikləri və elanları burada izləyin
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ minHeight: '400px' }}>
        {state.loading ? renderLoading() : 
         state.error ? renderError() : 
         state.newsletters.length === 0 ? renderEmpty() : 
         renderContent()}
      </Box>
    </Container>
  );
};

export default NewslettersPage; 