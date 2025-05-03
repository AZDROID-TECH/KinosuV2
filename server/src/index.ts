import express from 'express';
import cors from 'cors';
import http from 'http';
import authRoutes from './routes/auth';
import movieRoutes from './routes/movies';
import userRoutes from './routes/user';
import healthRoutes from './routes/health';
import commentRoutes from './routes/comments';
import statsRoutes from './routes/stats';
import friendRoutes from './routes/friends';
import newsletterRoutes from './routes/newsletters';
import { rateLimiter } from './middleware/rateLimiter';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { TABLES, getClient } from './utils/supabase';
import { logger } from './utils/logger';
import axios from 'axios';
import { initializeSocketServer } from './services/onlineStatusService';

// .env faylını yüklə - main dotenv yüklemesi
dotenv.config();

const app = express();

// HTTP Server oluşturma (Socket.io için)
const server = http.createServer(app);

// Supabase cədvəl strukturunu yoxla və yarat (əgər yoxdursa)
const initializeDatabase = async () => {
  try {
    const client = getClient();
    
    // Rate Limits tablosunu kontrol et
    try {
      await client
        .from('rate_limits')
        .select('ip')
        .limit(1);
    } catch (error) {
      // Sessizce devam et
    }
    
    // USERS tablosunu kontrol et
    try {
      await client
        .from(TABLES.USERS)
        .select('id')
        .limit(1);
    } catch (error) {
      // Sessizce devam et
    }
    
    // MOVIES tablosunu kontrol et
    try {
      await client
        .from(TABLES.MOVIES)
        .select('id')
        .limit(1);
    } catch (error) {
      // Sessizce devam et
    }
    
    // COMMENTS tablosunu kontrol et
    try {
      await client
        .from(TABLES.COMMENTS)
        .select('id')
        .limit(1);
    } catch (error) {
      // Sessizce devam et
    }
    
    // Son görülme sütunu kontrol et ve varsa kullanıcı tablosuna ekle
    try {
      const { error } = await client
        .from('users')
        .select('last_seen')
        .limit(1);
      
      if (error && error.message.includes('column "last_seen" does not exist')) {
        // last_seen sütunu oluştur
        console.log('Kullanıcılar tablosuna son görülme sütunu ekleniyor...');
        const { error: alterError } = await client.rpc('create_last_seen_column');
        if (alterError) {
          console.error('Son görülme sütunu eklenemedi:', alterError);
        } else {
          console.log('Son görülme sütunu başarıyla eklendi');
        }
      }
    } catch (error) {
      // Sessizce devam et
    }
  } catch (error) {
    // Sessizce devam et
  }
};

// Verilənlər bazası strukturunu yoxla
initializeDatabase();

// Basit CORS yapılandırması - frontend ve backend aynı domainde çalıştığı için minimalist
app.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://localhost:5000'] 
    : true,
  credentials: true
}));

app.use(express.json());
app.use(rateLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/user', userRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/newsletters', newsletterRoutes);

// Frontend statik dosyalarını sunma - dağıtım klasörü
const distPath = path.join(__dirname, '../public');

// Frontend build dosyalarını sunmak için statik middleware
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // SPA için tüm diğer istekleri index.html'e yönlendir
  app.get('*', (req, res) => {
    // API isteklerini hariç tut
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Frontend dosyaları bulunamadı');
      }
    }
  });
}

// Socket.io server'ı başlat
const io = initializeSocketServer(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);

  // --- Render Free Tier Uyanıq Tutma --- 
  // NODE_ENV değerinden bağımsız olarak ping mekanizmasını etkinleştir
  if (process.env.CLIENT_URL) {
    const PING_INTERVAL_MS = 1 * 60 * 1000; // 1 dəqiqə
    const targetUrl = process.env.CLIENT_URL;

    const pingInterval = setInterval(async () => {
      try {
        await axios.get(targetUrl);
        // Başarılı ping sessizce devam et
      } catch (error) {
        // Bağlantı hatası sonrası yeniden deneme (opsiyonel)
        setTimeout(async () => {
          try {
            await axios.get(targetUrl, { timeout: 10000 });
            // Başarılı yeniden deneme, sessizce devam et
          } catch (retryError) {
            // Sessizce başarısız yeniden deneme
          }
        }, 15000); // 15 saniye sonra tekrar dene
      }
    }, PING_INTERVAL_MS);

    // Proqram dayandırıldıqda intervalı təmizlə (nəzəri olaraq)
    process.on('SIGTERM', () => {
      clearInterval(pingInterval);
      process.exit(0);
    });
  }
  // --- Render Free Tier Uyanıq Tutma Sonu ---
}); 