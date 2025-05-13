import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { getPasswordResetTemplate } from '../templates/emailTemplates';
import { TABLES, getClient } from '../utils/supabase';

// .env faylını yüklə
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Email doğrulama için regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  reset_token?: string | null;
  reset_token_expiry?: number | null;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Email bağlantısını doğrula (sessizce)
transporter.verify((error) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  }
});

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body;

    // Doğrulama: Gerekli alanlar var mı?
    if (!username || !password) {
      return res.status(400).json({ error: 'İstifadəçi adı və şifrə tələb olunur' });
    }
    
    // Email formatını doğrula
    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Düzgün e-poçt ünvanı daxil edin' });
    }

    // Kullanıcı zaten mevcut mu?
    const client = getClient();
    let query = client
      .from(TABLES.USERS)
      .select('*');
      
    // Kullanıcı adı kontrolü
    const { data: existingUserByName, error: nameCheckError } = await query
      .eq('username', username)
      .maybeSingle();
      
    if (nameCheckError) {
      console.error('İstifadəçi adı yoxlama xətası:', nameCheckError);
      return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
    }
    
    // Email varsa ve kullanıcı adı bulunamadıysa, email kontrolü yap
    let existingUser = existingUserByName;
    if (!existingUser && email) {
      const { data: existingUserByEmail, error: emailCheckError } = await client
        .from(TABLES.USERS)
        .select('*')
        .eq('email', email)
        .maybeSingle();
        
      if (emailCheckError) {
        console.error('E-poçt yoxlama xətası:', emailCheckError);
        return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
      }
      
      existingUser = existingUserByEmail;
    }

    if (existingUser) {
      return res.status(409).json({ error: 'İstifadəçi adı və ya e-poçt artıq istifadə olunur' });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı oluştur
    
    const { error: insertError } = await client
      .from(TABLES.USERS)
      .insert({
        username,
        password: hashedPassword,
        email: email || null,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('İstifadəçi yaratma xətası (detaylı):', JSON.stringify(insertError));
      return res.status(500).json({ error: 'İstifadəçi yaratma zamanı xəta baş verdi' });
    }
    
    res.status(201).json({ message: 'İstifadəçi uğurla qeydiyyatdan keçdi' });
  } catch (error) {
    console.error('Qeydiyyat zamanı xəta baş verdi:', error);
    res.status(500).json({ error: 'Server xətası baş verdi' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Doğrulama: Gerekli alanlar var mı?
    if (!username || !password) {
      return res.status(400).json({ error: 'İstifadəçi adı və şifrə tələb olunur' });
    }

    // Kullanıcıyı bul - hem kullanıcı adı hem de email ile arama yap
    const client = getClient();
    
    // Önce kullanıcı adına göre ara
    let { data: user, error: userError } = await client
      .from(TABLES.USERS)
      .select('*')
      .eq('username', username)
      .maybeSingle();

    // Kullanıcı adıyla bulunamadıysa ve girilen değer email formatındaysa email olarak ara
    if (!user && EMAIL_REGEX.test(username)) {
      const { data: userByEmail, error: emailError } = await client
        .from(TABLES.USERS)
        .select('*')
        .eq('email', username)
        .maybeSingle();
      
      if (emailError) {
        console.error('Email sorğu xətası:', emailError);
        return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
      }
      
      user = userByEmail;
    } else if (userError) {
      console.error('İstifadəçi sorğu xətası:', userError);
      return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Yanlış istifadəçi adı/email və ya şifrə' });
    }

    // Şifreyi doğrula
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Yanlış istifadəçi adı/email və ya şifrə' });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Giriş zamanı xəta baş verdi:', error);
    res.status(500).json({ error: 'Server xətası baş verdi' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email ünvanı daxil edilməlidir' });
  }

  try {
    const client = getClient();
    const { data: user, error: userError } = await client
      .from(TABLES.USERS)
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error('İstifadəçi sorğu xətası:', userError);
      return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
    }

    if (!user) {
      return res.status(404).json({ error: 'Bu email ünvanına aid istifadəçi tapılmadı' });
    }

    // Generate a token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Update user with reset token
    const { error: updateError } = await client
      .from(TABLES.USERS)
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Token yeniləmə xətası:', updateError);
      return res.status(500).json({ error: 'Şifrə sıfırlama token\'i yaradılarkən xəta baş verdi' });
    }

    // Yeni oluşturduğumuz şablon fonksiyonunu kullanıyoruz
    const emailHtml = getPasswordResetTemplate(resetToken, user.username);

    await transporter.sendMail({
      from: {
        name: 'Kinosu Film Platforması',
        address: SMTP_USER
      },
      to: email,
      subject: 'Kinosu - Şifrə Yeniləmə Tələbi',
      html: emailHtml,
      headers: {
        'X-Priority': '1', // Yüksek öncelik
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    });

    res.json({ message: 'Şifrə yeniləmə linki email ünvanınıza göndərildi' });
  } catch (error) {
    console.error('Şifrə yeniləmə xətası:', error);
    res.status(500).json({ error: 'Şifrə yeniləmə tələbi zamanı xəta baş verdi' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token və yeni şifrə tələb olunur' });
  }

  try {
    const client = getClient();
    const now = Date.now();

    // Find user with valid reset token
    const { data: user, error: userError } = await client
      .from(TABLES.USERS)
      .select('*')
      .eq('reset_token', token)
      .gt('reset_token_expiry', now)
      .maybeSingle();

    if (userError) {
      console.error('İstifadəçi axtarma xətası:', userError);
      return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
    }

    if (!user) {
      return res.status(400).json({ error: 'Etibarsız və ya vaxtı keçmiş token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user with new password and remove reset token
    const { error: updateError } = await client
      .from(TABLES.USERS)
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Şifrə yeniləmə xətası:', updateError);
      return res.status(500).json({ error: 'Şifrə yeniləmə zamanı xəta baş verdi' });
    }

    res.json({ message: 'Şifrə uğurla yeniləndi' });
  } catch (error) {
    console.error('Şifrə sıfırlama xətası:', error);
    res.status(500).json({ error: 'Server xətası baş verdi' });
  }
}; 