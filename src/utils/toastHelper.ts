import { toast, ToastOptions } from 'react-toastify';
import { showCustomToast } from '../components/Common/CustomToast';

// Ümumi toast seçimləri (gələcəkdə lazım ola bilər)
const commonOptions: ToastOptions = {
    // className: 'custom-toast', // Əgər CSS-də ümumi bir sinif varsa
    // bodyClassName: 'custom-toast-body',
    // progressClassName: 'custom-toast-progress',
};

export const showSuccessToast = (message: string) => {
    showCustomToast({ type: 'success', message });
};

export const showErrorToast = (message: string) => {
    showCustomToast({ type: 'error', message });
};

export const showWarningToast = (message: string) => {
    showCustomToast({ type: 'warning', message });
};

export const showInfoToast = (message: string) => {
    showCustomToast({ type: 'info', message });
};

// Gələcəkdə lazım olarsa: xüsusi render üçün
// export const showCustomToast = (content: React.ReactNode, options?: ToastOptions) => {
//     toast(content, {
//         ...commonOptions,
//         ...options,
//     });
// }; 