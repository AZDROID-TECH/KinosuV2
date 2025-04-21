import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';

const NotFound = () => {
  const { darkMode } = useCustomTheme();
  const muiTheme = useMuiTheme();

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 3,
          background: darkMode 
            ? `linear-gradient(145deg, ${muiTheme.palette.grey[800]}, ${muiTheme.palette.grey[900]})` 
            : `linear-gradient(145deg, ${muiTheme.palette.grey[100]}, ${muiTheme.palette.grey[200]})`,
          boxShadow: darkMode 
            ? `5px 5px 15px ${muiTheme.palette.common.black}, -5px -5px 15px ${muiTheme.palette.grey[700]}`
            : `5px 5px 15px ${muiTheme.palette.grey[400]}, -5px -5px 15px ${muiTheme.palette.common.white}`
        }}
      >
        <SentimentVeryDissatisfiedIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          404 - Səhifə Tapılmadı
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Axtardığınız səhifə mövcud deyil və ya başqa ünvana köçürülmüş ola bilər.
        </Typography>
        <Button 
          component={Link} 
          to="/" 
          variant="contained" 
          color="primary"
          size="large"
        >
          Əsas Səhifəyə Qayıt
        </Button>
      </Paper>
    </Container>
  );
};

export default NotFound; 