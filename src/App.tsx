import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 128px)' }}>
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <CssBaseline />
          <div className="app-container">
            <Header />
            <main>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                  </Route>
                  
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 