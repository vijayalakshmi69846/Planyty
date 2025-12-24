import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

const ForwardModal = ({ 
  isOpen, 
  onClose, 
  message, 
  channels = [], 
  teams = [], 
  onForward 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChats, setSelectedChats] = useState([]);

  if (!isOpen) return null;

  const allChats = [
    ...channels.map(ch => ({ ...ch, type: 'channel' })),
    ...teams.map(tm => ({ ...tm, type: 'team' })),
  ].filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleChatSelection = (chatId) => {
    setSelectedChats(prev =>
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = () => {
    selectedChats.forEach(chatId => {
      onForward(message, chatId);
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Forward Message</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {allChats.map(chat => (
              <label
                key={chat.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedChats.includes(chat.id)}
                  onChange={() => toggleChatSelection(chat.id)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  {chat.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {chat.type === 'channel' ? `#${chat.name}` : chat.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {chat.type} • {chat.members || 'Multiple'} members
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {selectedChats.length} chat{selectedChats.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleForward}
              disabled={selectedChats.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Forward
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;