# Kinosu - Film İzləmə Platforması

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Kinosu, istifadəçilərin filmləri kəşf etməsinə, izləmə siyahılarını idarə etməsinə və film təcrübələrini qeyd etməsinə imkan verən müasir bir veb tətbiqidir.

![Kinosu Ekran Görüntüsü (placeholder)](https://via.placeholder.com/800x400.png?text=Kinosu+Ekran+G%C3%B6r%C3%BCnt%C3%BCs%C3%BC)

## ✨ Xüsusiyyətlər

*   **İstifadəçi Doğrulaması:** Qeydiyyat, giriş, şifrə unutdum/yeniləmə funksiyaları.
*   **Profil İdarəetməsi:** İstifadəçi adı, avatar (yükləmə/kırpma/silmə) və şifrə dəyişdirmə.
*   **Açıq Profil Səhifələri:** İstifadəçilərin statistikalarını və son fəaliyyətlərini göstərən səhifələr.
*   **Film İzləmə:** Filmləri "İzləmə Siyahısı", "İzlənilir", "İzlənildi" statusları ilə idarə etmə.
*   **Film Detalları:** Hər film üçün ətraflı məlumat, reytinq və (gələcəkdə) rəylər.
*   **Axtarış:** Filmləri adlarına görə axtarma imkanı.
*   **Admin Paneli:**
    *   İstifadəçi idarəetməsi (siyahı, admin statusu, redaktə, silmə).
    *   Şərh idarəetməsi (gözləmədə olan şərhlərin təsdiqi/rəddi - *əlavə edilibsə*).
    *   Responsive dizayn (mobil cihazlarda açılır-kapanır menyu).
*   **Müasir UI:** React, Material UI (MUI) və fərdi tema (qaranlıq/işıqlı rejim) ilə qurulmuş cəlbedici interfeys.
*   **Naviqasiya:** `react-router-dom` ilə idarə olunan səhifə keçidləri və xüsusi 404 səhifəsi.
*   **Bildirişlər:** `react-toastify` ilə istifadəçi əməliyyatları üçün bildirişlər.

## 💻 Texnologiya Yığını

*   **Frontend:** React, TypeScript, Vite, Material UI (MUI), Axios, Day.js, React Easy Crop
*   **Backend:** Node.js, Express, TypeScript
*   **Verilənlər Bazası:** Supabase (PostgreSQL)
*   **Doğrulama:** JWT (JSON Web Tokens), Bcryptjs
*   **Fayl Yükləmə:** Multer, Supabase Storage
*   **E-poçt:** Nodemailer (Şifrə yeniləmə üçün)

## 🚀 Başlayaq

### İlkin Şərtlər

*   Node.js (v18 və ya daha yeni)
*   npm (Node.js ilə birlikdə gəlir)
*   Supabase Hesabı və Proyekti

### Quraşdırma

1.  **Deponu Klonla:**
    ```bash
    git clone https://github.com/USERNAME/kinosu.git # USERNAME-i öz GitHub istifadəçi adınızla əvəz edin
    cd kinosu
    ```

2.  **Asılılıqları Quraşdır:**
    ```bash
    npm install       # Client (root) asılılıqları
    cd server
    npm install       # Server asılılıqları
    cd ..
    ```

3.  **Ətraf Mühit Dəyişənləri (.env):**
    *   Kök qovluqda `.env.example` faylını kopyalayaraq `.env` faylı yaradın.
    *   Server qovluğunda `server/.env.example` faylını kopyalayaraq `server/.env` faylı yaradın.
    *   Hər iki `.env` faylındakı dəyərləri öz Supabase proyekt məlumatlarınız (URL, ANON KEY, SERVICE ROLE KEY) və digər konfiqurasiyalarınız (JWT secret, e-poçt ayarları və s.) ilə doldurun.
        *   **Client (`.env`):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
        *   **Server (`server/.env`):** `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `CLIENT_URL`

### İstifadə

1.  **Development:**
    *   Həm client, həm də serveri eyni anda development rejimində başlatmaq üçün:
        ```bash
        npm run dev:full
        ```
    *   Client `http://localhost:5173` (və ya Vite-nin təyin etdiyi başqa portda), server isə `http://localhost:5000` (və ya `server/.env`-də təyin olunan portda) işləyəcək.

2.  **Production Build:**
    *   Həm client, həm də server üçün production build-i yaratmaq üçün:
        ```bash
        npm run build:full
        ```
    *   Bu əməliyyat client üçün `dist` qovluğunu, server üçün isə `server/dist` qovluğunu yaradacaq.

3.  **Production Başlatma:**
    *   Build edilmiş serveri başlatmaq üçün:
        ```bash
        npm run serve # Və ya server qovluğunda: npm start
        ```
    *   Client tərəfinin fayllarını (`dist` qovluğu) bir statik fayl serveri (Nginx, Apache və s.) vasitəsilə təqdim etməlisiniz. Server tərəfi isə Node.js mühitində çalışacaq.

## 🤝 Töhfə Vermək

Töhfələr xoş qarşılanır! Zəhmət olmasa, töhfə verməzdən əvvəl bir "issue" açın və ya mövcud bir "issue" üzərində müzakirəyə başlayın.

## 📜 Lisenziya

Bu layihə MIT Lisenziyası altında lisenziyalaşdırılmışdır. Ətraflı məlumat üçün `LICENSE` faylına baxın.