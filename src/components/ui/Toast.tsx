import React, { useState, useEffect } from 'react';
import { CheckCircle, X, ShoppingCart } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show toast with animation
    setIsVisible(true);

    // Auto close after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to finish
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <X className="w-5 h-5 text-red-500" />;
      case 'info':
        return <ShoppingCart className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-white border-l-4 border-l-green-500 shadow-lg shadow-green-100';
      case 'error':
        return 'bg-white border-l-4 border-l-red-500 shadow-lg shadow-red-100';
      case 'info':
        return 'bg-white border-l-4 border-l-blue-500 shadow-lg shadow-blue-100';
      default:
        return 'bg-white border-l-4 border-l-green-500 shadow-lg shadow-green-100';
    }
  };

  return (
    <div
      className={`fixed top-24 right-6 z-50 max-w-sm transform transition-all duration-300 ease-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`rounded-xl border border-gray-200 p-4 ${getColorClasses()}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast Store for managing multiple toasts
interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

let toastId = 0;
const toastListeners: ((toasts: ToastItem[]) => void)[] = [];
let currentToasts: ToastItem[] = [];

export const showToast = (
  message: string,
  type: 'success' | 'error' | 'info' = 'success',
  duration = 3000
) => {
  const id = (++toastId).toString();
  const newToast: ToastItem = { id, message, type, duration };

  currentToasts = [...currentToasts, newToast];
  toastListeners.forEach(listener => listener(currentToasts));

  // Auto remove after duration + animation time
  setTimeout(() => {
    removeToast(id);
  }, duration + 300);
};

export const removeToast = (id: string) => {
  currentToasts = currentToasts.filter(toast => toast.id !== id);
  toastListeners.forEach(listener => listener(currentToasts));
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const updateToasts = (newToasts: ToastItem[]) => {
      setToasts(newToasts);
    };

    toastListeners.push(updateToasts);

    return () => {
      const index = toastListeners.indexOf(updateToasts);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ top: `${6 + index * 5}rem` }}
          className="fixed right-6 z-50"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </>
  );
};

export default Toast;