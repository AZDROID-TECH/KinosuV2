import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, userAPI } from '../services/api';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoadingAuth: boolean;
  username: string | null;
  email: string | null;
  avatar: string | null;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateAvatar: (avatarUrl: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const navigate = useNavigate();

  const checkAuthStatus = async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');

    if (!token) {
      setIsLoggedIn(false);
      setUsername(null);
      setEmail(null);
      setAvatar(null);
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setIsAdmin(false);
      return false;
    }

    try {
      await userAPI.getProfile();
      setIsLoggedIn(true);
      if (savedUsername) {
        setUsername(savedUsername);
        await refreshProfile();
      }
      return true;
    } catch (error) {
      setIsLoggedIn(false);
      setUsername(null);
      setEmail(null);
      setAvatar(null);
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setIsAdmin(false);
      return false;
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await userAPI.getProfile();
      setEmail(profile.email);
      setAvatar(profile.avatar);
      setIsAdmin(profile.isAdmin || false);
    } catch (error) {
      console.error('Profil məlumatlarını yükləmə xətası:', error);
      setIsAdmin(false);
    }
  };

  const updateAvatar = (avatarUrl: string | null) => {
    setAvatar(avatarUrl);
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoadingAuth(true);
      await checkAuthStatus();
      setIsLoadingAuth(false);
    };
    
    initAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authAPI.login({ username, password });
    localStorage.setItem('token', response.token);
    localStorage.setItem('username', username);
    setIsLoggedIn(true);
    setUsername(username);
    
    try {
      await refreshProfile();
    } catch (error) {
      // Sessiz bir şekilde devam et
    }
    
    navigate('/dashboard'); 
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername(null);
    setEmail(null);
    setAvatar(null);
    setIsAdmin(false);
    navigate('/login'); 
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isLoggedIn, 
        isLoadingAuth,
        username, 
        email,
        avatar,
        isAdmin,
        login, 
        logout,
        refreshProfile,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 