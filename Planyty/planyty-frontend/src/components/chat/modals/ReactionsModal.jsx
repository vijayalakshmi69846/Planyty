import React, { useState, useEffect } from 'react';

const ReactionsModal = ({ 
  isOpen,
  message, 
  onClose, 
  position, 
  onAddReaction 
}) => {
  const emojis = ['😀', '😍', '😂', '😮', '😢', '👍', '👎', '❤️', '🎉', '🔥'];
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [showToast, setShowToast] = useState(false);

  // auto-hide toast
  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => {
      setShowToast(false);
      setSelectedEmoji(null);
    }, 1800);
    return () => clearTimeout(t);
  }, [showToast]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.reactions-modal')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !message || !message.id) {
    return null;
  }

  const handleEmojiClick = (emoji) => {
    console.log('Emoji clicked:', emoji, 'for message:', message.id);
    setSelectedEmoji(emoji);
    setShowToast(true);
    
    if (onAddReaction && message && message.id) {
      onAddReaction(message.id, emoji);
    }
    
    // delay closing so the toast can render near the message before modal unmounts
    setTimeout(() => {
      onClose && onClose();
    }, 200);
  };

  // Calculate position to stay in viewport
  const modalWidth = emojis.length * 48; // Approximate width based on button count
  const x = Math.min(position.x, window.innerWidth - modalWidth - 20);
  const y = Math.max(20, Math.min(position.y, window.innerHeight - 100));

  return (
    <>
      {/* Minimal Reactions Modal */}
      <div
        className="reactions-modal fixed z-50 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg border border-purple-300/50 p-2 flex items-center gap-1"
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
      >
        {emojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => handleEmojiClick(emoji)}
            className="w-10 h-10 flex items-center justify-center text-xl bg-white/20 hover:bg-white/40 rounded-full transition-all duration-200 hover:scale-125 hover:shadow-md"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Simple toast notification */}
      {showToast && selectedEmoji && (
        (() => {
          // position the floating emoji near the message click position
          const toastOffsetX = 20; // tweak to put it slightly to the right
          const toastOffsetY = 36; // tweak to put it slightly below the click
          const toastX = Math.min(position.x + toastOffsetX, window.innerWidth - 72);
          const toastY = Math.min(position.y + toastOffsetY, window.innerHeight - 72);
          return (
            <div
              className="fixed pointer-events-none"
              style={{ left: `${toastX}px`, top: `${toastY}px`, zIndex: 9999 }}
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-3 shadow-lg flex items-center justify-center text-2xl animate-bounce">
                <span className="text-white">{selectedEmoji}</span>
              </div>
            </div>
          );
        })()
      )}
    </>
  );
};

export default ReactionsModal;