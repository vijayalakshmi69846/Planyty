import React, { useState, useRef, useEffect } from 'react';
import { Copy, Reply, Forward, Trash2, Smile, Edit } from 'lucide-react';

const MessageActionsModal = ({ 
  isOpen,
  message, 
  isCurrentUser, 
  onClose, 
  position,
  onCopy,
  onReply,
  onForward,
  onDelete,
  onDeleteForEveryone,
  onReact,
  onEdit
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        !event.target.closest('[data-reaction-modal]')
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !message) return null;

  // Calculate position - open to left for sender messages, right for receiver messages
  const modalWidth = 256; // w-64 = 256px
  const modalHeight = 400; // Approximate height
  
  let modalX;
  if (isCurrentUser) {
    // For sender messages (current user), open modal to the LEFT of the click position
    modalX = Math.max(20, position.x - modalWidth - 10);
  } else {
    // For receiver messages, open modal to the RIGHT of the click position
    modalX = Math.min(position.x + 10, window.innerWidth - modalWidth - 20);
  }
  
  const modalY = Math.min(position.y, window.innerHeight - modalHeight - 20);

  const actions = [
    { 
      icon: Copy, 
      label: 'Copy Text', 
      onClick: (_, msg) => onCopy && onCopy(msg.text),
      color: 'text-gray-700',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600'
    },
    { 
      icon: Reply, 
      label: 'Reply', 
      onClick: (_, msg) => onReply && onReply(msg),
      color: 'text-gray-700',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    { 
      icon: Forward, 
      label: 'Forward', 
      onClick: (_, msg) => onForward && onForward(msg),
      color: 'text-gray-700',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    { 
      icon: Smile, 
      label: 'Add Reaction', 
      onClick: (e, msg) => {
        e.preventDefault();
        e.stopPropagation();
        onReact && onReact(msg);
      },
      color: 'text-purple-700',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      highlight: true
    },
  ];

  const userSpecificActions = isCurrentUser ? [
    { 
      icon: Edit, 
      label: 'Edit Message', 
      onClick: (e, msg) => {
        e.preventDefault();
        console.log('Edit clicked for message:', msg && msg.id);
        if (onEdit) onEdit(msg); // if your parent expects id, use onEdit(msg.id)
        if (onClose) onClose();
      },
      color: 'text-gray-700',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600'
    },
    { 
      icon: Trash2, 
      label: 'Delete for me', 
      onClick: (_, msg) => onDelete && onDelete(msg.id),
      color: 'text-red-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      danger: true
    },
    { 
      icon: Trash2, 
      label: 'Delete for everyone', 
      onClick: (_, msg) => onDeleteForEveryone && onDeleteForEveryone(msg.id),
      color: 'text-red-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      danger: true
    },
  ] : [];

  return (
    <div
      ref={modalRef}
      className={`fixed z-50 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 animate-scale-in ${
        isCurrentUser ? 'shadow-lg shadow-purple-100/50 border-purple-100' : 'shadow-lg shadow-blue-100/50 border-blue-100'
      }`}
      style={{
        left: `${modalX}px`,
        top: `${modalY}px`,
      }}
    >
      {/* Removed header as requested */}
      
      {/* Common actions for all messages */}
      <div className="py-1">
        {actions.map((action, index) => (
          <button
            key={index}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick && action.onClick(e, message);
            }}
            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-all duration-200 group ${
              action.color
            } text-sm font-medium rounded-md mx-1`}
          >
            <div className={`p-2 rounded-lg ${action.iconBg} group-hover:scale-110 transition-all duration-200`}>
              <action.icon className={`w-4 h-4 ${action.iconColor}`} />
            </div>
            <span className="flex-1 text-left">{action.label}</span>
            {action.highlight && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${isCurrentUser ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                ✨
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* User-specific actions */}
      {userSpecificActions.length > 0 && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-3 my-1" />
          <div className="py-1">
            {userSpecificActions.map((action, index) => (
              <button
                key={index}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick && action.onClick(e, message);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-all duration-200 group ${
                  action.color
                } text-sm font-medium rounded-md mx-1`}
              >
                <div className={`p-2 rounded-lg ${action.iconBg} group-hover:scale-110 transition-all duration-200`}>
                  <action.icon className={`w-4 h-4 ${action.iconColor}`} />
                </div>
                <span className="flex-1 text-left">{action.label}</span>
                {action.danger && (
                  <span className="text-xs opacity-70">⚠️</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
      
      {/* Optional: Add a subtle indicator of which side it opened from */}
      {isCurrentUser ? (
        <div className="absolute top-3 -right-2 w-4 h-4 bg-white border-r border-t border-gray-200 rotate-45 transform"></div>
      ) : (
        <div className="absolute top-3 -left-2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45 transform"></div>
      )}
    </div>
  );
};

export default MessageActionsModal;