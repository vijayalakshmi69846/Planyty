// modals/MessageActionsModal.jsx - Updated version
import React from 'react';
import { Copy, Reply, Forward, Edit2, Trash2, Eye, EyeOff, X } from 'lucide-react';

const MessageActionsModal = ({
  isOpen,
  message,
  position,
  isCurrentUser,
  onClose,
  onCopy,
  onReply,
  onForward,
  onEdit,
  onDeleteForEveryone,
  onDeleteForMe,
  onReaction
}) => {
  if (!isOpen || !message) return null;

  const modalStyle = {
    position: 'fixed',
    left: `${Math.min(position.x, window.innerWidth - 250)}px`,
    top: `${Math.min(position.y, window.innerHeight - 300)}px`,
    zIndex: 1000
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div 
        className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 w-64 overflow-hidden"
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-800">Message Actions</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-2">
          {/* Copy */}
          <button
            onClick={() => onCopy(message)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Copy size={16} className="text-gray-500" />
            <span>Copy text</span>
          </button>

          {/* Reply */}
          <button
            onClick={() => onReply(message)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Reply size={16} className="text-gray-500" />
            <span>Reply</span>
          </button>

          {/* Forward */}
          <button
            onClick={() => onForward(message)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Forward size={16} className="text-gray-500" />
            <span>Forward</span>
          </button>

          {/* Edit (only for current user's messages) */}
          {isCurrentUser && !message.deleted && (
            <button
              onClick={() => onEdit(message)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Edit2 size={16} className="text-blue-500" />
              <span>Edit</span>
            </button>
          )}

          {/* Delete For Everyone (only for current user's messages) */}
          {isCurrentUser && !message.deleted && (
            <button
              onClick={() => onDeleteForEveryone(message)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} className="text-red-500" />
              <span>Delete for everyone</span>
            </button>
          )}

          {/* Delete For Me */}
          {!message.deleted && (
            <button
              onClick={() => onDeleteForMe(message)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <EyeOff size={16} className="text-gray-500" />
              <span>Delete for me</span>
            </button>
          )}
        </div>

        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Click outside to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessageActionsModal;