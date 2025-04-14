import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  InputAdornment,
} from '@mui/material';
import 'boxicons/css/boxicons.min.css';
import { authAPI } from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Etibarsız şifrə yeniləmə linki');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Şifrələr uyğun gəlmir');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Şifrə yeniləmə tələbi göndərilir');
      
      const data = await authAPI.resetPassword(token, formData.newPassword);
      
      setSuccess(data.message || 'Şifrəniz uğurla yeniləndi');
      console.log('Şifrə uğurla yeniləndi');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Şifrə yeniləmə xətası:', err);
      setError(err.message || 'Şifrə yeniləmə zamanı xəta baş verdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ py: { xs: 2, sm: 4 } }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #2196f3 0%, #64b5f6 100%)',
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Box
            sx={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <i className='bx bx-lock-open-alt' style={{ fontSize: '24px', color: 'white' }}></i>
          </Box>
          <Typography
            component="h1"
            variant="h6"
            sx={{ 
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}
          >
            Şifrəni Yenilə
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              width: '100%', 
              mb: 2,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
            icon={<i className='bx bx-error-circle' style={{ fontSize: '18px' }}></i>}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              width: '100%', 
              mb: 2,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
            icon={<i className='bx bx-check-circle' style={{ fontSize: '18px' }}></i>}
          >
            {success}
          </Alert>
        )}

        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          sx={{ width: '100%' }}
        >
          <TextField
            required
            fullWidth
            size="small"
            name="newPassword"
            label="Yeni şifrə"
            type={showPassword ? "text" : "password"}
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <i className='bx bx-lock-alt' style={{ fontSize: '18px', color: 'action.active' }}></i>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: 'inherit'
                    }}
                  >
                    <i className={`bx ${showPassword ? 'bx-show' : 'bx-hide'}`} style={{ fontSize: '18px' }}></i>
                  </button>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1.5 }}
          />
          <TextField
            required
            fullWidth
            size="small"
            name="confirmPassword"
            label="Şifrəni təkrarla"
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <i className='bx bx-lock-alt' style={{ fontSize: '18px', color: 'action.active' }}></i>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="small"
            disabled={isSubmitting}
            sx={{
              py: 1,
              borderRadius: 1.5,
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '0.9rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            {isSubmitting ? (
              <>Yüklənir...</>
            ) : (
              <>
                <i className='bx bx-check' style={{ fontSize: '18px', marginRight: '6px' }}></i>
                Şifrəni Yenilə
              </>
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ResetPassword; 