import React from 'react';
import { X } from 'lucide-react';

const ReplyPreview = ({ message, onCancel }) => {
  return (
    <div className="mb-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-3 rounded-xl border-l-4 border-blue-500 dark:border-blue-400 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            Replying to {message.senderId || message.sender}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <X size={14} className="text-gray-500" />
        </button>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
        {message.text}
      </p>
    </div>
  );
};

export default ReplyPreview;