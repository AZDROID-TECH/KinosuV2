import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

// Komponentin Azərbaycan dilində başlığı
/**
 * @az Qorunan Marşrut
 * @desc Yalnız giriş etmiş istifadəçilərin daxil ola biləcəyi marşrutları təmin edən komponent.
 *       AuthContext'in yüklənməsi tamamlanana qədər gözləyir.
 */
const ProtectedRoute = () => {
  // Context'dən isLoggedIn və isLoadingAuth alınır
  const { isLoggedIn, isLoadingAuth } = useAuth();

  // AuthContext yüklənərkən gözlə
  if (isLoadingAuth) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Yükləmə bitdikdən sonra,
  // Əgər istifadəçi giriş edibsə (isLoggedIn true), içəridəki komponenti göstər (Outlet).
  // Əks halda (isLoggedIn false), /login səhifəsinə yönləndir.
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute; 