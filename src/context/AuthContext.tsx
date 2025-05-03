import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, userAPI } from '../services/api';
import { showSuccessToast } from '../utils/toastHelper';

// userAPI.getProfile() çağrısının beklenen dönüş tipi
// (id alanını içerdiğinden emin olmalıyız)
interface UserProfile {
  id: number;
  username: string;
  email: string | null;
  avatar_url: string | null; // avatar -> avatar_url oldu
  isAdmin: boolean;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isLoadingAuth: boolean;
  userId: number | null; // userId eklendi
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
  const [userId, setUserId] = useState<number | null>(null); // userId state'i eklendi
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const navigate = useNavigate();

  const checkAuthStatus = async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    // username'i artık localStorage'dan okumaya gerek yok, profile'dan gelecek
    // const savedUsername = localStorage.getItem('username');

    if (!token) {
      setIsLoggedIn(false);
      setUserId(null); // userId sıfırla
      setUsername(null);
      setEmail(null);
      setAvatar(null);
      localStorage.removeItem('token');
      // localStorage.removeItem('username');
      setIsAdmin(false);
      return false;
    }

    try {
      // Profil bilgisini çekerek token'ın geçerliliğini kontrol et ve kullanıcı bilgilerini al
      // await userAPI.getProfile(); // Eski kontrol
      setIsLoggedIn(true);
      // if (savedUsername) {
      //   setUsername(savedUsername);
      // }
      await refreshProfile(); // Profil bilgilerini (id dahil) yükle
      return true;
    } catch (error) {
      console.error("Auth status check failed:", error);
      setIsLoggedIn(false);
      setUserId(null); // userId sıfırla
      setUsername(null);
      setEmail(null);
      setAvatar(null);
      localStorage.removeItem('token');
      // localStorage.removeItem('username');
      setIsAdmin(false);
      return false;
    }
  };

  const refreshProfile = async () => {
    try {
      // userAPI.getProfile() çağrısı UserProfile tipinde veri dönmeli
      const profile: UserProfile = await userAPI.getProfile();
      setUserId(profile.id); // userId state'ini ayarla
      setUsername(profile.username); // username'i de buradan ayarla
      setEmail(profile.email);
      setAvatar(profile.avatar_url); // avatar_url kullanıldı
      setIsAdmin(profile.isAdmin || false);
    } catch (error) {
      console.error('Profil məlumatlarını yükləmə xətası:', error);
      // Hata durumunda kullanıcı bilgilerini temizle ve logout yap
      setUserId(null);
      setUsername(null);
      setEmail(null);
      setAvatar(null);
      setIsAdmin(false);
      // Token geçersiz olduğunda otomatik olarak logout yapıyoruz
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      navigate('/login'); 
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

  const login = async (usernameInput: string, password: string) => {
    const response = await authAPI.login({ username: usernameInput, password });
    localStorage.setItem('token', response.token);
    // localStorage.setItem('username', usernameInput); // Artık localStorage'a gerek yok
    setIsLoggedIn(true);
    // setUsername(usernameInput); // refreshProfile içinde ayarlanacak
    
    try {
      await refreshProfile(); // Giriş sonrası ID ve diğer bilgileri hemen yükle
      showSuccessToast('Uğurla daxil oldunuz!');
    } catch (error) {
      // Hata durumunda belki kullanıcıya bilgi verilebilir
      console.error("Login sonrası profil yükleme hatası:", error);
    }
    
    navigate('/dashboard'); 
  };

  const logout = () => {
    localStorage.removeItem('token');
    // localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUserId(null); // userId sıfırla
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
        userId, // userId context'e eklendi
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