// Create this component at components/ui/FormToast.jsx
import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Mail, CalendarPlus } from 'lucide-react';

const FormToast = ({ message, type = 'success', onClose, autoClose = true }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [autoClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const bgColor = {
    success: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
    error: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200',
    info: 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
  };

  const iconColor = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600'
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Mail
  };

  const Icon = icons[type];

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-6 z-60 animate-slide-in-right">
      <div className={`${bgColor[type]} border rounded-xl shadow-xl max-w-md backdrop-blur-sm`}>
        <div className="flex p-4">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${iconColor[type]}`} />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {autoClose && (
          <div className={`h-1 w-full ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} animate-progress`} />
        )}
      </div>
    </div>
  );
};