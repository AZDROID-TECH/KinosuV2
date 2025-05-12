import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || `http://localhost:${PORT}`;

/**
 * Şifrə yeniləmə emaili üçün HTML şablonu
 * 
 * @param resetToken Şifrə yeniləmə tokeni
 * @param username İstifadəçi adı (varsa)
 * @returns HTML formatında email şablonu
 */
export const getPasswordResetTemplate = (resetToken: string, username?: string): string => {
  const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;
  const currentYear = new Date().getFullYear();
  
  return `
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Kinosu - Şifrə Yeniləmə</title>
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <style>
    :root {
      color-scheme: light;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background: linear-gradient(135deg, #3f51b5 0%, #9c27b0 100%);
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
      letter-spacing: 1px;
    }
    .content {
      padding: 30px;
      background-color: #ffffff;
      border-left: 1px solid #e0e0e0;
      border-right: 1px solid #e0e0e0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #3f51b5 0%, #9c27b0 100%);
      color: #e6e6e6;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      transition: all 0.3s;
    }
    .button:hover {
      background: linear-gradient(135deg, #324090 0%, #7b1fa2 100%);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #666666;
      background-color: #f5f5f5;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 20px 0;
    }
    .info {
      background-color: #e8eaf6;
      border-left: 4px solid #3f51b5;
      padding: 15px;
      margin: 20px 0;
      font-size: 14px;
      border-radius: 4px;
    }
    .signature {
      margin-top: 30px;
      font-style: italic;
    }
    .link {
      font-size: 12px;
      word-break: break-all;
      color: #666;
      margin-top: 10px;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
      }
      .content {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Kinosu</h1>
    </div>
    <div class="content">
      <h2>Şifrə Yeniləmə Tələbi</h2>
      
      <p>Hörmətli ${username || 'İstifadəçi'},</p>
      
      <p>Kinosu hesabınız üçün şifrə yeniləmə tələbi aldıq. Şifrənizi yeniləmək üçün aşağıdakı düyməyə klikləyin:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button" style="color: #e6e6e6 !important; display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3f51b5 0%, #9c27b0 100%); text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">Şifrəni Yenilə</a>
      </div>
      
      <div class="info">
        <p>⚠️ Bu link <strong>1 saat ərzində</strong> etibarlıdır.</p>
        <p>Əgər siz şifrə yeniləmə tələbi göndərməmisinizsə, bu emaili nəzərə almayın və hesabınızın təhlükəsizliyini təmin etmək üçün şifrənizi dəyişdirin.</p>
      </div>
      
      <div class="link">
        Düymə işləmirsə, bu linki kopyalayıb brauzerin ünvan sətrinə yapışdırın:
        <br>
        ${resetUrl}
      </div>
      
      <div class="divider"></div>
      
      <div class="signature">
        <p>Hörmətlə,<br>AZDROID Tech.</p>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${currentYear} Kinosu. Bütün hüquqlar qorunur.</p>
      <p>Bu, avtomatik olaraq yaradılan bir emaildir. Zəhmət olmasa cavab verməyin.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Xoş gəldiniz emaili üçün HTML şablonu (ileride kullanılabilir)
 * 
 * @param username İstifadəçi adı
 * @returns HTML formatında email şablonu
 */
export const getWelcomeTemplate = (username: string): string => {
  const loginUrl = `${FRONTEND_URL}/login`;
  const currentYear = new Date().getFullYear();
  
  return `
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Kinosu - Xoş Gəldiniz</title>
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <style>
    :root {
      color-scheme: light;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background: linear-gradient(135deg, #3f51b5 0%, #9c27b0 100%);
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
      letter-spacing: 1px;
    }
    .content {
      padding: 30px;
      background-color: #ffffff;
      border-left: 1px solid #e0e0e0;
      border-right: 1px solid #e0e0e0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #3f51b5 0%, #9c27b0 100%);
      color: #e6e6e6;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      transition: all 0.3s;
    }
    .button:hover {
      background: linear-gradient(135deg, #324090 0%, #7b1fa2 100%);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #666666;
      background-color: #f5f5f5;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 20px 0;
    }
    .feature {
      display: flex;
      margin: 15px 0;
      align-items: center;
    }
    .feature-icon {
      margin-right: 10px;
      color: #3f51b5;
      font-size: 20px;
    }
    .feature-text {
      flex: 1;
    }
    .signature {
      margin-top: 30px;
      font-style: italic;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
      }
      .content {
        padding: 20px;
      }
      .feature {
        flex-direction: column;
        text-align: center;
      }
      .feature-icon {
        margin-right: 0;
        margin-bottom: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Kinosu</h1>
    </div>
    <div class="content">
      <h2>Kinosu-ya Xoş Gəldiniz, ${username}!</h2>
      
      <p>Hesabınız uğurla yaradıldı. Kinosu ilə artıq izləmək istədiyiniz filmləri izləyə və idarə edə bilərsiniz.</p>
      
      <h3>Kinosu ilə nə edə bilərsiniz?</h3>
      
      <div class="feature">
        <div class="feature-icon">&#128250;</div>
        <div class="feature-text">
          <strong>Filmlərinizi izləyin</strong> - Baxmaq istədiyiniz filmləri siyahıya əlavə edin
        </div>
      </div>
      
      <div class="feature">
        <div class="feature-icon">&#128196;</div>
        <div class="feature-text">
          <strong>İzləmə siyahınızı idarə edin</strong> - Filmlərinizi izləyəcək, izləyən və izlənilmiş kateqoriyalara ayırın
        </div>
      </div>
      
      <div class="feature">
        <div class="feature-icon">&#11088;</div>
        <div class="feature-text">
          <strong>Reytinq verin</strong> - İzlədiyiniz filmlərə şəxsi reytinqinizi verin
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="button" style="color: #e6e6e6 !important; display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3f51b5 0%, #9c27b0 100%); text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">Daxil Olun</a>
      </div>
      
      <div class="divider"></div>
      
      <div class="signature">
        <p>Filmləri izləmək əyləncəli olsun!<br>AZDROID Tech.</p>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${currentYear} Kinosu. Bütün hüquqlar qorunur.</p>
      <p>Bu, avtomatik olaraq yaradılan bir emaildir. Zəhmət olmasa cavab verməyin.</p>
    </div>
  </div>
</body>
</html>
  `;
};
