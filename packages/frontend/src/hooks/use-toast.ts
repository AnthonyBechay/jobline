import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

let toastId = 0;

export const useToast = (): ToastState => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${toastId++}`;
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);
    
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

// Simple toast helper functions
export const toast = {
  success: (message: string, duration?: number) => {
    console.log('Success:', message);
  },
  error: (message: string, duration?: number) => {
    console.error('Error:', message);
  },
  info: (message: string, duration?: number) => {
    console.info('Info:', message);
  },
  warning: (message: string, duration?: number) => {
    console.warn('Warning:', message);
  },
};
