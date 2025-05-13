import { useState, useCallback } from 'react';

type UseCaptchaReturnType = {
  isCaptchaOpen: boolean;
  isCaptchaVerified: boolean;
  openCaptcha: () => void;
  closeCaptcha: () => void;
  verifyCaptcha: () => void;
  resetCaptcha: () => void;
};

/**
 * Captcha doğrulama işlemlerini yönetmek için özel hook
 * @returns Captcha durumu ve işlem fonksiyonları
 */
export const useCaptcha = (): UseCaptchaReturnType => {
  const [isCaptchaOpen, setIsCaptchaOpen] = useState<boolean>(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState<boolean>(false);

  // Captcha modalını aç
  const openCaptcha = useCallback(() => {
    setIsCaptchaOpen(true);
  }, []);

  // Captcha modalını kapat
  const closeCaptcha = useCallback(() => {
    setIsCaptchaOpen(false);
  }, []);

  // Captcha doğrulandığında çağrılır
  const verifyCaptcha = useCallback(() => {
    setIsCaptchaVerified(true);
  }, []);

  // Captcha durumunu sıfırla
  const resetCaptcha = useCallback(() => {
    setIsCaptchaVerified(false);
  }, []);

  return {
    isCaptchaOpen,
    isCaptchaVerified,
    openCaptcha,
    closeCaptcha,
    verifyCaptcha,
    resetCaptcha
  };
};

export default useCaptcha; 