import { toast, ToastOptions } from 'react-toastify';

// Ümumi toast seçimləri (gələcəkdə lazım ola bilər)
const commonOptions: ToastOptions = {
    // className: 'custom-toast', // Əgər CSS-də ümumi bir sinif varsa
    // bodyClassName: 'custom-toast-body',
    // progressClassName: 'custom-toast-progress',
};

export const showSuccessToast = (message: string | React.ReactNode, options?: ToastOptions) => {
    toast.success(message, {
        ...commonOptions,
        ...options,
    });
};

export const showErrorToast = (message: string | React.ReactNode, options?: ToastOptions) => {
    toast.error(message, {
        ...commonOptions,
        ...options,
    });
};

export const showWarningToast = (message: string | React.ReactNode, options?: ToastOptions) => {
    toast.warning(message, {
        ...commonOptions,
        ...options,
    });
};

export const showInfoToast = (message: string | React.ReactNode, options?: ToastOptions) => {
    toast.info(message, {
        ...commonOptions,
        ...options,
    });
};

// Gələcəkdə lazım olarsa: xüsusi render üçün
// export const showCustomToast = (content: React.ReactNode, options?: ToastOptions) => {
//     toast(content, {
//         ...commonOptions,
//         ...options,
//     });
// }; 