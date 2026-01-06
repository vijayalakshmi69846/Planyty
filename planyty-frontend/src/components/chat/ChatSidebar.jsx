import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Hash, Plus, Users, Lock, Globe, MessageCircle,
  ChevronDown, ChevronRight, MessageSquare, Settings,
  User, Calendar, CheckSquare, UserPlus, Search, X,
  Bell, Mail, Shield, Crown, Sparkles, Trash2
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import ConfirmationModal from './modals/ConfirmationModal';

const ChatSidebar = ({ 
  activeTab, 
  onTabChange, 
  activeChannel, 
  onChannelSelect,
  channels,
  unreadCounts,
  userRole,
  userName,
  userAvatar,
  userId,
  directUsers,
  onGetDirectUsers,
  onCreateChannel,
  socketStatus,
  onReconnect,
  socket,
  onStartDirectMessage,
  onRefreshChannels,
  onRefreshCurrentChannel
}) => {
  const { addNotification } = useNotifications();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamChannel, setSelectedTeamChannel] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitingChannelId, setInvitingChannelId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingDirectUsers, setIsLoadingDirectUsers] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [clickedUser, setClickedUser] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    dms: true,
    public: true,
    team: true,
    private: true
  });
  
  // Add confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    onConfirm: null,
    channelId: null,
    channelName: '',
    channelType: '',
    isLoading: false
  });
  
  const directUsersContainerRef = useRef(null);
  const currentUserId = userId || '';

  // Helper function to safely get nested properties
  const safeGet = (obj, path, defaultValue = null) => {
    if (!obj) return defaultValue;
    
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) return defaultValue;
      result = result[key];
    }
    
    return result === undefined ? defaultValue : result;
  };

  // Create a map of users by ID for quick lookup
  const usersById = useMemo(() => {
    const map = new Map();
    if (directUsers && Array.isArray(directUsers)) {
      directUsers.forEach(user => {
        if (user && user.id) {
          map.set(user.id, user);
        }
      });
    }
    // Add current user to the map
    if (userId && userName) {
      map.set(userId, {
        id: userId,
        name: userName,
        email: '',
        role: userRole,
        status: 'online'
      });
    }
    return map;
  }, [directUsers, userId, userName, userRole]);

  // Get user by ID from directUsers or usersById map
  const getUserById = useCallback((userId) => {
    return usersById.get(userId);
  }, [usersById]);

  // Function to extract user IDs from dm-ID format
  const extractUserIdsFromDMName = useCallback((dmName) => {
    if (!dmName || !dmName.startsWith('dm-')) return [];
    const ids = dmName.replace('dm-', '').split('-');
    return ids.filter(id => id && id.trim() !== '');
  }, []);

  // Enhanced function to get display name for DM channel
  const getDMDisplayName = useCallback((channel) => {
    if (!channel) return 'Direct Message';
    
    // Priority 1: Use displayName if it's not a dm-ID format
    if (channel.displayName && !channel.displayName.startsWith('dm-')) {
      return channel.displayName;
    }
    
    // Priority 2: Check directMessageUsers array
    if (channel.directMessageUsers && Array.isArray(channel.directMessageUsers)) {
      // Find the other user (not current user)
      const otherUser = channel.directMessageUsers.find(u => u.userId !== currentUserId);
      
      if (otherUser && otherUser.userName && !otherUser.userName.startsWith('dm-')) {
        return otherUser.userName;
      }
      
      // Check if it's a self-message
      if (channel.directMessageUsers.length === 1) {
        const singleUser = channel.directMessageUsers[0];
        if (singleUser.userId === currentUserId && singleUser.userName) {
          return `${singleUser.userName} (Me)`;
        } else if (singleUser.userName) {
          return singleUser.userName;
        }
      }
    }
    
    // Priority 3: Extract from channel name (dm-14-34 format)
    if (channel.name && channel.name.startsWith('dm-')) {
      const ids = extractUserIdsFromDMName(channel.name);
      const otherUserId = ids.find(id => id !== currentUserId && id !== userId);
      
      if (otherUserId) {
        const user = getUserById(otherUserId);
        if (user?.name) {
          return user.name;
        }
      }
      
      // If it's a self-message (same user IDs)
      if (ids.length === 2 && ids[0] === ids[1]) {
        return `${userName} (Me)`;
      }
      
      // If we have both user IDs but can't find names
      if (ids.length === 2) {
        const user1 = getUserById(ids[0]);
        const user2 = getUserById(ids[1]);
        
        if (user1?.name && user2?.name) {
          // Show both names for group chat
          return `${user1.name} & ${user2.name}`;
        }
      }
    }
    
    // Priority 4: Check members array
    if (channel.members && Array.isArray(channel.members)) {
      const otherMemberId = channel.members.find(id => id !== currentUserId);
      if (otherMemberId) {
        const user = getUserById(otherMemberId);
        if (user?.name) {
          return user.name;
        }
      }
    }
    
    // Fallback: Use channel name or default
    return channel.name || 'Direct Message';
  }, [currentUserId, userId, userName, extractUserIdsFromDMName, getUserById]);

  // Enhanced normalizeDMChannel function
  const normalizeDMChannel = useCallback((channel) => {
    if (!channel) return null;
    
    const normalized = { ...channel };
    
    // Mark as DM channel
    normalized.isDirectMessage = true;
    
    // Get display name
    const displayName = getDMDisplayName(channel);
    normalized.displayName = displayName;
    
    // Check if it's a self-message
    normalized.isSelfMessage = displayName.includes('(Me)');
    
    return normalized;
  }, [getDMDisplayName]);

  // Deduplicate channels array
  const deduplicatedChannels = useMemo(() => {
    if (!Array.isArray(channels)) return [];
    
    const uniqueChannels = new Map();
    
    channels.forEach(channel => {
      if (!channel) return;
      
      const channelId = channel._id || channel.id;
      if (!channelId) return;
      
      // If channel already exists, merge properties if needed
      if (uniqueChannels.has(channelId)) {
        const existing = uniqueChannels.get(channelId);
        // Merge important properties
        uniqueChannels.set(channelId, {
          ...existing,
          ...channel,
          // Keep the better displayName if available
          displayName: channel.displayName || existing.displayName,
          // Merge directMessageUsers if both have them
          directMessageUsers: channel.directMessageUsers || existing.directMessageUsers,
          // Merge members arrays
          members: channel.members || existing.members,
        });
      } else {
        uniqueChannels.set(channelId, channel);
      }
    });
    
    return Array.from(uniqueChannels.values());
  }, [channels]);

  // Memoized DM channels calculation with proper deduplication
  const dmChannels = useMemo(() => {
    const dmSet = new Map();
    const result = [];
    
    deduplicatedChannels.forEach(channel => {
      if (!channel) return;
      
      // Check if it's a DM channel
      const isDMName = channel.name && channel.name.startsWith('dm-');
      const hasDirectMessageUsers = channel.directMessageUsers && channel.directMessageUsers.length > 0;
      const isPrivateType = channel.type === 'private' || channel.type === 'direct';
      
      if ((isDMName || hasDirectMessageUsers) && isPrivateType) {
        const normalized = normalizeDMChannel(channel);
        if (normalized) {
          // Use a combination of sorted member IDs for the key to prevent duplicates
          const members = channel.members?.sort() || [];
          const uniqueKey = `dm-${members.join('-')}`;
          
          if (!dmSet.has(uniqueKey)) {
            dmSet.set(uniqueKey, true);
            result.push({
              ...normalized,
              _uniqueKey: uniqueKey // Add unique key for React
            });
          }
        }
      }
    });
    
    return result;
  }, [deduplicatedChannels, normalizeDMChannel]);

  // When switching to direct messages tab, request users
  useEffect(() => {
    if (activeTab === 'direct') {
      if (socket?.connected && userId) {
        setIsLoadingDirectUsers(true);
        onGetDirectUsers && onGetDirectUsers();
      }
    }
  }, [activeTab, socket, userId, onGetDirectUsers]);

  // Reset loading when direct users are received
  useEffect(() => {
    if (directUsers && directUsers.length > 0) {
      setIsLoadingDirectUsers(false);
    }
  }, [directUsers]);

  // Listen for direct channel creation
  useEffect(() => {
    if (!socket) return;

    const handleDirectChannelCreated = ({ channel, history }) => {
      console.log('🎯 Direct channel created event received:', channel.displayName);
      
      // If this is the channel we just clicked on, switch to it
      if (clickedUser && 
          channel.directMessageUsers?.some(u => u.userId === clickedUser.id)) {
        console.log('🔄 Auto-switching to new DM channel:', channel.displayName);
        onChannelSelect(channel._id);
        onTabChange('channels');
        setClickedUser(null); // Reset clicked user
      }
    };

    socket.on('direct_channel_created', handleDirectChannelCreated);

    return () => {
      socket.off('direct_channel_created', handleDirectChannelCreated);
    };
  }, [socket, clickedUser, onChannelSelect, onTabChange]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getChannelIcon = (channel) => {
    if (channel._id === 'general') return <Globe size={14} className="text-blue-500" />;
    if (channel.type === 'public') return <Hash size={14} className="text-green-500" />;
    if (channel.type === 'team') return <Users size={14} className="text-purple-500" />;
    if (channel.type === 'private') return <Lock size={14} className="text-orange-500" />;
    if (channel.isDirectMessage) return <MessageCircle size={14} className="text-pink-500" />;
    return <Hash size={14} />;
  };

  // Get DM channel description (subtitle)
  const getDMChannelDescription = useCallback((channel) => {
    if (!channel) return '';
    
    // Check if it's a self-message
    if (channel.isSelfMessage || channel.displayName?.includes('(Me)')) {
      return 'Personal notes and reminders';
    }
    
    // Try to get the other user
    let otherUserId = null;
    
    // From directMessageUsers
    if (channel.directMessageUsers && Array.isArray(channel.directMessageUsers)) {
      const otherUser = channel.directMessageUsers.find(u => u.userId !== currentUserId);
      if (otherUser) {
        otherUserId = otherUser.userId;
      }
    }
    
    // From channel name (dm-14-34 format)
    if (!otherUserId && channel.name && channel.name.startsWith('dm-')) {
      const ids = extractUserIdsFromDMName(channel.name);
      otherUserId = ids.find(id => id !== currentUserId && id !== userId);
    }
    
    // From members array
    if (!otherUserId && channel.members && Array.isArray(channel.members)) {
      otherUserId = channel.members.find(id => id !== currentUserId);
    }
    
    // Get user info and status
    if (otherUserId) {
      const user = getUserById(otherUserId);
      if (user) {
        const status = user.status || 'offline';
        switch(status.toLowerCase()) {
          case 'online': return '● Online - Active now';
          case 'away': return '○ Away - Recently active';
          case 'offline': return '○ Offline';
          default: return `○ ${status}`;
        }
      }
    }
    
    return 'Direct message';
  }, [currentUserId, userId, extractUserIdsFromDMName, getUserById]);

  // Filter channels by type
  const filterChannelsByType = (type) => {
    if (!Array.isArray(deduplicatedChannels)) return [];
    
    return deduplicatedChannels.filter(channel => {
      if (!channel) return false;
      
      if (type === 'public') return channel.type === 'public' || channel._id === 'general';
      if (type === 'team') return channel.type === 'team';
      if (type === 'private') return channel.type === 'private' && !channel.isDirectMessage;
      if (type === 'dms') return channel.isDirectMessage || 
        (channel.type === 'private' && channel.directMessageUsers?.length > 0) ||
        (channel.type === 'direct' && channel.members?.includes(currentUserId));
      return true;
    });
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'in progress': return 'bg-sky-100 text-sky-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'on hold': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-rose-100 text-rose-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canCreateChannel = userRole === 'team_lead' || userRole === 'admin';

  // Handle delete channel with TOAST CONFIRMATION MODAL
  const showDeleteConfirmation = (channelId, channelName, channelType = 'channel') => {
    if (!socket?.emit) {
      addNotification('Socket connection not available', 'error', '🔌');
      return;
    }
    
    const isGeneral = channelId === 'general';
    const actionType = channelType === 'direct_message' ? 'conversation' : 
                      isGeneral ? 'General channel' : 'channel';
    
    const confirmMessage = isGeneral 
      ? `Are you sure you want to delete the "General" channel? This will delete ALL messages in the general channel and cannot be undone. Only team leads and admins can perform this action.`
      : `Are you sure you want to delete ${channelType === 'direct_message' ? 'this conversation' : `channel "${channelName}"`}? This will delete all messages and cannot be undone.`;
    
    setConfirmationModal({
      isOpen: true,
      type: 'danger',
      title: isGeneral ? 'Delete General Channel' : 
             channelType === 'direct_message' ? 'Delete Conversation' : 'Delete Channel',
      message: confirmMessage,
      channelId,
      channelName,
      channelType,
      isLoading: false,
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, isLoading: true }));
        
        try {
          // Show deleting notification
          addNotification(`Deleting ${actionType} "${channelName}"...`, 'info', '🗑️');
          
          // Emit delete event
          if (channelType === 'direct_message') {
            socket.emit('delete_direct_message', { channelId });
          } else {
            socket.emit('delete_channel', { channelId });
          }
          
          // Close modal after a short delay
          setTimeout(() => {
            setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          }, 500);
          
        } catch (error) {
          addNotification(`Failed to delete ${actionType}: ${error.message}`, 'error', '❌');
          setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
      }
    });
  };

  const handleStartDirectMessage = useCallback((targetUser) => {
    if (!socket?.connected) {
      console.log('❌ Socket not connected');
      addNotification('Socket not connected', 'error', '🔌');
      return;
    }
    
    console.log('📨 Starting direct message with:', targetUser.name);
    setClickedUser(targetUser); // Store clicked user for auto-switching
    
    // Check if DM channel already exists
    const existingDMChannel = dmChannels.find(channel => {
      const members = channel.members || [];
      return members.includes(targetUser.id) && members.includes(currentUserId);
    });
    
    if (existingDMChannel) {
      // If channel exists, switch to it immediately
      console.log('✅ DM channel already exists, switching to:', existingDMChannel.displayName);
      onChannelSelect(existingDMChannel._id);
      onTabChange('channels');
      addNotification(`Opened chat with ${targetUser.name}`, 'success', '💬');
      return;
    }
    
    // Create new DM channel
    console.log('📡 Creating new DM channel with:', targetUser.name);
    onStartDirectMessage && onStartDirectMessage(targetUser.id, targetUser.name);
    
    // Show loading state
    setIsLoadingDirectUsers(true);
    addNotification(`Starting chat with ${targetUser.name}...`, 'info', '🔄');
    
    // Set a timeout to reset loading state
    setTimeout(() => {
      setIsLoadingDirectUsers(false);
    }, 3000);
  }, [socket, dmChannels, currentUserId, onChannelSelect, onTabChange, onStartDirectMessage]);

  const handleInviteUser = (channelId, e) => {
    if (e) e.stopPropagation();
    setInvitingChannelId(channelId);
    setShowInviteModal(true);
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim() || !invitingChannelId || !socket?.connected) {
      addNotification('Please enter a valid email', 'error', '✉️');
      return;
    }
    
    socket.emit('invite_user_to_channel', {
      channelId: invitingChannelId,
      userEmail: inviteEmail.trim()
    });
    
    setShowInviteModal(false);
    setInviteEmail('');
    setInvitingChannelId(null);
    addNotification(`Invitation sent to ${inviteEmail.trim()}`, 'success', '📧');
  };

  // Filter direct users based on search query
  const filteredDirectUsers = directUsers?.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const renderDirectMessagesContent = () => {
    return (
      <div className="flex flex-col h-full">
        {/* Header with Stats */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-blue-50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles size={14} className="text-yellow-500" />
                Direct Messages
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {filteredDirectUsers.length} users available
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                socketStatus === 'connected' ? 'bg-emerald-100 text-emerald-800' :
                socketStatus === 'reconnecting' ? 'bg-amber-100 text-amber-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {socketStatus === 'connected' ? '🟢' : socketStatus === 'reconnecting' ? '🟡' : '🔴'}
              </span>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Users List */}
        <div 
          ref={directUsersContainerRef}
          className="flex-1 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 280px)' }}
        >
          <div className="p-4">
            {isLoadingDirectUsers ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-500">Loading users...</p>
              </div>
            ) : !filteredDirectUsers || filteredDirectUsers.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">
                  {searchQuery ? 'No users found' : 'No users available'}
                </p>
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear search
                  </button>
                ) : (
                  <button
                    onClick={() => onGetDirectUsers && onGetDirectUsers()}
                    className="mt-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Refresh Users
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Include current user for self-messaging */}
                <button
                  onClick={() => handleStartDirectMessage({
                    id: currentUserId,
                    name: `${userName} (Me)`,
                    email: '',
                    role: userRole,
                    status: 'online'
                  })}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-blue-50 border border-transparent hover:border-blue-200 active:scale-[0.98] group"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                      {userName?.charAt(0).toUpperCase() || 'Y'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                      <span className="text-[10px] text-white">✓</span>
                    </div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800 truncate">{userName} (Me)</p>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                        Self Note
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        userRole === 'admin' ? 'bg-rose-100 text-rose-800' :
                        userRole === 'team_lead' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {userRole?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">Message yourself</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                    <MessageCircle size={18} />
                  </div>
                </button>

                {/* Other users */}
                {filteredDirectUsers.map(user => {
                  const existingDMChannel = dmChannels.find(channel => {
                    const members = channel.members || [];
                    return members.includes(user.id) && members.includes(currentUserId);
                  });

                  return (
                    <button
                      key={`user-${user.id || Math.random()}`}
                      onClick={() => handleStartDirectMessage(user)}
                      disabled={isLoadingDirectUsers}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-50 active:scale-[0.98] group disabled:opacity-50 disabled:cursor-not-allowed ${
                        existingDMChannel ? 'border-2 border-blue-200 bg-blue-50/50' : 'border border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="w-12 h-12 rounded-xl object-cover shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                          user.status === 'online' ? 'bg-emerald-500' : 
                          user.status === 'away' ? 'bg-amber-500' : 
                          'bg-gray-400'
                        }`}>
                          <span className="text-[10px] text-white">
                            {user.status === 'online' ? '●' : user.status === 'away' ? '○' : '○'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-800 truncate">{user.name}</p>
                          {existingDMChannel && (
                            <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full font-medium">
                              Chatting
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-600 truncate">{user.email}</p>
                          <span className="text-xs text-gray-500">•</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            user.role === 'admin' ? 'bg-rose-100 text-rose-800' :
                            user.role === 'team_lead' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {user.role?.replace('_', ' ') || 'Member'}
                          </span>
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg transition-colors ${
                        existingDMChannel 
                          ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' 
                          : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                      }`}>
                        {isLoadingDirectUsers && clickedUser?.id === user.id ? (
                          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <MessageCircle size={18} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderChannelsContent = () => {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-purple-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Sparkles size={14} className="text-purple-500" />
              All Channels
            </h3>
            {canCreateChannel && (
              <button
                onClick={onCreateChannel}
                className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-all active:scale-95 shadow-sm"
                title="Create New Channel"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">
              {dmChannels.length} DMs
            </span>
            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
              {filterChannelsByType('public').length} Public
            </span>
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg">
              {filterChannelsByType('team').length} Teams
            </span>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {/* Direct Messages Section */}
          {dmChannels.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => toggleSection('dms')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 transition-colors"
                >
                  <div className={`p-1 rounded ${expandedSections.dms ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    {expandedSections.dms ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </div>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={12} />
                    Direct Messages
                  </span>
                </button>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {dmChannels.length}
                </span>
              </div>
              
              {expandedSections.dms && (
                <div className="space-y-2 ml-4">
                  {dmChannels.map(channel => {
                    // Get display name and description
                    const displayName = channel.displayName || getDMDisplayName(channel);
                    const description = getDMChannelDescription(channel);
                    const isActive = activeChannel === (channel._id || channel.id);
                    const canDelete = userRole === 'admin' || 
                                    (channel.members && channel.members.includes(currentUserId));
                    
                    return (
                      <div key={`dm-${channel._uniqueKey || channel._id || channel.id || Math.random()}`} 
                          className="group relative">
                        <button
                          onClick={() => onChannelSelect(channel._id || channel.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                              : 'text-gray-700 hover:bg-gray-100 hover:shadow-md border border-transparent hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`p-2 rounded-lg ${
                              isActive ? 'bg-white/20' : 'bg-blue-50 text-blue-600'
                            }`}>
                              <MessageCircle size={14} />
                            </div>
                            <div className="text-left min-w-0">
                              <p className="font-medium truncate">
                                {displayName}
                              </p>
                              <p className={`text-xs truncate ${
                                isActive ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {unreadCounts && unreadCounts[channel._id || channel.id] > 0 && (
                              <span className={`px-2 py-1 min-w-[24px] text-center rounded-full text-xs font-bold ${
                                isActive ? 'bg-white/30 text-white' : 'bg-red-500 text-white shadow'
                              }`}>
                                {unreadCounts[channel._id || channel.id]}
                              </span>
                            )}
                          </div>
                        </button>
                        
                        {/* Delete button for DM channels */}
                        {canDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showDeleteConfirmation(channel._id || channel.id, displayName, 'direct_message');
                            }}
                            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                              isActive
                                ? 'hover:bg-white/30 text-white hover:text-red-300'
                                : 'hover:bg-red-50 text-gray-500 hover:text-red-600'
                            }`}
                            title="Delete conversation"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* Public Channels with Delete Button - INCLUDING GENERAL CHANNEL */}
          {filterChannelsByType('public').length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => toggleSection('public')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 transition-colors"
                >
                  <div className={`p-1 rounded ${expandedSections.public ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                    {expandedSections.public ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </div>
                  <span className="flex items-center gap-1">
                    <Hash size={12} />
                    Public Channels
                  </span>
                </button>
                <span className="text-xs font-medium px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                  {filterChannelsByType('public').length}
                </span>
              </div>
              {expandedSections.public && (
                <div className="space-y-2 ml-4">
                  {filterChannelsByType('public').map(channel => {
                    const channelId = channel._id || channel.id;
                    const isActive = activeChannel === channelId;
                    const isGeneral = channelId === 'general' || channel._id === 'general';
                    // UPDATED: Allow both team_lead and admin to delete general channel
                    const canDelete = userRole === 'admin' || userRole === 'team_lead';
                    
                    return (
                      <div key={`public-${channelId}`} className="group relative">
                        <button
                          onClick={() => onChannelSelect(channelId)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                              : 'text-gray-700 hover:bg-gray-100 hover:shadow-md border border-transparent hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`p-2 rounded-lg ${
                              isActive ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {getChannelIcon(channel)}
                            </div>
                            <div className="text-left min-w-0">
                              <p className="font-medium truncate">
                                #{channel.displayName || channel.name || 'Unnamed'}
                              </p>
                              {channel.description && (
                                <p className={`text-xs truncate ${
                                  isActive ? 'text-emerald-100' : 'text-gray-500'
                                }`}>
                                  {channel.description}
                                </p>
                              )}
                              {isGeneral && (
                                <p className="text-xs text-emerald-500 mt-1 font-medium">
                                  Default channel
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {unreadCounts && unreadCounts[channelId] > 0 && (
                              <span className={`px-2 py-1 min-w-[24px] text-center rounded-full text-xs font-bold ${
                                isActive ? 'bg-white/30 text-white' : 'bg-red-500 text-white shadow'
                              }`}>
                                {unreadCounts[channelId]}
                              </span>
                            )}
                          </div>
                        </button>
                        
                        {/* Delete button for authorized users - INCLUDING GENERAL */}
                        {canDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showDeleteConfirmation(channelId, channel.displayName || channel.name, 'channel');
                            }}
                            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                              isActive
                                ? 'hover:bg-white/30 text-white hover:text-red-300'
                                : 'hover:bg-red-50 text-gray-500 hover:text-red-600'
                            }`}
                            title="Delete channel"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Team Channels with Delete Button */}
          {filterChannelsByType('team').length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => toggleSection('team')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-gray-900 transition-colors"
                >
                  <div className={`p-1 rounded ${expandedSections.team ? 'bg-purple-100' : 'bg-gray-100'}`}>
                    {expandedSections.team ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </div>
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    Team Projects
                  </span>
                </button>
                <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                  {filterChannelsByType('team').length}
                </span>
              </div>
              
              {expandedSections.team && (
                <div className="space-y-3 ml-4">
                  {filterChannelsByType('team').map(channel => {
                    const projectInfo = safeGet(channel, 'projectInfo', {});
                    const assignedMembers = safeGet(channel, 'assignedMembers', []);
                    const allMembers = safeGet(channel, 'allMembers', []);
                    const isUserAssigned = Array.isArray(assignedMembers) && 
                      assignedMembers.some(member => member && member.id === currentUserId);
                    const channelName = channel.displayName || channel.name || 'Unnamed Project';
                    const channelId = channel._id || channel.id;
                    const isActive = activeChannel === channelId;
                    const canDelete = userRole === 'admin' || userRole === 'team_lead';
                    
                    return (
                      <div key={`team-${channelId}`} className="group relative">
                        <button
                          onClick={() => onChannelSelect(channelId)}
                          className={`w-full flex flex-col p-4 rounded-xl transition-all text-left ${
                            isActive
                              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-xl'
                              : 'bg-white hover:shadow-lg border border-gray-200 hover:border-purple-200'
                          }`}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between w-full mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`p-2 rounded-lg ${
                                isActive ? 'bg-white/20' : 'bg-purple-50 text-purple-600'
                              }`}>
                                <Users size={14} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold truncate">
                                    {channelName}
                                  </p>
                                  {isUserAssigned && (
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      isActive
                                        ? 'bg-white/30 text-white' 
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      Assigned
                                    </span>
                                  )}
                                </div>
                                {channel.description && (
                                  <p className={`text-xs truncate mt-1 ${
                                    isActive ? 'text-purple-100' : 'text-gray-500'
                                  }`}>
                                    {channel.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {projectInfo && projectInfo.taskCount > 0 && (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  isActive
                                    ? 'bg-white/30 text-white' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {projectInfo.taskCount} tasks
                                </span>
                              )}
                              {unreadCounts && unreadCounts[channelId] > 0 && (
                                <span className="px-2 py-1 min-w-[24px] text-center rounded-full text-xs font-bold bg-red-500 text-white shadow">
                                  {unreadCounts[channelId]}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Project Status */}
                          {projectInfo && projectInfo.status && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                                  isActive ? 'bg-white/20' : getStatusColor(projectInfo.status)
                                }`}>
                                  {projectInfo.status}
                                </span>
                                {projectInfo.progress !== undefined && (
                                  <span className={`text-sm font-bold ${
                                    isActive ? 'text-white' : 'text-gray-800'
                                  }`}>
                                    {projectInfo.progress}%
                                  </span>
                                )}
                              </div>
                              {projectInfo.progress !== undefined && (
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      projectInfo.progress >= 80 ? 'bg-emerald-500' :
                                      projectInfo.progress >= 50 ? 'bg-blue-500' :
                                      projectInfo.progress >= 30 ? 'bg-amber-500' :
                                      'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(projectInfo.progress, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Team Members */}
                          {Array.isArray(allMembers) && allMembers.length > 0 && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex -space-x-2">
                                  {allMembers.slice(0, 5).map((member, idx) => (
                                    member && member.name && (
                                      <div 
                                        key={`member-${member.id || idx}`}
                                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                                          isActive ? 'border-purple-500' : 'border-white'
                                        } ${
                                          member.id === currentUserId 
                                            ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white' 
                                            : isActive
                                              ? 'bg-white text-purple-800'
                                              : 'bg-gray-300 text-gray-700'
                                        }`}
                                        title={member.name}
                                      >
                                        {member.name.charAt(0).toUpperCase()}
                                      </div>
                                    )
                                  ))}
                                </div>
                                {allMembers.length > 5 && (
                                  <span className={`text-xs ml-2 font-medium ${
                                    isActive ? 'text-purple-100' : 'text-gray-500'
                                  }`}>
                                    +{allMembers.length - 5}
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs font-medium ${
                                isActive ? 'text-purple-100' : 'text-gray-500'
                              }`}>
                                {allMembers.length} members
                              </span>
                            </div>
                          )}
                        </button>

                        {/* Action Buttons */}
                        <div className="absolute right-3 top-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                showDeleteConfirmation(channelId, channelName, 'team channel');
                              }}
                              className={`p-2 rounded-lg ${
                                isActive
                                  ? 'bg-white/30 hover:bg-white/40 text-white hover:text-red-300' 
                                  : 'bg-red-50 hover:bg-red-100 text-red-500 shadow-md hover:text-red-600'
                              }`}
                              title="Delete channel"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTeamChannel(channel);
                            }}
                            className={`p-2 rounded-lg ${
                              isActive
                                ? 'bg-white/30 hover:bg-white/40 text-white' 
                                : 'bg-white hover:bg-gray-50 text-gray-700 shadow-md'
                            }`}
                            title="View details"
                          >
                            <Settings size={14} />
                          </button>
                          {canCreateChannel && (
                            <button
                              onClick={(e) => handleInviteUser(channelId, e)}
                              className={`p-2 rounded-lg ${
                                isActive
                                  ? 'bg-white/30 hover:bg-white/40 text-white' 
                                  : 'bg-white hover:bg-gray-50 text-gray-700 shadow-md'
                            }`}
                              title="Invite member"
                            >
                              <UserPlus size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Debug: Log DM channels to see what data we have
  useEffect(() => {
    console.log('📊 DM Channels:', dmChannels);
    console.log('👥 Users by ID map:', usersById);
    console.log('📋 Direct Users:', directUsers);
  }, [dmChannels, usersById, directUsers]);

  return (
    <>
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full shadow-lg">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <MessageSquare size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Team Chat</h1>
                <p className="text-sm text-blue-100">Collaborate & Connect</p>
              </div>
            </div>
            <button
              onClick={() => setShowUserInfo(!showUserInfo)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
            >
              <Settings size={16} className="text-white" />
            </button>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                socketStatus === 'connected' ? 'bg-emerald-400 animate-pulse' :
                socketStatus === 'reconnecting' ? 'bg-amber-400' :
                'bg-rose-400'
              }`} />
              <span className="text-sm font-medium text-white">
                {socketStatus === 'connected' ? 'Connected' :
                 socketStatus === 'reconnecting' ? 'Reconnecting...' :
                 'Disconnected'}
              </span>
            </div>
            {socketStatus !== 'connected' && onReconnect && (
              <button
                onClick={onReconnect}
                className="text-sm font-medium bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg transition-colors"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            className={`flex-1 py-3 text-sm font-semibold transition-all relative ${
              activeTab === 'channels' 
                ? 'text-purple-700 bg-white border-t-2 border-purple-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            onClick={() => onTabChange('channels')}
          >
            <div className="flex items-center justify-center gap-2">
              <Hash size={14} />
              Channels
            </div>
            {activeTab === 'channels' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-purple-600 rounded-full"></div>
            )}
          </button>
          <button
            className={`flex-1 py-3 text-sm font-semibold transition-all relative ${
              activeTab === 'direct' 
                ? 'text-blue-700 bg-white border-t-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            onClick={() => onTabChange('direct')}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageCircle size={14} />
              Messages
            </div>
            {activeTab === 'direct' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"></div>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'direct' ? renderDirectMessagesContent() : renderChannelsContent()}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <button
            onClick={() => setShowUserInfo(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all active:scale-[0.98] shadow-sm"
          >
            <div className="relative">
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={userName || 'User'}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow">
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                socketStatus === 'connected' ? 'bg-emerald-500' :
                socketStatus === 'reconnecting' ? 'bg-amber-500' :
                'bg-gray-400'
              }`} />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-800 truncate">{userName || 'User'}</p>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                  userRole === 'admin' 
                    ? 'bg-rose-100 text-rose-800' 
                    : userRole === 'team_lead'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {userRole === 'admin' ? <Crown size={10} className="inline mr-1" /> :
                   userRole === 'team_lead' ? <Shield size={10} className="inline mr-1" /> :
                   <User size={10} className="inline mr-1" />}
                  {userRole?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {socketStatus === 'connected' ? 'Active now' :
                 socketStatus === 'reconnecting' ? 'Connecting...' :
                 'Offline'}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
              <ChevronRight size={16} />
            </div>
          </button>
        </div>
      </div>

      {/* Confirmation Modal Component */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => !confirmationModal.isLoading && setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        isLoading={confirmationModal.isLoading}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Team Channel Details Modal */}
      {selectedTeamChannel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedTeamChannel.displayName || selectedTeamChannel.name}
                  </h3>
                  <p className="text-purple-100 mt-1">
                    {selectedTeamChannel.description || 'Project team channel'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTeamChannel(null)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Project Info - Only show if projectInfo exists */}
              {selectedTeamChannel.projectInfo && (
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Calendar size={16} className="text-purple-600" />
                    Project Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${getStatusColor(selectedTeamChannel.projectInfo.status)}`}>
                        {selectedTeamChannel.projectInfo.status || 'Not specified'}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Progress</p>
                      <p className="text-lg font-bold text-gray-800">
                        {selectedTeamChannel.projectInfo.progress || 0}%
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Tasks</p>
                      <p className="text-lg font-bold text-gray-800">
                        {selectedTeamChannel.projectInfo.taskCount || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <p className="text-sm font-semibold text-gray-800">Team Project</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h4>
                <div className="flex gap-2">
                  <button className="flex-1 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium">
                    <Mail size={16} className="inline mr-2" />
                    Message Team
                  </button>
                  {canCreateChannel && (
                    <button
                      onClick={(e) => handleInviteUser(selectedTeamChannel._id || selectedTeamChannel.id, e)}
                      className="flex-1 py-3 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors font-medium"
                    >
                      <UserPlus size={16} className="inline mr-2" />
                      Invite Member
                    </button>
                  )}
                </div>
              </div>
              
              {/* Team Members */}
              {selectedTeamChannel.allMembers && selectedTeamChannel.allMembers.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Users size={16} className="text-purple-600" />
                      Team Members ({selectedTeamChannel.allMembers.length})
                    </h4>
                    {canCreateChannel && (
                      <button
                        onClick={(e) => handleInviteUser(selectedTeamChannel._id || selectedTeamChannel.id, e)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        + Add Member
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {selectedTeamChannel.allMembers.map(member => {
                      if (!member || !member.name) return null;
                      
                      const isCurrentUser = member.id === currentUserId;
                      const isAssigned = selectedTeamChannel.assignedMembers?.some(m => m && m.id === member.id);
                      const isCreator = selectedTeamChannel.createdBy === member.id;
                      
                      return (
                        <div key={`modal-member-${member.id}`} className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                          isCurrentUser 
                            ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200' 
                            : 'bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                        }`}>
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow ${
                              isCreator ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                              isCurrentUser ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                              isAssigned ? 'bg-gradient-to-br from-emerald-500 to-green-500' :
                              'bg-gradient-to-br from-gray-500 to-gray-600'
                            }`}>
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`font-semibold ${
                                  isCurrentUser ? 'text-blue-700' : 
                                  isCreator ? 'text-purple-700' : 
                                  'text-gray-800'
                                }`}>
                                  {member.name}
                                </p>
                                {isCurrentUser && (
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                                    You
                                  </span>
                                )}
                                {isCreator && (
                                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                                    <Crown size={10} className="inline mr-1" />
                                    Creator
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                {member.email && (
                                  <p className="text-xs text-gray-500">{member.email}</p>
                                )}
                                {member.role && (
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    member.role === 'team_lead' 
                                      ? 'bg-amber-100 text-amber-800' 
                                      : member.role === 'admin'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {member.role.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {isAssigned && !isCurrentUser && (
                            <span className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full font-medium">
                              ✓ Assigned
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-cyan-600">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Invite to Channel</h3>
                  <p className="text-blue-100 text-sm mt-1">Invite team members via email</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Mail size={16} className="inline mr-2 text-gray-400" />
                  User Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter team member's email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendInvite()}
                />
                <p className="text-xs text-gray-500 mt-2">
                  The user will receive a notification and be added to the channel
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvite}
                  disabled={!inviteEmail.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-md"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatSidebar;