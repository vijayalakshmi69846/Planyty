import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
  '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
  '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
  '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
  '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
  '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
  '😹', '😻', '😼', '😽', '🙀', '😿', '😾'
];

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '😡'];

const ReactionPicker = ({ position, onSelect, onClose }) => {
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Adjust position if near screen edges
  const adjustedPosition = {
    x: Math.min(window.innerWidth - 200, Math.max(100, position.x)),
    y: Math.min(window.innerHeight - 300, Math.max(100, position.y - 150))
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
      />
      <div
        ref={pickerRef}
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border dark:border-gray-700 p-4 animate-in fade-in zoom-in-95"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
          transform: 'translateX(-50%)'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Add Reaction
          </span>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        
        {/* Quick reactions */}
        <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick Reactions</p>
          <div className="flex gap-2">
            {QUICK_REACTIONS.map((emoji, index) => (
              <button
                key={index}
                onClick={() => {
                  console.log('🎯 Quick reaction selected:', emoji);
                  onSelect(emoji);
                }}
                className="p-2 text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        
        {/* All emojis */}
        <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
          {EMOJIS.map((emoji, index) => (
            <button
              key={index}
              onClick={() => {
                console.log('🎯 Emoji selected:', emoji);
                onSelect(emoji);
              }}
              className="p-2 text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hover:scale-110 transform duration-200"
            >
              {emoji}
            </button>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Click an emoji to react
          </p>
        </div>
      </div>
    </>
  );
};

export default ReactionPicker;