import React from 'react';
import { CalendarPlus, Sparkles } from 'lucide-react';

const ScheduleButton = ({ onClick, isLoading = false, disabled = false, size = 'md' }) => {
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        relative group inline-flex items-center justify-center
        ${sizes[size]} font-medium rounded-xl
        bg-gradient-to-r from-purple-600 to-blue-500
        hover:from-purple-700 hover:to-blue-600
        active:from-purple-800 active:to-blue-700
        text-white shadow-lg
        hover:shadow-xl
        transform hover:-translate-y-0.5
        transition-all duration-200
        ${(disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}
        overflow-hidden
      `}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-75 group-hover:opacity-100 transition-opacity duration-200" />
      
      {/* Animated sparkles */}
      <div className="absolute inset-0 overflow-hidden">
        <Sparkles className="absolute -top-2 -left-2 w-4 h-4 text-white/30 animate-pulse-slow" />
        <Sparkles className="absolute -bottom-2 -right-2 w-4 h-4 text-white/30 animate-pulse-slow delay-300" />
      </div>
      
      {/* Content */}
      <div className="relative flex items-center space-x-2">
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            <span>Scheduling...</span>
          </>
        ) : (
          <>
            <CalendarPlus className={`${iconSizes[size]}`} />
            <span className="font-semibold">Schedule Meeting</span>
          </>
        )}
      </div>
      
      {/* Hover ring effect */}
      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-white/20 transition-colors duration-200" />
    </button>
  );
};

export default ScheduleButton;