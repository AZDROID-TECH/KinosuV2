-- Online durum takibi için users tablosuna last_online kolonu ekleme
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_online TIMESTAMP WITH TIME ZONE;

-- Son görülme zamanı üzerinde indeks oluşturma
CREATE INDEX IF NOT EXISTS idx_users_last_online ON users(last_online);

-- SQL dosyasını çalıştırmak için:
-- 1. Supabase SQL Editor'da bu dosyayı açın
-- 2. Execute butonuna basın veya
-- 3. psql ile bağlanıp \i dbSetup.sql komutunu çalıştırın 