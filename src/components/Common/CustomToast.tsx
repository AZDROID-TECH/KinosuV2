import React, { useEffect, useRef, useState } from 'react';
import '../../styles/customToast.css';

let toastId = 0;
let listeners: ((toasts: ToastData[]) => void)[] = [];

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: number;
  type: ToastType;
  message: string;
}

let toasts: ToastData[] = [];

export function showCustomToast({ type, message }: { type: ToastType; message: string }) {
  toastId++;
  const id = toastId;
  toasts = [...toasts, { id, type, message }];
  listeners.forEach(fn => fn(toasts));
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    listeners.forEach(fn => fn(toasts));
  }, 3500);
}

export const CustomToastContainer: React.FC = () => {
  const [currentToasts, setCurrentToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    listeners.push(setCurrentToasts);
    setCurrentToasts(toasts);
    return () => {
      listeners = listeners.filter(fn => fn !== setCurrentToasts);
    };
  }, []);

  return (
    <div className="custom-toast-container">
      {currentToasts.map((toast) => (
        <CustomToast key={toast.id} {...toast} />
      ))}
    </div>
  );
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <span className="toast-icon">✔️</span>,
  error: <span className="toast-icon">❌</span>,
  warning: <span className="toast-icon">⚠️</span>,
  info: <span className="toast-icon">ℹ️</span>,
};

const CustomToast: React.FC<ToastData> = ({ type, message }) => {
  const [progress, setProgress] = useState(100);
  const [leaving, setLeaving] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let start = Date.now();
    const duration = 3400;
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.max(0, 100 - (elapsed / duration) * 100));
    }, 30);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setLeaving(true), 3300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className={`custom-toast ${type}`}
      style={{ animation: leaving ? 'toast-slide-out 0.5s forwards' : undefined }}
    >
      {icons[type]}
      <span className="toast-message">{message}</span>
      <div
        className="toast-progress"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default CustomToastContainer; 