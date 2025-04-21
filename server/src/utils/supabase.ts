import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .env faylını yüklə
dotenv.config();

// Supabase quraşdırmaları
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL və ya SUPABASE_KEY tapılmadı. Zəhmət olmasa .env faylını yoxlayın.');
  process.exit(1);
}

// Standart Supabase müştəri (anon key)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Əgər service key mövcuddursa, admin müştəri yaradın
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Ən yaxşı əlçatan müştəri funksiyası
export function getClient() {
  return supabaseAdmin || supabase;
}

// RLS politikalarını aşmak için service_role client'i döndürür
// Bu, yalnızca güvenli backend operasyonları için kullanılmalıdır
export function getServiceClient() {
  // Service key mevcut değilse normal client'i döndür ama uyarı ver
  if (!supabaseAdmin) {
    console.warn('SUPABASE_SERVICE_KEY tapılmadı. Row Level Security (RLS) politikaları işləyəcək.');
    return supabase;
  }
  return supabaseAdmin;
}

// Cədvəl adları (table names)
export const TABLES = {
  USERS: 'users',
  MOVIES: 'movies',
  COMMENTS: 'comments',
  REPLIES: 'replies'
}; 