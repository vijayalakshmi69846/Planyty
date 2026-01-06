import React from 'react';
import { Smile } from 'lucide-react';

const ReactionsDisplay = ({ reactions, onReactionClick }) => {
  if (!reactions || reactions.length === 0) return null;
  
  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 border border-gray-200 shadow-sm">
      {Object.entries(reactionCounts).map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={onReactionClick}
          className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded-full text-sm transition-colors"
        >
          <span className="text-base">{emoji}</span>
          <span className="text-xs text-gray-600 font-medium">{count}</span>
        </button>
      ))}
      <button
        onClick={onReactionClick}
        className="p-1 hover:bg-gray-100 rounded-full"
      >
        <Smile size={14} className="text-gray-500" />
      </button>
    </div>
  );
};

export default ReactionsDisplay;