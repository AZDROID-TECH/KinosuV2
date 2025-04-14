import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Modu ve ortam değişkenlerini yükle
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // Ortam değişkenlerini .env dosyasından yükle

  // Geliştirme sunucusu ayarları
  const serverConfig = {
    port: 3000, // Frontend geliştirme sunucusu portu
    host: true, // Ağdaki diğer cihazlardan erişim için
    proxy: {
      // /api ile başlayan istekleri backend sunucusuna yönlendir
      '/api': {
        target: env.DEV_API_URL || 'http://localhost:5000', // Backend URL'i (.env'den veya varsayılan)
        changeOrigin: true, // Origin header'ını değiştir
        secure: false, // HTTPS hatalarını yoksay (gerekirse)
      },
      // /uploads proxy kuralı artıq lazım deyil
      // '/uploads': {
      //   target: env.DEV_API_URL || 'http://localhost:5000',
      //   changeOrigin: true,
      //   secure: false,
      // },
    },
  };

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
    },
    // Sadece geliştirme modunda server ayarlarını ekle
    server: mode === 'development' ? serverConfig : undefined,
  };
}); 