import React, { useState } from 'react';
import { X, Search, UserPlus, Mail } from 'lucide-react';

const InviteUserModal = ({ isOpen, onClose, channelName, onInvite, usersList }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [email, setEmail] = useState('');
  const [inviteType, setInviteType] = useState('existing'); // 'existing' or 'email'

  if (!isOpen) return null;

  const filteredUsers = usersList.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInvite = () => {
    if (inviteType === 'existing' && selectedUser) {
      onInvite(selectedUser.email, selectedUser.name);
      onClose();
    } else if (inviteType === 'email' && email.trim()) {
      onInvite(email.trim(), '');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Invite to Channel</h3>
                <p className="text-sm text-gray-500">#{channelName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Invite type toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setInviteType('existing')}
              className={`flex-1 py-3 px-4 rounded-xl text-center transition-colors ${
                inviteType === 'existing'
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-purple-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Existing Users
            </button>
            <button
              onClick={() => setInviteType('email')}
              className={`flex-1 py-3 px-4 rounded-xl text-center transition-colors ${
                inviteType === 'email'
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-purple-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Email Invite
            </button>
          </div>

          {/* Existing Users Section */}
          {inviteType === 'existing' && (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="max-h-60 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <div
                      key={user.id || user._id}
                      onClick={() => setSelectedUser(user)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors mb-2 ${
                        selectedUser?.id === user.id
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      {selectedUser?.id === user.id && (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Search size={32} className="mx-auto mb-2 text-gray-300" />
                    <p>No users found</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Email Invite Section */}
          {inviteType === 'email' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-200">
                <Mail className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm font-medium text-blue-700">Send email invitation</p>
                  <p className="text-xs text-blue-600">User will receive an email to join the channel</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={(inviteType === 'existing' && !selectedUser) || (inviteType === 'email' && !email.trim())}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              (inviteType === 'existing' && selectedUser) || (inviteType === 'email' && email.trim())
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-400 cursor-not-allowed'
            }`}
          >
            Send Invitation
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteUserModal;