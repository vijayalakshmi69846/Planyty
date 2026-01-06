import React, { useState } from 'react';
import { X, Users, Lock, Globe, Hash } from 'lucide-react';

const CreateChannelModal = ({ teamId, onCreate, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'team', // 'team', 'private', or 'public'
    members: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    onCreate({
      ...formData,
      teamId: formData.type === 'team' ? teamId : undefined
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-full max-w-md z-50 animate-in fade-in zoom-in-95">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              Create New Channel
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Channel Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Hash size={18} />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., marketing-team"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Channel Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="What's this channel about?"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Channel Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Channel Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'team' })}
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                    formData.type === 'team'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <Users size={20} />
                  <span className="text-sm font-medium">Team</span>
                  <span className="text-xs text-gray-500">Team members only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'private' })}
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                    formData.type === 'private'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  <Lock size={20} />
                  <span className="text-sm font-medium">Private</span>
                  <span className="text-xs text-gray-500">Invite only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'public' })}
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                    formData.type === 'public'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-purple-300'
                  }`}
                >
                  <Globe size={20} />
                  <span className="text-sm font-medium">Public</span>
                  <span className="text-xs text-gray-500">Everyone</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-6 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Create Channel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateChannelModal;