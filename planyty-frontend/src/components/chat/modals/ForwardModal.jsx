// ForwardModal.jsx
import React, { useState } from 'react';
import { X, Search, Hash, Users, MessageSquare } from 'lucide-react';

const ForwardModal = ({ 
  message, 
  currentChannel, 
  channels,
  usersList,
  onForward, 
  onClose 
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('channels'); // 'channels' or 'users'
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  // Filter channels (exclude current channel and DMs)
  const filteredChannels = channels.filter(channel => 
    channel._id !== currentChannel &&
    !channel.isDirectMessage &&
    channel.name.toLowerCase().includes(search.toLowerCase())
  );

  // Filter users (exclude current user)
  const filteredUsers = usersList.filter(user => 
    user.id !== message?.senderId &&
    user.name.toLowerCase().includes(search.toLowerCase())
  );

// ForwardModal.jsx - Update the handleForward function
const handleForward = () => {
  if (selectedType === 'channels' && selectedChannel) {
    // Forward to channel
    onForward(message, selectedChannel);
  } else if (selectedType === 'users' && selectedUser) {
    // Forward to user
    const targetUser = usersList.find(u => u.id === selectedUser);
    onForward(message, targetUser);
  }
};

  const getChannelDisplayName = (channel) => {
    if (channel._id === 'general') return 'General';
    if (channel.displayName) return channel.displayName;
    return channel.name;
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md z-50 animate-in fade-in zoom-in-95">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              Forward Message
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Message Preview */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm">
                {(message.senderName || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {message.senderName || message.senderId}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
              {message.text || 'File/voice message'}
            </p>
          </div>

          {/* Search and Tabs */}
          <div className="mb-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setSelectedType('channels');
                  setSearch('');
                }}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  selectedType === 'channels'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Hash size={16} />
                  <span>Channels</span>
                </div>
              </button>
              <button
                onClick={() => {
                  setSelectedType('users');
                  setSearch('');
                }}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  selectedType === 'users'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users size={16} />
                  <span>Direct Messages</span>
                </div>
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={`Search ${selectedType === 'channels' ? 'channels...' : 'users...'}`}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border dark:border-gray-700 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Results */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedType === 'channels' ? (
                filteredChannels.length > 0 ? (
                  filteredChannels.map(channel => (
                    <button
                      key={channel._id}
                      onClick={() => setSelectedChannel(channel._id)}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                        selectedChannel === channel._id
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Hash size={18} />
                      <span className="font-medium">{
                        channel._id === 'general' ? 'General' : 
                        channel.displayName || channel.name
                      }</span>
                      <span className="text-xs opacity-75 ml-auto">
                        {channel.type}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No channels found</p>
                  </div>
                )
              ) : (
                filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user.id)}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                        selectedUser === user.id
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs opacity-75">{user.role || 'User'}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleForward}
              disabled={selectedType === 'channels' ? !selectedChannel : !selectedUser}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
                (selectedType === 'channels' && selectedChannel) || 
                (selectedType === 'users' && selectedUser)
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {selectedType === 'channels' ? 'Forward to Channel' : 'Send to User'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForwardModal;