import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Alert } from '@mui/material';

/**
 * @az Admin Marşrutu
 * @desc Yalnız giriş etmiş və admin yetkisinə sahib istifadəçilərin daxil ola biləcəyi marşrutları təmin edir.
 */
const AdminRoute = () => {
  const { isLoggedIn, isLoadingAuth, isAdmin } = useAuth();

  // AuthContext yüklənərkən gözlə
  if (isLoadingAuth) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Giriş edilməyibsə Login'e yönləndir
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Giriş edilib amma admin deyilsə, Dashboard'a yönləndir veya bir hata mesajı göster
  if (!isAdmin) {
    // Seçenek 1: Dashboard'a yönlendir
    // return <Navigate to="/dashboard" replace />;
    
    // Seçenek 2: Hata mesajı göster (Bu daha bilgilendirici olabilir)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', p: 3 }}>
        <Alert severity="error" sx={{ width: '100%', maxWidth: 600 }}>
          Bu səhifəyə giriş üçün admin yetkiniz yoxdur.
        </Alert>
      </Box>
    );
  }

  // Giriş edilib ve admin ise, içəridəki komponenti göstər (Outlet).
  return <Outlet />;
};

export default AdminRoute; 