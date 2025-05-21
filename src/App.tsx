import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider as CustomThemeProvider } from './context/ThemeContext';
import { FriendProvider } from './context/FriendContext';
import { OnlineStatusProvider } from './context/OnlineStatusContext';
import { HeaderMenuProvider } from './context/HeaderMenuContext';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';
import MobileBottomMenu from './components/MobileBottomMenu';

// Lazy load components
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminHomePage = lazy(() => import('./pages/Admin/AdminHomePage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const ManageCommentsPage = lazy(() => import('./pages/Admin/ManageCommentsPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const MovieDetails = lazy(() => import('./pages/MovieDetails/MovieDetails'));
const FriendsPage = lazy(() => import('./pages/FriendsPage'));
const NewslettersPage = lazy(() => import('./pages/NewslettersPage'));
const NewsletterDetailPage = lazy(() => import('./pages/NewsletterDetailPage'));
const AdminNewslettersPage = lazy(() => import('./pages/Admin/AdminNewslettersPage'));

const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 128px)' }}>
    <CircularProgress />
  </Box>
);

// LocationAware wrapper component to determine routes
const AppContent = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app-container">
      {!isAdminRoute && <Header />}
      <Sidebar open={sidebarOpen} onClose={handleSidebarClose} variant="temporary" />
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
            <Route path="/newsletters" element={<NewslettersPage />} />
            <Route path="/newsletters/:id" element={<NewsletterDetailPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/friends" element={<FriendsPage />} />
            </Route>
            
            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminHomePage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="comments" element={<ManageCommentsPage />} />
                <Route path="newsletters" element={<AdminNewslettersPage />} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdminRoute && <Footer />}
      <MobileBottomMenu />
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

// Main App component
function App() {
  return (
    <CustomThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <FriendProvider>
          <HeaderMenuProvider>
            <AppContent />
          </HeaderMenuProvider>
        </FriendProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;