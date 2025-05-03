import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

// JWT token imzalama
export const signToken = (payload: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload, 
      JWT_SECRET, 
      { expiresIn: '7d' }, 
      (err, token) => {
        if (err) reject(err);
        else resolve(token as string);
      }
    );
  });
};

// JWT token doğrulama
export const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
}; 