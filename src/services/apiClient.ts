import axios from 'axios';

// Token tabanlı bir axios instance oluştur
const apiClient = axios.create({
  baseURL: '/api', // Relative URL kullanarak proxy desteği sağla
  timeout: 15000, // İstekler için 15 saniye zaman aşımı
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor ile her istekte JWT token ekle
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor ile hata yönetimi
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Hata kodlarını işle
    if (error.response) {
      // 401 (Unauthorized) veya 403 (Forbidden) hatası olduğunda - token geçersiz
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('Token geçersiz veya süresi dolmuş:', error.response.data);
        
        // Eğer token geçersizse ve error.response.data içinde bir mesaj varsa onu kullanalım
        const errorMessage = error.response.data.error || 'Sessiyanın müddəti bitib, yenidən daxil olun';
        
        // Kullanıcı oturumunu sonlandır
        localStorage.removeItem('token');
        
        // Kullanıcıyı login sayfasına yönlendir 
        // Direk navigate kullanamadığımız için window.location kullanıyoruz
        window.location.href = '/login?expired=true';
        
        return Promise.reject(errorMessage);
      }
      
      // Diğer hatalar için normal işleme devam et
      const errorData = error.response.data;
      return Promise.reject(errorData.error || errorData.message || 'Bilinməyən xəta');
    }
    return Promise.reject('Server əlçatan deyil');
  }
);

export { apiClient }; 