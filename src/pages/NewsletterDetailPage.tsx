import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Divider, 
  Breadcrumbs,
  useTheme, 
  alpha, 
  Skeleton,
  Button,
  Chip,
  Link as MuiLink,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Grid,
  Fade,
  useMediaQuery,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { getNewsletterById, markNewsletterAsViewed, Newsletter } from '../services/newsletterService';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

/**
 * @az Yenilik Detalları Səhifəsi
 * @desc Seçilmiş yeniliyin ətraflı məzmununu göstərir
 */
const NewsletterDetailPage = () => {
  const theme = useTheme();
  const { darkMode } = useCustomTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isLoggedIn } = useAuth();
  const [state, setState] = useState({
    newsletter: null as Newsletter | null,
    loading: true,
    error: null as string | null
  });
  
  // Responsive tasarım için ekran genişliği kontrolü
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  useEffect(() => {
    const fetchNewsletter = async () => {
      if (!id) return;
      
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const response = await getNewsletterById(id);
        
        if (response.success) {
          setState({
            newsletter: response.data,
            loading: false,
            error: null
          });
          
          if (isLoggedIn) {
            try {
              await markNewsletterAsViewed(id);
            } catch (error) {
              // Hata oluştu ancak kullanıcı deneyimini etkilemediği için sessizce devam ediyoruz
            }
          }
        } else {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Yenilik tapılmadı' 
          }));
        }
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Yenilik detallarını əldə edərkən xəta baş verdi' 
        }));
      }
    };
    
    fetchNewsletter();
  }, [id, isLoggedIn]);
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy, HH:mm');
  };
  
  const renderLoading = () => (
    <Fade in={state.loading}>
      <Box sx={{ mt: 4, p: 3 }}>
        <Skeleton variant="rectangular" height={50} width="70%" sx={{ mb: 2, borderRadius: 1 }} />
        <Skeleton variant="rectangular" height={30} width="40%" sx={{ mb: 4, borderRadius: 1 }} />
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="rectangular" height={20} width="30%" sx={{ borderRadius: 1 }} />
        </Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 1 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 1 }} />
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
      </Box>
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
          transition: 'all 0.3s ease',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <InfoIcon color="error" sx={{ fontSize: 40, mb: 2 }} />
          <Typography color="error" variant="h5" gutterBottom fontWeight="bold">
            {state.error}
          </Typography>
          <Typography color="text.secondary" variant="body1" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
            İstədiyiniz yenilik tapılmadı və ya əldə edilərkən xəta baş verdi. Zəhmət olmasa daha sonra yenidən cəhd edin.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={() => navigate('/newsletters')}
          startIcon={<ArrowBackIcon />}
          sx={{ 
            px: 3, 
            py: 1, 
            borderRadius: 2,
            boxShadow: theme.shadows[4],
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[8],
            },
          }}
        >
          Yeniliklər səhifəsinə qayıt
        </Button>
      </Card>
    </Fade>
  );
  
  const renderContent = () => {
    if (!state.newsletter) return null;
    
    const { title, content, created_at, updated_at, author, is_important } = state.newsletter;
    
    return (
      <Fade in={!state.loading && !state.error}>
        <Box>
          <Box 
            sx={{ 
              mb: { xs: 3, md: 4 },
              transition: 'all 0.3s ease',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Button
              component={RouterLink}
              to="/newsletters"
              startIcon={<ArrowBackIcon />}
              variant="outlined"
              size="small"
              sx={{ 
                borderRadius: 2,
                minWidth: 'auto',
                px: 1.5,
                py: 0.8,
                fontSize: '0.85rem',
                fontWeight: 600,
                boxShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.05)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(-3px)'
                }
              }}
            >
              Yeniliklər
            </Button>
            
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                mx: 1, 
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <span style={{ margin: '0 10px', color: alpha(theme.palette.text.secondary, 0.6) }}>
                /
              </span>
              Yenilik Detalları
            </Typography>
          </Box>
          
          <Card 
            elevation={3}
            sx={{ 
              borderRadius: { xs: 2, md: 3 },
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              boxShadow: darkMode 
                ? `0 8px 20px ${alpha(theme.palette.common.black, 0.2)}` 
                : `0 8px 20px ${alpha(theme.palette.common.black, 0.1)}`,
              border: `1px solid ${alpha(theme.palette.divider, darkMode ? 0.1 : 0.05)}`,
              position: 'relative'
            }}
          >
            {is_important && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bgcolor: theme.palette.error.main,
                  color: '#fff',
                  px: { xs: 1.5, sm: 2, md: 3 },
                  py: { xs: 0.6, md: 0.8 },
                  borderBottomLeftRadius: 12,
                  fontWeight: 'bold',
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
                  zIndex: 10,
                  boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.5)}`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Vacib
              </Box>
            )}
            
            <Box
              sx={{
                background: darkMode ? 
                  `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.1)} 100%)` :
                  `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(theme.palette.background.paper, 0.02)} 100%)`,
                pt: { xs: 2, sm: 2.5, md: 4 },
                pb: { xs: 1.5, sm: 2, md: 3 },
                px: { xs: 1.5, sm: 2, md: 4 },
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
              }}
            >
              <Typography 
                variant="h3" 
                component="h1"
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2.2rem' },
                  color: is_important 
                    ? theme.palette.error.main 
                    : theme.palette.text.primary,
                  mb: { xs: 3, md: 4 },
                  lineHeight: 1.2,
                  textShadow: darkMode ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                  position: 'relative',
                  display: 'inline-block',
                  letterSpacing: { xs: '-0.02em', md: '-0.01em' },
                  '&::after': is_important ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    bottom: -8,
                    height: '3px',
                    width: '60px',
                    borderRadius: '3px',
                    backgroundColor: theme.palette.error.main,
                  } : {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    bottom: -8,
                    height: '3px',
                    width: '60px',
                    borderRadius: '3px',
                    backgroundColor: theme.palette.primary.main,
                  },
                }}
              >
                {title}
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 0.8, md: 1 }, 
                mb: { xs: 1.5, md: 2 },
                flexWrap: 'wrap',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Avatar 
                    src={author?.avatar_url} 
                    alt={author?.username} 
                    sx={{ width: { xs: 28, md: 32 }, height: { xs: 28, md: 32 } }}
                  >
                    {author?.username ? author.username.charAt(0).toUpperCase() : 'S'}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.85rem', md: '0.9rem' } }}>
                    {author?.username}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', md: '0.85rem' } }}>
                  {formatDate(created_at)}
                </Typography>
                <Divider orientation="vertical" flexItem />
                <Tooltip title="Görüntülenme sayısı">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Avatar
                      sx={{
                        width: { xs: 22, md: 26 },
                        height: { xs: 22, md: 26 },
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.main,
                      }}
                    >
                      <VisibilityIcon sx={{ fontSize: { xs: 14, md: 16 } }} />
                    </Avatar>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', md: '0.85rem' } }}
                    >
                      {state.newsletter.view_count || 0}
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>
            </Box>
            
            <CardContent 
              sx={{ 
                p: { xs: 1.5, sm: 2, md: 4 },
                '&:last-child': { pb: { xs: 2, sm: 3, md: 4 } } 
              }}
            >
              <Box
                className="newsletter-content"
                sx={{
                  px: { xs: 0, md: 1 },
                  color: theme.palette.text.primary,
                  fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1.05rem' },
                  lineHeight: { xs: 1.6, sm: 1.7, md: 1.8 },
                  wordBreak: 'break-word',
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: 1,
                    my: { xs: 1.5, md: 2 },
                    boxShadow: `0 3px 8px ${alpha(theme.palette.common.black, 0.1)}`,
                  },
                  '& p': {
                    mb: { xs: 1.5, md: 2 },
                    lineHeight: { xs: 1.6, sm: 1.7, md: 1.8 },
                  },
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    mt: { xs: 2.5, md: 4 },
                    mb: { xs: 1.5, md: 2 },
                    fontWeight: 700,
                    fontFamily: "'Montserrat', sans-serif",
                    color: theme.palette.text.primary,
                    lineHeight: 1.3,
                  },
                  '& h1': { fontSize: { xs: '1.5rem', sm: '1.7rem', md: '2.2rem' } },
                  '& h2': { fontSize: { xs: '1.3rem', sm: '1.5rem', md: '1.8rem' } },
                  '& h3': { fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.6rem' } },
                  '& h4': { fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.4rem' } },
                  '& h5': { fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } },
                  '& h6': { fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } },
                  '& ul, & ol': {
                    pl: { xs: 2, md: 3 },
                    mb: { xs: 2, md: 3 },
                  },
                  '& li': {
                    mb: { xs: 0.7, md: 1 },
                    pl: { xs: 0.5, md: 1 },
                  },
                  '& a': {
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    borderBottom: `1px dotted ${alpha(theme.palette.primary.main, 0.4)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: theme.palette.primary.dark,
                      borderBottom: `1px solid ${theme.palette.primary.main}`,
                    }
                  },
                  '& blockquote': {
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    pl: { xs: 2, md: 3 },
                    py: { xs: 0.8, md: 1 },
                    my: { xs: 2, md: 3 },
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 1,
                    fontStyle: 'italic',
                    boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`,
                    fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' }
                  },
                  '& code': {
                    bgcolor: alpha(theme.palette.grey[500], 0.2),
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: { xs: '0.8em', md: '0.9em' },
                  },
                  '& pre': {
                    bgcolor: alpha(theme.palette.grey[900], darkMode ? 0.2 : 0.1),
                    color: darkMode ? '#e0e0e0' : '#333333',
                    p: { xs: 1.5, md: 2 },
                    borderRadius: 1,
                    overflowX: 'auto',
                    fontFamily: 'monospace',
                    fontSize: { xs: '0.8em', md: '0.9em' },
                    boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.grey[500], 0.2)}`,
                  },
                  '& hr': {
                    my: 3,
                    border: 'none',
                    height: '1px',
                    bgcolor: theme.palette.divider,
                  },
                  '& table': {
                    width: '100%',
                    borderCollapse: 'collapse',
                    my: { xs: 2, md: 3 },
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
                  },
                  '& th, & td': {
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    p: { xs: 1, md: 1.5 },
                    textAlign: 'left',
                  },
                  '& th': {
                    bgcolor: alpha(theme.palette.grey[500], 0.1),
                    fontWeight: 'bold',
                  },
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </CardContent>
          </Card>
          
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mt: { xs: 2.5, md: 4 },
              mb: { xs: 3, md: 6 },
            }}
          >
            <Button
              component={RouterLink}
              to="/newsletters"
              startIcon={<ArrowBackIcon />}
              variant="contained"
              color="primary"
              sx={{ 
                borderRadius: 2, 
                px: { xs: 2.5, md: 3 },
                py: { xs: 1, md: 1.2 },
                fontSize: { xs: '0.85rem', md: '0.9rem' },
                boxShadow: theme.shadows[3],
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              Yeniliklərə qayıt
            </Button>
          </Box>
        </Box>
      </Fade>
    );
  };
  
  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: { xs: 2, sm: 3, md: 6 },
        px: { xs: 1.5, sm: 2, md: 4 },
      }}
    >
      {state.loading ? renderLoading() : 
       state.error ? renderError() : 
       renderContent()}
    </Container>
  );
};

export default NewsletterDetailPage; 