import React, { useState, useMemo } from 'react';
import { Hash, Lock, Plus, Users, MessageSquare, Bell, Search, ChevronDown, ChevronRight, X, Settings } from 'lucide-react';
import CreateTeamModal from './modals/CreateTeamModal';
import CreateChannelModal from './modals/CreateChannelModal';

const ChatSidebar = ({
  activeTab,
  onTabChange,
  activeChannel,
  onChannelSelect,
  activeTeam,
  onTeamSelect,
  onNewChannel,
  onNewDirectMessage,
  channels = [],
  teams = [],
  onCreateTeam,
  getUnreadCount
}) => {
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    messageSounds: true,
    desktopNotifications: true,
    emailNotifications: false,
    mentionSounds: true,
    reactionNotifications: true,
    threadNotifications: false,
    doNotDisturb: false,
    doNotDisturbStart: '22:00',
    doNotDisturbEnd: '08:00'
  });
  
  // Only show sections based on activeTab
  const expandedSections = {
    channels: activeTab === 'channels',
    teams: activeTab === 'teams',
    dms: activeTab === 'dms'
  };

  // Memoize filtered channels and teams for performance
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    return channels.filter(channel =>
      channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [channels, searchQuery]);

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    return teams.filter(team =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teams, searchQuery]);

  // Direct Messages list (static for now)
  const directMessages = [
    { id: 'dm_john', name: 'John Doe', status: 'online', unread: 0 },
    { id: 'dm_alice', name: 'Alice Smith', status: 'away', unread: 2 },
    { id: 'dm_bob', name: 'Bob Johnson', status: 'offline', unread: 0 }
  ];

  const filteredDMs = useMemo(() => {
    if (!searchQuery.trim()) return directMessages;
    return directMessages.filter(dm =>
      dm.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleCreateTeamSubmit = (teamData) => {
    onCreateTeam(teamData);
    setShowCreateTeamModal(false);
  };

  const handleCreateChannelSubmit = (channelData) => {
    onNewChannel(channelData);
    setShowCreateChannelModal(false);
  };

  const handleNotificationSettingChange = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Show only the section for the active tab
  const renderActiveSection = () => {
    switch (activeTab) {
      case 'channels':
        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <ChevronDown className="w-4 h-4" />
                Channels ({channels.length})
              </div>
              <button
                onClick={() => setShowCreateChannelModal(true)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Create channel"
              >
                <Plus className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-1">
              {filteredChannels.map((channel) => {
                const isActive = activeChannel === channel.id;
                const unreadCount = getUnreadCount ? getUnreadCount(channel.id) : 0;
                
                return (
                  <button
                    key={channel.id}
                    onClick={() => onChannelSelect(channel.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-purple-50 text-purple-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {channel.private ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Hash className="w-4 h-4" />
                      )}
                      <span className="truncate">{channel.name}</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
              
              {filteredChannels.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500 italic">
                  {searchQuery ? 'No matching channels' : 'No channels yet'}
                </div>
              )}
            </div>
          </div>
        );

      case 'teams':
        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <ChevronDown className="w-4 h-4" />
                Teams ({teams.length})
              </div>
              <button
                onClick={() => setShowCreateTeamModal(true)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Create team"
              >
                <Plus className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-1">
              {filteredTeams.map((team) => {
                const isActive = activeTeam === team.id;
                const unreadCount = getUnreadCount ? getUnreadCount(team.id) : 0;
                
                return (
                  <button
                    key={team.id}
                    onClick={() => onTeamSelect(team.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-purple-50 text-purple-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="truncate">{team.name}</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
              
              {filteredTeams.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500 italic">
                  {searchQuery ? 'No matching teams' : 'No teams yet'}
                </div>
              )}
            </div>
          </div>
        );

      case 'dms':
        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <ChevronDown className="w-4 h-4" />
                Direct Messages
              </div>
              <button
                onClick={onNewDirectMessage}
                className="p-1 hover:bg-gray-100 rounded"
                title="New DM"
              >
                <Plus className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-1">
              {filteredDMs.map((dm) => {
                const isActive = activeChannel === dm.id;
                
                return (
                  <button
                    key={dm.id}
                    onClick={() => {
                      onChannelSelect(dm.id);
                      onTabChange('dms');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-purple-50 text-purple-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-medium">
                          {dm.name.charAt(0)}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full ${
                          dm.status === 'online' ? 'bg-green-500' :
                          dm.status === 'away' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`} />
                      </div>
                      <span className="truncate">{dm.name}</span>
                    </div>
                    {dm.unread > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                        {dm.unread}
                      </span>
                    )}
                  </button>
                );
              })}
              
              {filteredDMs.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500 italic">
                  {searchQuery ? 'No matching DMs' : 'No DMs yet'}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Notification Settings Modal
  const NotificationSettingsModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Notification Settings</h2>
                  <p className="text-sm text-gray-600">Manage your chat notification preferences</p>
                </div>
              </div>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* General Notifications */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">General Settings</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Message Sounds</p>
                    <p className="text-xs text-gray-500">Play sound for new messages</p>
                  </div>
                  <button
                    onClick={() => handleNotificationSettingChange('messageSounds')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      notificationSettings.messageSounds ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      notificationSettings.messageSounds ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Desktop Notifications</p>
                    <p className="text-xs text-gray-500">Show desktop notifications</p>
                  </div>
                  <button
                    onClick={() => handleNotificationSettingChange('desktopNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      notificationSettings.desktopNotifications ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      notificationSettings.desktopNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Email Notifications</p>
                    <p className="text-xs text-gray-500">Receive email summaries</p>
                  </div>
                  <button
                    onClick={() => handleNotificationSettingChange('emailNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      notificationSettings.emailNotifications ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Specific Notifications */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Chat Notifications</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Mention Sounds</p>
                    <p className="text-xs text-gray-500">Play sound when mentioned</p>
                  </div>
                  <button
                    onClick={() => handleNotificationSettingChange('mentionSounds')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      notificationSettings.mentionSounds ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      notificationSettings.mentionSounds ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Reaction Notifications</p>
                    <p className="text-xs text-gray-500">Notify when someone reacts to your messages</p>
                  </div>
                  <button
                    onClick={() => handleNotificationSettingChange('reactionNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      notificationSettings.reactionNotifications ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      notificationSettings.reactionNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Thread Notifications</p>
                    <p className="text-xs text-gray-500">Notify about thread replies</p>
                  </div>
                  <button
                    onClick={() => handleNotificationSettingChange('threadNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      notificationSettings.threadNotifications ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      notificationSettings.threadNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Do Not Disturb */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Do Not Disturb</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Enable Do Not Disturb</p>
                    <p className="text-xs text-gray-500">Silence notifications during set hours</p>
                  </div>
                  <button
                    onClick={() => handleNotificationSettingChange('doNotDisturb')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      notificationSettings.doNotDisturb ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      notificationSettings.doNotDisturb ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {notificationSettings.doNotDisturb && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={notificationSettings.doNotDisturbStart}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          doNotDisturbStart: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={notificationSettings.doNotDisturbEnd}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          doNotDisturbEnd: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="w-64 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">Chat</h1>
            <div className="flex items-center gap-2">
              {/* REMOVED: Add member button */}
              {/* Only keep notification button */}
              <button 
                onClick={() => setShowNotificationsModal(true)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors relative"
                title="Notification Settings"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {/* Optional: Show notification badge */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages, files, people..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'channels' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => onTabChange('channels')}
          >
            Channels
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'teams' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => onTabChange('teams')}
          >
            Teams
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'dms' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => onTabChange('dms')}
          >
            DMs
          </button>
        </div>

        {/* Content Area - Only show active section */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderActiveSection()}
        </div>

        {/* Simple Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            {activeTab === 'channels' && `${channels.length} channels`}
            {activeTab === 'teams' && `${teams.length} teams`}
            {activeTab === 'dms' && `${directMessages.length} direct messages`}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateTeamModal && (
        <CreateTeamModal
          onSubmit={handleCreateTeamSubmit}
          onClose={() => setShowCreateTeamModal(false)}
        />
      )}

      {showCreateChannelModal && (
        <CreateChannelModal
          onSubmit={handleCreateChannelSubmit}
          onClose={() => setShowCreateChannelModal(false)}
        />
      )}

      {/* Notification Settings Modal */}
      {showNotificationsModal && <NotificationSettingsModal />}
    </>
  );
};

export default ChatSidebar;