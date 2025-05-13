// backend ve frontend tek sunucuda çalıştığı için tüm API çağrıları göreceli URL kullanıyor

interface LoginData {
  username: string; // İstifadəçi adı və ya email olaraq istifadə edilə bilər
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

interface MovieData {
  title: string;
  imdb_id: string;
  poster: string;
  imdb_rating: number;
  status: 'watchlist' | 'watching' | 'watched';
}

interface UserProfile {
  id: number;
  username: string;
  email: string | null;
  avatar_url: string | null;
  createdAt: string;
  isAdmin: boolean;
  watchlist?: {
    watchlist: number;
    watching: number;
    watched: number;
  };
}

// UserForAdmin interface\'i tanımla (veya ayrı bir types dosyasından import et)
interface UserForAdmin {
  id: number;
  username: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  is_admin: boolean;
}

// Açık profil bilgileri için interface
interface PublicUserProfile {
  id: number;
  username: string;
  avatar: string | null;
  createdAt: string;
  isOnline: boolean;
  stats: {
    watchlist: number;
    watching: number;
    watched: number;
    total: number;
  };
  latestMovie: {
    title: string;
    poster: string;
    imdb_rating: number;
    status: string;
    created_at: string;
  } | null;
  topRatedMovies: Array<{
    title: string;
    poster: string;
    imdb_rating: number;
    user_rating: number;
    status: string;
    created_at: string;
  }>;
}

// Admin Statistikaları üçün interface
interface AdminStats {
    userCount: number;
    pendingCommentCount: number;
    // Gələcəkdə başqa statistika sahələri...
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Yardımcı hata ayıklama fonksiyonu
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorData: { error: string } = { error: 'Bilinməyən xəta' };
    
    try {
      if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();
        if (typeof jsonData.error === 'string') {
          errorData = jsonData;
        } else if (jsonData.message) {
          errorData = { error: jsonData.message };
        } else {
          errorData = { error: 'API xətası' };
        }
      } else {
        errorData = { error: 'Server cavab vermədi' };
      }
    } catch {
      errorData = { error: 'Cavabı emal etmək mümkün olmadı' };
    }
    
    // Sadece hatayı fırlat, yönlendirme yapma.
    // Yönlendirme kararı çağıran yerde verilmeli.
    throw errorData;
  }
  
  // Yanıt başarılıysa JSON verisini döndür
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : {}; // Boş yanıtları kontrol et
  } catch (e) {
    console.error("JSON parse error:", e);
    throw { error: "Serverdan gelen cavab emal edilemedi." };
  }
};

export const authAPI = {
  login: async (data: LoginData) => {
    try {
      // username sahəsi istifadəçi adı və ya email ola bilər
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Giriş xətası:', error);
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    try {
      const registerData = {
        username: data.username,
        password: data.password,
        email: data.email
      };
      
      const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Qeydiyyat xətası:', error);
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await fetch(`/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Şifrə yeniləmə tələbi xətası:', error);
      throw error;
    }
  },
  
  resetPassword: async (token: string, newPassword: string) => {
    try {
      const response = await fetch(`/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Şifrə yeniləmə xətası:', error);
      throw error;
    }
  },
};

export const userAPI = {
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await fetch(`/api/user/profile`, {
        headers: getHeaders(),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Profil məlumatları alınarkən xəta:', error);
      throw error;
    }
  },

  // Açık profil bilgileri alma
  getPublicProfile: async (userId: number | string): Promise<PublicUserProfile> => {
    try {
      const response = await fetch(`/api/user/profile/${userId}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Açıq profil məlumatları alınarkən xəta:', error);
      throw error;
    }
  },

  getPublicProfileByUsername: async (username: string): Promise<PublicUserProfile> => {
    try {
      const response = await fetch(`/api/user/profile/username/${username}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('İstifadəçi adına görə profil məlumatları alınarkən xəta:', error);
      throw error;
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    try {
      const response = await fetch(`/api/user/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Profil yeniləmə xətası:', error);
      throw error;
    }
  },
  
  uploadAvatar: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/user/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Avatar yükləmə xətası:', error);
      throw error;
    }
  },
  
  deleteAvatar: async () => {
    try {
      const response = await fetch(`/api/user/avatar`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Avatar silmə xətası:', error);
      throw error;
    }
  },
  
  // Şifrəni dəyişdir
  changePassword: async (passwords: { currentPassword: string; newPassword: string }) => {
    try {
      const response = await fetch(`/api/user/change-password`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(passwords),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Şifrə dəyişdirmə xətası:', error);
      throw error;
    }
  },
  
  // --- Admin fonksiyonları tekrar eklendi ---
  getAllUsers: async (): Promise<UserForAdmin[]> => {
    try {
      const response = await fetch(`/api/user/all`, { // Route değiştirildi: /api/users -> /api/user/all
        headers: getHeaders(),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Bütün istifadəçilər alınarkən xəta:', error);
      throw error;
    }
  },

  setUserAdminStatus: async (userId: number, isAdmin: boolean) => {
    try {
      const response = await fetch(`/api/user/${userId}/admin`, { // Route değiştirildi: /api/users/:userId/admin -> /api/user/:userId/admin
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ isAdmin }),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error(`Admin statusu yenilənərkən xəta (ID: ${userId}):`, error);
      throw error;
    }
  },
  
  updateUser: async (userId: number, data: {username?: string, email?: string}) => {
    try {
      const response = await fetch(`/api/user/${userId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error(`İstifadəçi məlumatları yenilənərkən xəta (ID: ${userId}):`, error);
      throw error;
    }
  },
  
  deleteUser: async (userId: number) => {
    try {
      const response = await fetch(`/api/user/${userId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return await handleApiResponse(response);
    } catch (error) {
      console.error(`İstifadəçi silinərkən xəta (ID: ${userId}):`, error);
      throw error;
    }
  },
};

export const movieAPI = {
  getMovies: async () => {
    try {
      const response = await fetch(`/api/movies`, {
        headers: getHeaders(),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Film siyahısı alınarkən xəta:', error);
      throw error;
    }
  },

  searchMovies: async (query: string) => {
    try {
      const response = await fetch(`/api/movies/search/${encodeURIComponent(query)}`, {
        headers: getHeaders(),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Film axtarışı xətası:', error);
      throw error;
    }
  },

  addMovie: async (data: MovieData) => {
    try {
      const response = await fetch(`/api/movies`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Film əlavə etmə xətası:', error);
      throw error;
    }
  },

  updateMovie: async (id: number, data: Partial<MovieData>) => {
    try {
      const response = await fetch(`/api/movies/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Film yeniləmə xətası:', error);
      throw error;
    }
  },

  deleteMovie: async (id: number) => {
    try {
      const response = await fetch(`/api/movies/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Film silmə xətası:', error);
      throw error;
    }
  },
};

// Yeni Stats API
export const statsAPI = {
    getAdminStats: async (): Promise<AdminStats> => {
        try {
            const response = await fetch(`/api/stats/admin`, {
                headers: getHeaders(), // Admin auth üçün token lazımdır
            });
            return await handleApiResponse(response);
        } catch (error) {
            console.error('Admin statistikaları alınarkən xəta:', error);
            // Default dəyərlər qaytaraq ki, UI tam qırılmasın
            // throw error; // Əvəzinə:
            return { userCount: 0, pendingCommentCount: 0 }; 
        }
    },
}; 