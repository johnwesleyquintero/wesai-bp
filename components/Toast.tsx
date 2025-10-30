import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  type?: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'success' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses = 'fixed top-5 right-5 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold animate-fade-in-out';
  const typeClasses = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`${baseClasses} ${typeClasses}`} role="alert">
      {message}
    </div>
  );
};
