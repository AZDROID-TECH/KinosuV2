/**
 * @az Verilənlər bazası əməliyyatları üçün sadə logger modulu
 * @desc Xətaları və məlumatları konsolda göstərmək üçün yardımçı funksiyalar təqdim edir
 */

// Node.js'nin yerləşik debug mühitini istifadə et 
// (LOG_LEVEL müəyyən edildiyi təqdirdə, əks halda 'error' səviyyəsini istifadə et)
const LOG_LEVEL = process.env.LOG_LEVEL || 'error';

// Log səviyyələri - hər bir səviyyənin bir ədədi dəyəri var ki, 
// bu da göstərilən səviyyənin müqayisəsinə imkan verir
const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Cari log səviyyəsi
const currentLevel = LEVELS[LOG_LEVEL.toLowerCase()] || LEVELS.info;

// Formatlaşdırma köməkçisi
const formatMessage = (level: string, message: string) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

// Logger interfeysi
export const logger = {
  // Kritik xətalar üçün
  error: (message: string, error?: any) => {
    if (currentLevel >= LEVELS.error) {
      console.error(formatMessage('ERROR', message));
      if (error) {
        if (error instanceof Error) {
          console.error(formatMessage('ERROR', `Details: ${error.message}`));
          if (error.stack) {
            console.error(formatMessage('ERROR', `Stack: ${error.stack}`));
          }
        } else {
          console.error(formatMessage('ERROR', `Details: ${JSON.stringify(error)}`));
        }
      }
    }
  },

  // Xəbərdarlıqlar üçün
  warn: (message: string) => {
    if (currentLevel >= LEVELS.warn) {
      console.warn(formatMessage('WARN', message));
    }
  },
}; 