import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';
import UserProfilePage from './pages/UserProfilePage';
import NotFound from './pages/NotFound';

// react-toastify imports
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Xüsusi Toast CSS (əgər yaradılacaqsa)
import '../src/styles/customToast.css';

const ManageCommentsPage = lazy(() => import('./pages/Admin/ManageCommentsPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AdminHomePage = lazy(() => import('./pages/Admin/AdminHomePage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const MovieDetails = lazy(() => import('./pages/MovieDetails/MovieDetails'));

const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 128px)' }}>
    <CircularProgress />
  </Box>
);

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app-container">
      {!isAdminRoute && <Header />}
      <main style={{ height: isAdminRoute ? '100vh' : 'auto' }}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/user/:userId" element={<UserProfilePage />} />
            <Route path="/user/username/:username" element={<UserProfilePage />} />
            <Route path="/movie/:movieId" element={<MovieDetails />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            
            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminHomePage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="comments" element={<ManageCommentsPage />} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdminRoute && <Footer />}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        transition={Slide}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <CssBaseline />
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 