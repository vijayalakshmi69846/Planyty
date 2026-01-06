import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import ChatSidebar from './ChatSidebar';
import ChatMessages from './ChatMessages';
import CreateChannelModal from './modals/CreateChannelModal';
import { useNotifications } from '../../contexts/NotificationContext';
import ReactionPicker from './modals/ReactionPicker';
import ForwardModal from './modals/ForwardModal';
import { AuthContext } from '../../contexts/AuthContext';

const SOCKET_URL = 'http://localhost:5000';

const Chat = () => {
  const { user: authUser, logout: authLogout } = useContext(AuthContext);
  const { addNotification } = useNotifications();
  
  const socket = useRef(null);
const getToken = () => {
  // First check if token is in authUser
  if (authUser?.token) {
    return authUser.token;
  }
  
  // Check localStorage for token
  const storedToken = localStorage.getItem('token') || 
                     localStorage.getItem('planyty_token');
  
  // Clean the token
  if (storedToken && storedToken !== 'undefined' && storedToken !== '[object Object]') {
    const cleanToken = storedToken.replace(/"/g, '').trim();
    
    // Decode token to check expiry
    try {
      const decoded = JSON.parse(atob(cleanToken.split('.')[1]));
      const expiryTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      
      // Check if token expires in less than 5 minutes
      if (expiryTime - currentTime < 5 * 60 * 1000) {
        console.log('Token expiring soon, refreshing...');
        // Trigger token refresh
        refreshTokenAndReconnect();
        return null;
      }
      
      return cleanToken;
    } catch (error) {
      console.error('Token decode error:', error);
      return cleanToken;
    }
  }
  
  return null;
};
// Add token refresh function
const refreshTokenAndReconnect = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken') || 
                        localStorage.getItem('planyty_token');
    
    if (!refreshToken) {
      console.error('No refresh token available');
      authLogout();
      return;
    }
    
    // Clean the refresh token
    const cleanRefreshToken = refreshToken.replace(/"/g, '').trim();
    
    // Call refresh token endpoint
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
      { refreshToken: cleanRefreshToken },
      { withCredentials: true }
    );
    
    const { token: newAccessToken } = response.data;
    
    // Update stored token
    localStorage.setItem('token', newAccessToken);
    localStorage.setItem('planyty_token', newAccessToken);
    
    // Update axios header
    api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
    
    // Reconnect socket with new token
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
    }
    
    // Re-initialize socket
    initializeSocket();
    
  } catch (error) {
    console.error('Token refresh failed:', error);
    authLogout();
  }
};
  // User state - DECLARED AT THE TOP
  const user = authUser;
  const token = getToken();
  
  const currentUser = user?.id ? String(user.id) : 'anonymous';
  const userName = user?.name || user?.username || 'User';
  const userRole = user?.role || 'team_member';
  const teamId = user?.teamId ? String(user.teamId) : null;
  const userAvatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`;
  
  const [activeTab, setActiveTab] = useState('channels');
  const [activeChannel, setActiveChannel] = useState('general');
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState({});
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [usersList, setUsersList] = useState([]);
  const [directUsers, setDirectUsers] = useState([]);
  
  const [editingMessage, setEditingMessage] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editText, setEditText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState({ 
    show: false, 
    message: null, 
    position: { x: 0, y: 0 } 
  });
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const processedMessageIds = useRef(new Set());
  const lastDeletedChannelId = useRef(null);
  const skipActiveChannelUpdate = useRef(false);
  const rejoinChannelAttempts = useRef({});
  const typingTimeoutRef = useRef(null);

  // Clear processed message IDs when changing channel
  useEffect(() => {
    processedMessageIds.current.clear();
  }, [activeChannel]);
// In your Chat component - Add this useEffect
useEffect(() => {
  // Check token expiry every minute
  const tokenCheckInterval = setInterval(() => {
    const token = getToken();
    if (!token) {
      // Token is expired or invalid, try to refresh
      refreshTokenAndReconnect();
    }
  }, 60 * 1000); // Check every minute

  return () => clearInterval(tokenCheckInterval);
}, []);
  // Initialize socket with better error handling
  const initializeSocket = useCallback(() => {
    console.log('🔌 Attempting socket initialization...', {
      hasUser: !!user?.id,
      hasToken: !!token,
      userId: user?.id,
      userName
    });
    
    if (!user?.id || !token) {
      console.log('⚠️ Cannot initialize socket: Missing user or token');
      addNotification('Please login to use chat', 'error');
      return;
    }
    
    if (socket.current?.connected) {
      console.log('✅ Socket already connected');
      return;
    }
    
    console.log('🔌 Initializing socket connection for user:', userName);
    
    // Clean up existing socket
    if (socket.current) {
      console.log('🧹 Cleaning up previous socket');
      socket.current.removeAllListeners();
      socket.current.disconnect();
      socket.current = null;
    }
    
    try {
      socket.current = io(SOCKET_URL, { 
        withCredentials: true,
        autoConnect: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
        auth: {
          token: token,
          userId: String(user.id),
          userName: user.name || user.username || 'User',
          userRole: user.role || 'team_member',
          teamId: user.teamId ? String(user.teamId) : null
        }
      });

      console.log('✅ Socket instance created, setting up listeners...');
      setupSocketListeners();
      
    } catch (error) {
      console.error('❌ Failed to create socket:', error);
      setSocketStatus('error');
      addNotification('Failed to connect to chat server', 'error');
    }
  }, [user, token, addNotification, userName]);

  // Setup socket listeners - UPDATED WITH REJOIN LOGIC
  const setupSocketListeners = useCallback(() => {
    if (!socket.current) {
      console.log('⚠️ No socket available for listener setup');
      return;
    }

    console.log('📡 Setting up socket listeners...');

    const currentSocket = socket.current;

    // Connection events
    currentSocket.on('connect', () => {
      console.log('✅ Socket connected! ID:', currentSocket.id);
      setSocketStatus('connected');
      addNotification('Connected to chat', 'success');
      
      // Reset rejoin attempts
      rejoinChannelAttempts.current = {};
      
      // Get available channels
      console.log('📡 Requesting channels list...');
      currentSocket.emit('get_channels');
      
      // Get users list for mentions
      currentSocket.emit('get_users');
      
      // Auto-join active channel with retry logic
      const rejoinCurrentChannel = () => {
        if (activeChannel && currentSocket.connected) {
          console.log(`📡 Rejoining current channel: ${activeChannel}`);
          currentSocket.emit('join_channel', activeChannel);
          
          // Reset unread counts for this channel
          setUnreadCounts(prev => ({
            ...prev,
            [activeChannel]: 0
          }));
        }
      };
      
      // Give socket a moment to stabilize
      setTimeout(rejoinCurrentChannel, 500);
    });

    // Enhanced disconnect handler
    currentSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected. Reason:', reason);
      setSocketStatus('disconnected');
      
      // Only show notification for unexpected disconnections
      if (reason !== 'io client disconnect') {
        addNotification('Disconnected from chat server', 'warning');
      }
    });

    currentSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
      setSocketStatus('error');
      addNotification(`Connection error: ${err.message}`, 'error');
    });

    // Reconnection events
    currentSocket.on('reconnecting', (attemptNumber) => {
      console.log(`🔄 Reconnecting... Attempt ${attemptNumber}`);
      setSocketStatus('reconnecting');
      addNotification('Reconnecting to chat...', 'info');
    });

    currentSocket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setSocketStatus('connected');
      addNotification('Reconnected to chat', 'success');
      
      // Rejoin all channels on reconnect
      setTimeout(() => {
        if (currentSocket.connected) {
          console.log('🔄 Rejoining all channels after reconnect...');
          
          // Rejoin active channel
          if (activeChannel) {
            console.log(`📡 Rejoining active channel: ${activeChannel}`);
            currentSocket.emit('join_channel', activeChannel);
          }
          
          // Refresh channels list
          currentSocket.emit('get_channels');
        }
      }, 1000);
    });

    currentSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      setSocketStatus('failed');
      addNotification('Failed to reconnect. Please refresh the page.', 'error');
    });

    // Handle channel creation IMMEDIATELY
    currentSocket.on('channel_created', (newChannel) => {
      console.log('✅ Channel created event received:', newChannel.name);
      
      // Immediately update channels list
      setChannels(prev => {
        const exists = prev.find(c => c._id === newChannel._id);
        if (exists) return prev;
        
        const updatedChannels = [...prev, newChannel];
        console.log('📋 Channels list immediately updated:', updatedChannels.length);
        return updatedChannels;
      });
      
      // Auto-switch to the new channel
      setActiveChannel(newChannel._id);
      setActiveTab('channels');
      
      addNotification(`Channel #${newChannel.name} created successfully`, 'success');
    });

    currentSocket.on('channels_list', (channelsList) => {
      console.log(`📋 Received ${channelsList.length} channels`, channelsList);
      
      // Filter out any channels that were recently deleted
      setChannels(prev => {
        const newChannels = channelsList.filter(channel => 
          channel._id !== lastDeletedChannelId.current
        );
        
        // If no channels, ensure we have at least general
        if (!newChannels.find(c => c._id === 'general')) {
          newChannels.unshift({
            _id: 'general',
            name: 'general',
            type: 'public',
            description: 'Company-wide announcements',
            isGeneral: true
          });
        }
        
        console.log('📋 Setting channels list:', newChannels.length);
        return newChannels;
      });
    });

    // Listen for users list
    currentSocket.on('users_list', (users) => {
      console.log(`👥 Received ${users.length} users list`);
      setUsersList(users);
    });

    // Enhanced channel joined handler with retry logic
    currentSocket.on('channel_joined', ({ channel, history }) => {
      console.log(`✅ Joined channel: ${channel.name}, received ${history.length} messages`);
      
      // Clear processed IDs for this channel
      processedMessageIds.current.clear();
      
      const formattedHistory = history.map(msg => {
        const msgId = msg._id || msg.id;
        processedMessageIds.current.add(msgId);
        return { 
          ...msg, 
          id: msgId,
          reactions: msg.reactions || [],
          readBy: msg.readBy || [],
          // Ensure text is properly formatted
          text: msg.text || '',
          // Ensure sender info is set
          senderName: msg.senderName || msg.sender || 'Unknown',
          senderId: msg.senderId || msg.sender || 'unknown'
        };
      });
      
      setMessages(prev => ({ 
        ...prev, 
        [channel._id]: formattedHistory 
      }));
      
      // Clear unread count for this channel
      setUnreadCounts(prev => ({ ...prev, [channel._id]: 0 }));
      
      // Clear rejoin attempts for this channel
      rejoinChannelAttempts.current[channel._id] = 0;
    });

    // Enhanced new message handler
    currentSocket.on('receive_message', ({ channelId, message }) => {
      const messageId = message._id || message.id;
      
      // Check if message already processed
      if (processedMessageIds.current.has(messageId)) {
        console.log(`🔄 Skipping duplicate message: ${messageId}`);
        return;
      }
      
      console.log(`📨 New message in ${channelId}:`, message.senderName, message.text);
      
      // Add to processed set
      processedMessageIds.current.add(messageId);
      
      const msgWithId = { 
        ...message, 
        id: messageId,
        reactions: message.reactions || [],
        readBy: message.readBy || [],
        text: message.text || '',
        senderName: message.senderName || message.sender || 'Unknown',
        senderId: message.senderId || message.sender || 'unknown'
      };
      
      setMessages(prev => {
        const existingMessages = prev[channelId] || [];
        
        // Check if message already exists in state
        if (existingMessages.some(msg => msg.id === messageId)) {
          console.log(`🔄 Message ${messageId} already in state, skipping`);
          return prev;
        }
        
        return {
          ...prev,
          [channelId]: [...existingMessages, msgWithId]
        };
      });
      
      // Auto-mark as read if we're in the channel
      if (channelId === activeChannel && message.senderId !== currentUser && socket.current) {
        socket.current.emit('mark_read', { channelId, messageId: messageId });
      }
      
      // Notification for new message in other channels
      if (channelId !== activeChannel) {
        const channel = channels.find(c => c._id === channelId);
        addNotification(`New message in #${channel?.name || channelId}`, 'info');
        
        setUnreadCounts(prev => ({
          ...prev,
          [channelId]: (prev[channelId] || 0) + 1
        }));
      }
    });

    // Listen for direct users
    currentSocket.on('direct_users_list', (users) => {
      console.log(`👥 Received ${users.length} users for direct messages`);
      setDirectUsers(users);
    });

    // Listen for direct channel creation
    currentSocket.on('direct_channel_created', ({ channel, history }) => {
      console.log('✅ Direct channel created:', channel.displayName);
      
      // Add the new DM channel to channels list
      setChannels(prev => {
        const exists = prev.find(c => c._id === channel._id);
        if (exists) return prev;
        return [...prev, channel];
      });
      
      // Automatically switch to the new DM channel
      setActiveChannel(channel._id);
      setActiveTab('channels');
      
      // Store message history
      const formattedHistory = history.map(msg => ({
        ...msg,
        id: msg._id,
        reactions: msg.reactions || [],
        readBy: msg.readBy || [],
        text: msg.text || '',
        senderName: msg.senderName || msg.sender || 'Unknown'
      }));
      
      setMessages(prev => ({
        ...prev,
        [channel._id]: formattedHistory
      }));
      
      addNotification(`Started chat with ${channel.displayName}`, 'success');
    });

    // Listen for immediate direct message deletion
    currentSocket.on('direct_message_deleted_immediate', ({ channelId, success, messageCount, deletedBy }) => {
      console.log(`🗑️ IMMEDIATE: Direct message channel ${channelId} deleted, ${messageCount} messages removed`);
      
      if (!success) return;
      
      // Track the deleted channel
      lastDeletedChannelId.current = channelId;
      
      // Force immediate UI updates
      setChannels(prev => {
        const newChannels = prev.filter(c => c._id !== channelId);
        console.log(`📋 Channels after immediate DM deletion: ${newChannels.length} remaining`);
        return newChannels;
      });
      
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[channelId];
        console.log(`🗑️ Immediately cleared messages for DM channel ${channelId}`);
        return newMessages;
      });
      
      // If this was the active channel, switch to general immediately
      if (activeChannel === channelId) {
        console.log(`🔄 Immediate switch from deleted DM channel ${channelId} to general`);
        setActiveChannel('general');
        
        // Set flag to skip the next activeChannel effect
        skipActiveChannelUpdate.current = true;
        setTimeout(() => {
          skipActiveChannelUpdate.current = false;
        }, 100);
      }
      
      addNotification(`Deleted conversation and ${messageCount} messages`, 'info');
    });

    // Listen for immediate chat history clearing
    currentSocket.on('chat_history_cleared_immediate', ({ channelId, clearedBy, deletedCount }) => {
      console.log(`🧹 IMMEDIATE: Chat history cleared for channel ${channelId}, ${deletedCount} messages deleted`);
      
      // Immediately clear messages for this channel in state
      setMessages(prev => {
        const newMessages = { ...prev };
        newMessages[channelId] = [];
        console.log(`✅ Cleared messages for channel ${channelId} in state`);
        return newMessages;
      });
      
      // Also clear unread counts for this channel
      setUnreadCounts(prev => ({
        ...prev,
        [channelId]: 0
      }));
      
      addNotification(`Cleared ${deletedCount} messages from chat`, 'info');
      
      // Rejoin channel to get updated state
      if (socket.current?.connected && channelId === activeChannel) {
        setTimeout(() => {
          console.log(`🔄 Rejoining channel ${channelId} after clearing history`);
          socket.current.emit('join_channel', channelId);
        }, 100);
      }
    });

    // Listen for channel messages cleared
    currentSocket.on('channel_messages_cleared', ({ channelId }) => {
      console.log(`🧹 Channel messages cleared: ${channelId}`);
      
      // Immediately clear messages for this channel
      setMessages(prev => {
        const newMessages = { ...prev };
        newMessages[channelId] = [];
        return newMessages;
      });
    });

    // Listen for message deletion
    currentSocket.on('message_deleted', ({ channelId, messageId, deleteForEveryone, deletedBy, message }) => {
      console.log(`🗑️ Message ${messageId} deleted in ${channelId}`);
      
      // Update messages state immediately
      setMessages(prev => {
        const channelMessages = prev[channelId] || [];
        
        if (deleteForEveryone) {
          // Remove the message entirely
          const newMessages = channelMessages.filter(m => m.id !== messageId);
          return {
            ...prev,
            [channelId]: newMessages
          };
        } else {
          // Soft delete - mark as deleted
          const newMessages = channelMessages.map(m => 
            m.id === messageId ? { 
              ...m, 
              text: "This message was deleted",
              deleted: true,
              deletedBy: deletedBy || currentUser
            } : m
          );
          return {
            ...prev,
            [channelId]: newMessages
          };
        }
      });
      
      if (deletedBy !== currentUser) {
        addNotification(`${deletedBy || 'Someone'} deleted a message`, 'info');
      }
    });

    // Listen for message updates
    currentSocket.on('message_updated', ({ channelId, messageId, newText, editedAt }) => {
      console.log(`✏️ Message ${messageId} updated`);
      setMessages(prev => ({
        ...prev,
        [channelId]: (prev[channelId] || []).map(m => 
          m.id === messageId ? { 
            ...m, 
            text: newText, 
            edited: true,
            editedAt 
          } : m
        )
      }));
    });

    // Listen for reactions
    currentSocket.on('receive_reaction', ({ channelId, messageId, reactions }) => {
      console.log(`😊 Reaction updated for message ${messageId}:`, reactions);
      
      setMessages(prev => ({
        ...prev,
        [channelId]: (prev[channelId] || []).map(msg => 
          msg.id === messageId ? { ...msg, reactions } : msg
        )
      }));
    });

    // Listen for typing indicators
    currentSocket.on('user_typing', ({ channelId, userId, userName, typingUsers }) => {
      if (channelId === activeChannel && userId !== currentUser) {
        setTypingUsers(prev => ({
          ...prev,
          [channelId]: typingUsers.filter(u => u.userId !== currentUser)
        }));
      }
    });

    currentSocket.on('user_stopped_typing', ({ channelId }) => {
      if (channelId === activeChannel) {
        setTypingUsers(prev => ({
          ...prev,
          [channelId]: []
        }));
      }
    });

    // Listen for channel deletion
    currentSocket.on('channel_deleted_immediate', ({ channelId, deletedBy, channelName }) => {
      console.log(`🗑️ IMMEDIATE: Channel ${channelId} deleted by ${deletedBy}`);
      
      // Track the deleted channel
      lastDeletedChannelId.current = channelId;
      
      // Immediately update channels list
      setChannels(prev => {
        const newChannels = prev.filter(c => c._id !== channelId);
        console.log(`📋 Channels after immediate deletion: ${newChannels.length} remaining`);
        return newChannels;
      });
      
      // Remove messages for this channel
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[channelId];
        return newMessages;
      });
      
      // If this was the active channel, switch to general immediately
      if (activeChannel === channelId) {
        console.log(`🔄 Immediate switch from deleted channel ${channelId} to general`);
        setActiveChannel('general');
        setActiveTab('channels');
        
        // Set flag to skip the next activeChannel effect
        skipActiveChannelUpdate.current = true;
        setTimeout(() => {
          skipActiveChannelUpdate.current = false;
        }, 100);
      }
      
      addNotification(`Channel "${channelName}" has been deleted`, 'info');
    });

    // Listen for channel refresh
    currentSocket.on('channel_refresh', ({ channelId }) => {
      console.log(`🔄 Refreshing channel: ${channelId}`);
      if (channelId === activeChannel && socket.current) {
        socket.current.emit('join_channel', channelId);
      }
    });

    // Listen for channels refresh
    currentSocket.on('channels_refresh', () => {
      console.log('🔄 Refreshing channels list immediately');
      
      // Force immediate channels refresh
      if (socket.current) {
        socket.current.emit('get_channels');
      }
    });

    // Enhanced error handling
    currentSocket.on('error', (error) => {
      console.error('❌ Socket error:', error.message);
      addNotification(`Error: ${error.message}`, 'error');
    });

    // Add socket error events
    currentSocket.on('socket_error', ({ message, code }) => {
      console.error('🔌 Socket error event:', { message, code });
      addNotification(`Socket error: ${message}`, 'warning');
    });

    currentSocket.on('connection_failed', ({ message }) => {
      console.error('🔌 Connection failed:', message);
      addNotification(`Connection failed: ${message}`, 'error');
      setSocketStatus('failed');
    });

    console.log('✅ Socket listeners set up');

  }, [activeChannel, addNotification, currentUser, channels, userName]);

  // Effect to initialize socket when auth is ready
  useEffect(() => {
    console.log('🔄 Auth state changed, checking if we should initialize socket...', { 
      hasUser: !!user?.id, 
      hasToken: !!token,
      socketConnected: socket.current?.connected 
    });
    
    const init = () => {
      if (user?.id && token) {
        console.log('✅ User and token available, initializing socket...');
        if (socket.current && !socket.current.connected) {
          console.log('🔄 Connecting existing socket...');
          socket.current.connect();
        } else if (!socket.current) {
          console.log('🔄 Initializing new socket...');
          initializeSocket();
        }
      } else {
        console.log('🚫 No auth, cleaning up socket', { 
          hasUser: !!user?.id, 
          hasToken: !!token,
          userId: user?.id 
        });
        if (socket.current) {
          socket.current.removeAllListeners();
          socket.current.disconnect();
          socket.current = null;
        }
        setSocketStatus('disconnected');
        setMessages({});
        setChannels([]);
      }
    };

    // Debounce initialization
    const timer = setTimeout(init, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [user, token, initializeSocket]);

  // Join channel when selected - WITH RETRY LOGIC
  useEffect(() => {
    if (skipActiveChannelUpdate.current) {
      console.log('⏭️ Skipping channel join due to deletion');
      return;
    }
    
    const joinChannel = () => {
      if (activeChannel && socket.current?.connected) {
        console.log(`📡 Joining channel: ${activeChannel}`);
        
        // Reset rejoin attempts for this channel
        rejoinChannelAttempts.current[activeChannel] = 0;
        
        socket.current.emit('join_channel', activeChannel);
        
        // Clear typing users for this channel
        setTypingUsers(prev => ({ ...prev, [activeChannel]: [] }));
        
        // Clear messages temporarily to avoid showing old messages
        setMessages(prev => ({
          ...prev,
          [activeChannel]: []
        }));
      }
    };

    // Join channel with a small delay to ensure socket is ready
    const timer = setTimeout(joinChannel, 100);
    
    return () => clearTimeout(timer);
  }, [activeChannel]);

  // Typing indicator handler
  const handleTypingStart = useCallback(() => {
    if (!activeChannel || !socket.current?.connected) {
      console.log('⌨️ Cannot send typing - socket disconnected');
      return;
    }
    
    if (!isTyping) {
      setIsTyping(true);
      socket.current.emit('typing_start', { channelId: activeChannel });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  }, [activeChannel, isTyping]);

  const handleTypingStop = useCallback(() => {
    if (!activeChannel || !isTyping || !socket.current?.connected) return;
    
    setIsTyping(false);
    socket.current.emit('typing_stop', { channelId: activeChannel });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [activeChannel, isTyping]);
// index.jsx - Update handleSendMessage function
const handleSendMessage = useCallback((messageData) => {
  console.log('📤 Sending message data:', {
    type: typeof messageData,
    hasText: typeof messageData === 'string' ? messageData.substring(0, 50) : messageData?.text?.substring(0, 50) || 'No text',
    hasFiles: typeof messageData === 'object' && messageData.files && messageData.files.length > 0,
    hasAudio: typeof messageData === 'object' && messageData.audioUrl,
    isVoiceMessage: typeof messageData === 'object' && messageData.isVoiceMessage
  });
  
  if (!socket.current?.connected) {
    console.error('❌ Socket not connected!');
    addNotification('Please wait for connection...', 'error');
    return;
  }
  
  // Handle both string and object inputs
  if (!messageData) {
    console.error('❌ No message data provided');
    return;
  }
  
  // Prepare message data for sending
  let finalMessageData;
  
  if (typeof messageData === 'string') {
    // Handle regular text message
    if (!messageData.trim()) {
      console.log('⚠️ Empty string message, skipping');
      return;
    }
    
    finalMessageData = {
      text: messageData,
      replyTo: replyingTo ? {
        id: replyingTo.id || replyingTo._id,
        sender: replyingTo.senderName || replyingTo.senderId || replyingTo.sender,
        text: replyingTo.text
      } : null
    };
    
  } else if (typeof messageData === 'object') {
    // Handle object message (could be files, audio, or text with reply)
    
    // **DEBUG: Log the exact object we're receiving**
    console.log('📋 Received message object:', {
      text: messageData.text,
      files: messageData.files?.length || 0,
      audioUrl: messageData.audioUrl,
      isVoiceMessage: messageData.isVoiceMessage
    });
    
    // Check what type of object message this is
    if (messageData.files && messageData.files.length > 0) {
      // **CONFIRM: This is a FILE message, not voice**
      console.log('📁 Sending FILE message (NOT voice):', messageData.files.length, 'files');
      
      // Format files for the message
      const formattedFiles = messageData.files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: file.url,
        path: file.path,
        filename: file.filename,
        mimetype: file.mimetype
      }));
      
      finalMessageData = {
        text: messageData.text || `${formattedFiles.length} file(s) uploaded`,
        files: formattedFiles,
        // **EXPLICITLY mark as NOT voice message**
        audioUrl: null,
        audioSize: null,
        audioDuration: null,
        isVoiceMessage: false,
        replyTo: replyingTo ? {
          id: replyingTo.id || replyingTo._id,
          sender: replyingTo.senderName || replyingTo.senderId || replyingTo.sender,
          text: replyingTo.text
        } : null
      };
      
    } else if (messageData.audioUrl || messageData.isVoiceMessage) {
      // **ONLY do this if audioUrl or isVoiceMessage is TRUTHY**
      console.log('🎤 Sending VOICE message:', messageData.audioUrl);
      
      finalMessageData = {
        text: messageData.text || `🎤 Voice message (${messageData.audioDuration || 0}s)`,
        audioUrl: messageData.audioUrl,
        audioSize: messageData.audioSize || 0,
        audioDuration: messageData.audioDuration || 0,
        isVoiceMessage: true,
        replyTo: replyingTo ? {
          id: replyingTo.id || replyingTo._id,
          sender: replyingTo.senderName || replyingTo.senderId || replyingTo.sender,
          text: replyingTo.text
        } : null
      };
      
    } else if (messageData.text) {
      // Regular text message object (with reply)
      finalMessageData = {
        text: messageData.text,
        replyTo: replyingTo ? {
          id: replyingTo.id || replyingTo._id,
          sender: replyingTo.senderName || replyingTo.senderId || replyingTo.sender,
          text: replyingTo.text
        } : null
      };
    } else {
      console.error('❌ Invalid message object:', messageData);
      addNotification('Invalid message format', 'error');
      return;
    }
  } else {
    console.error('❌ Invalid message type:', typeof messageData);
    addNotification('Invalid message type', 'error');
    return;
  }
  
  console.log('📤 Final message data to send:', {
    text: finalMessageData.text,
    hasFiles: !!(finalMessageData.files && finalMessageData.files.length > 0),
    hasAudio: !!finalMessageData.audioUrl,
    isVoiceMessage: !!finalMessageData.isVoiceMessage,
    replyTo: !!finalMessageData.replyTo
  });
  
  // Send the message through socket
  socket.current.emit('send_message', { 
    channelId: activeChannel, 
    message: finalMessageData 
  });
  
  // Clear reply state
  setReplyingTo(null);
  
  // Stop typing indicator
  handleTypingStop();
  
}, [activeChannel, replyingTo, handleTypingStop, addNotification]);
  const handleEditMessage = useCallback((messageId, newText) => {
    if (!socket.current?.connected) {
      addNotification('Not connected to server', 'error');
      return;
    }
    socket.current.emit('edit_message', { 
      channelId: activeChannel, 
      messageId, 
      newText 
    });
    setIsEditMode(false);
    setEditingMessage(null);
  }, [activeChannel, addNotification]);

  const handleDeleteMessage = useCallback((messageId, deleteForEveryone = false) => {
    if (!socket.current?.connected) {
      addNotification('Not connected to server', 'error');
      return;
    }
    socket.current.emit('delete_message', { 
      channelId: activeChannel, 
      messageId,
      deleteForEveryone
    });
  }, [activeChannel, addNotification]);

  const handleSendReaction = useCallback((messageId, emoji) => {
    if (!socket.current?.connected) {
      addNotification('Not connected to server', 'error');
      return;
    }
    console.log('😊 Sending reaction:', { messageId, emoji });
    socket.current.emit('send_reaction', { 
      channelId: activeChannel, 
      messageId, 
      emoji 
    });
    setShowReactionPicker({ show: false, message: null, position: { x: 0, y: 0 } });
  }, [activeChannel, addNotification]);
// In index.jsx - Update handleForwardMessage function
const handleForwardMessage = useCallback((message, targetChannelId = 'general') => {
  if (!socket.current?.connected) {
    addNotification('Not connected to server', 'error');
    return;
  }
  
  console.log('📤 Forwarding message to channel:', targetChannelId);
  
  // Prepare forwarded message
  const forwardedMessage = {
    text: `↪️ Forwarded from ${message.senderName || message.senderId}:\n${message.text || 'File/voice message'}`,
    forwardedFrom: message.senderName || message.senderId,
    originalMessageId: message.id || message._id,
    files: message.files || [],
    audioUrl: message.audioUrl,
    audioSize: message.audioSize,
    audioDuration: message.audioDuration,
    isVoiceMessage: message.isVoiceMessage,
    replyTo: null // Don't forward reply information
  };
  
  console.log('Forwarding message data:', {
    text: forwardedMessage.text,
    hasFiles: forwardedMessage.files?.length > 0,
    hasAudio: !!forwardedMessage.audioUrl
  });
  
  // Send the forwarded message
  socket.current.emit('send_message', { 
    channelId: targetChannelId, 
    message: forwardedMessage 
  });
  
  addNotification("Message forwarded successfully", "success");
  setForwardingMessage(null);
}, [socket, addNotification]);
  const handleReplyMessage = useCallback((message) => {
    console.log('↪️ Setting reply to:', message.text);
    setReplyingTo(message);
  }, []);

  const handleReactionClick = useCallback((message, position) => {
    console.log('🎯 Opening reaction picker for message:', message.id);
    setShowReactionPicker({ 
      show: true, 
      message, 
      position 
    });
  }, []);

  const handleCreateChannel = useCallback((channelData) => {
    if (!socket.current?.connected) {
      addNotification('Not connected to server', 'error');
      return;
    }
    
    console.log('📡 Creating channel:', channelData.name);
    socket.current.emit('create_channel', channelData);
    setShowCreateChannel(false);
  }, [addNotification]);

  // Handle channel deletion
  const handleDeleteChannel = useCallback((channelId) => {
    if (!socket.current?.connected) {
      addNotification('Not connected to server', 'error');
      return;
    }
    
    console.log('🗑️ Deleting channel:', channelId);
    socket.current.emit('delete_channel', { channelId });
  }, [socket, addNotification]);

  const handleGetDirectUsers = useCallback(() => {
    if (!socket.current?.connected) {
      console.error('❌ Socket not connected for direct users');
      addNotification('Please wait for connection', 'error');
      return;
    }
    
    console.log('📡 Requesting direct users list...');
    socket.current.emit('get_direct_users');
  }, [socket, addNotification]);

  const handleCreateDirectMessage = useCallback((targetUserId, targetUserName) => {
    if (!socket.current?.connected) {
      console.error('❌ Socket not connected for creating DM');
      addNotification('Please wait for connection', 'error');
      return;
    }
    
    console.log('📨 Creating direct message with:', targetUserId, targetUserName);
    
    // Check if we already have a DM channel with this user
    const existingDM = channels.find(channel => 
      channel.isDirectMessage && 
      channel.directMessageUsers?.some(user => user.userId === targetUserId)
    );
    
    if (existingDM) {
      console.log('✅ Using existing DM channel:', existingDM._id);
      setActiveChannel(existingDM._id);
      setActiveTab('channels');
      return;
    }
    
    socket.current.emit('create_direct_message', {
      targetUserId: String(targetUserId),
      targetUserName
    });
  }, [socket, addNotification, channels]);

  // Function to clear chat history
  const handleClearChatHistory = useCallback((channelId) => {
    if (!socket.current?.connected) {
      addNotification('Not connected to server', 'error');
      return;
    }
    
    console.log('🧹 Clearing chat history for channel:', channelId);
    
    // Clear local state immediately for better UX
    setMessages(prev => ({
      ...prev,
      [channelId]: []
    }));
    
    // Also clear unread counts
    setUnreadCounts(prev => ({
      ...prev,
      [channelId]: 0
    }));
    
    // Then emit socket event
    socket.current.emit('clear_chat_history', { channelId });
    
    addNotification('Clearing chat history...', 'info');
  }, [socket, addNotification]);

  // Function to delete direct message channel
  const handleDeleteDirectMessage = useCallback((channelId) => {
    if (!socket.current?.connected) {
      addNotification('Not connected to server', 'error');
      return;
    }
    
    console.log('🗑️ Deleting direct message channel:', channelId);
    socket.current.emit('delete_direct_message', { channelId });
  }, [socket, addNotification]);
// In index.jsx - Add this function near other handler functions
const handleForwardToUser = useCallback((message, targetUser) => {
  if (!socket.current?.connected) {
    addNotification('Not connected to server', 'error');
    return;
  }
  
  console.log('📤 Forwarding message to user:', targetUser.name);
  
  // First, create or get DM channel with this user
  handleCreateDirectMessage(targetUser.id, targetUser.name);
  
  // Find the DM channel for this user
  const dmChannel = channels.find(channel => 
    channel.isDirectMessage && 
    channel.directMessageUsers?.some(user => user.userId === targetUser.id)
  );
  
  if (dmChannel) {
    // Wait a moment for the channel to be ready, then forward the message
    setTimeout(() => {
      console.log('Forwarding to DM channel:', dmChannel._id);
      
      // Prepare forwarded message for DM
      const forwardedMessage = {
        text: `↪️ Forwarded from ${message.senderName || message.senderId}:\n${message.text || 'File/voice message'}`,
        forwardedFrom: message.senderName || message.senderId,
        originalMessageId: message.id || message._id,
        files: message.files || [],
        audioUrl: message.audioUrl,
        isVoiceMessage: message.isVoiceMessage
      };
      
      // Send the forwarded message to DM channel
      socket.current.emit('send_message', { 
        channelId: dmChannel._id, 
        message: forwardedMessage 
      });
      
      addNotification(`Message forwarded to ${targetUser.name}`, "success");
      setForwardingMessage(null);
    }, 500);
  } else {
    addNotification('Could not find DM channel', 'error');
  }
}, [socket, addNotification, channels, handleCreateDirectMessage]);
  // Manual reconnect function
  const handleReconnect = useCallback(() => {
    console.log('🔄 Manual reconnect triggered');
    
    const savedUser = localStorage.getItem("planyty_user");
    const savedToken = localStorage.getItem("planyty_token") || localStorage.getItem("token");
    
    let cleanToken = null;
    if (savedToken && savedToken !== 'undefined' && savedToken !== '[object Object]') {
      cleanToken = savedToken.replace(/"/g, '').trim();
    }
    
    if (!savedUser || !cleanToken) {
      console.error('❌ Cannot reconnect: No saved credentials in localStorage');
      addNotification('Please login again', 'error');
      authLogout();
      return;
    }
    
    try {
      const parsedUser = JSON.parse(savedUser);
      
      // Update the component state to trigger re-initialization
      if (parsedUser && cleanToken) {
        console.log('🔄 Got user and token from localStorage, will trigger re-initialization');
        
        // Force a re-render with the stored credentials
        // This will trigger the useEffect that initializes the socket
        window.location.reload(); // Simple solution for now
      }
      
    } catch (error) {
      console.error('❌ Failed to parse saved user:', error);
      addNotification('Authentication error. Please login again.', 'error');
      authLogout();
    }
  }, [initializeSocket, addNotification, authLogout]);

  // Get current channel info
  const getCurrentChannelInfo = () => {
    // Check if activeChannel exists in channels
    const channelExists = channels.some(c => c._id === activeChannel);
    
    // If channel doesn't exist and it's not 'general', switch to 'general'
    if (!channelExists && activeChannel !== 'general') {
      console.log(`⚠️ Channel ${activeChannel} not found in channels list, switching to general`);
      
      // Use setTimeout to avoid state update during render
      setTimeout(() => {
        if (activeChannel !== 'general') {
          setActiveChannel('general');
        }
      }, 0);
      
      return { 
        _id: 'general',
        name: 'general', 
        displayName: 'General',
        type: 'public',
        isDMChannel: false 
      };
    }
    
    const channel = channels.find(c => c._id === activeChannel);
    
    if (!channel) {
      console.log('⚠️ No channel found for activeChannel:', activeChannel);
      return { 
        _id: activeChannel,
        name: activeChannel, 
        displayName: activeChannel,
        type: 'public',
        isDMChannel: false 
      };
    }
    
    let displayName = channel.displayName || channel.name || activeChannel;
    const isDMChannel = channel.isDirectMessage || channel.type === 'direct' || channel.name?.startsWith('dm-');
    
    if (isDMChannel) {
      if (channel.directMessageUsers && Array.isArray(channel.directMessageUsers)) {
        const otherUser = channel.directMessageUsers.find(u => {
          const userId = u.userId || u.id || u._id;
          return userId && String(userId) !== String(currentUser);
        });
        
        if (otherUser?.userName) {
          displayName = otherUser.userName;
        } else if (channel.directMessageUsers.length === 1) {
          const singleUser = channel.directMessageUsers[0];
          const singleUserName = singleUser.userName || singleUser.name || singleUser.username;
          if (singleUserName) {
            displayName = `${singleUserName} (Me)`;
          }
        }
      }
      
      if (displayName.startsWith('dm-') || displayName === 'Unknown User') {
        if (channel.name && channel.name.startsWith('dm-')) {
          const ids = channel.name.replace('dm-', '').split('-');
          const uniqueIds = [...new Set(ids)];
          const otherUserId = uniqueIds.find(id => id && String(id) !== String(currentUser));
          
          if (otherUserId) {
            const otherUser = directUsers.find(u => {
              const userId = u.id || u._id;
              return userId && String(userId) === String(otherUserId);
            });
            
            if (otherUser?.name) {
              displayName = otherUser.name;
            } else {
              const userFromList = usersList.find(u => {
                const userId = u.id || u._id;
                return userId && String(userId) === String(otherUserId);
              });
              
              if (userFromList?.name) {
                displayName = userFromList.name;
              }
            }
          } else {
            displayName = `${userName} (Me)`;
          }
        }
      }
      
      if (displayName.startsWith('dm-') || displayName === 'Unknown User') {
        displayName = 'Direct Message';
      }
    }
    
    return {
      ...channel,
      displayName: displayName,
      isDMChannel: isDMChannel
    };
  };

  // Refresh channels list manually
  const handleRefreshChannels = useCallback(() => {
    if (socket.current?.connected) {
      console.log('🔄 Manual refresh triggered');
      socket.current.emit('channels_refresh');
    }
  }, []);

  // Refresh current channel manually
  const handleRefreshCurrentChannel = useCallback(() => {
    if (socket.current?.connected && activeChannel) {
      console.log(`🔄 Refreshing current channel: ${activeChannel}`);
      socket.current.emit('join_channel', activeChannel);
    }
  }, [activeChannel]);

  const currentChannelInfo = getCurrentChannelInfo();
  const currentTypingUsers = typingUsers[activeChannel] || [];

  if (!user?.id || !token) {
    return (
      <div className="h-[calc(100vh-140px)] max-w-[1600px] mx-auto flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Authentication Required</h3>
          <p className="text-gray-500 mb-4">Please login to access the chat</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/login'}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity w-full"
            >
              Go to Login
            </button>
            <button
              onClick={handleReconnect}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors w-full"
            >
              Try Reconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] max-w-[1600px] mx-auto bg-gradient-to-br from-[#F8F9FF] to-[#F067A3] rounded-2xl shadow-2xl overflow-hidden">
      <div className="h-full flex bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <ChatSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          activeChannel={activeChannel} 
          onChannelSelect={setActiveChannel}
          channels={channels}
          unreadCounts={unreadCounts}
          userRole={userRole}
          userName={userName}
          userAvatar={userAvatar}
          userId={currentUser}
          directUsers={directUsers}
          onGetDirectUsers={handleGetDirectUsers}
          onCreateChannel={() => setShowCreateChannel(true)}
          socketStatus={socketStatus}
          onReconnect={handleReconnect}
          socket={socket.current}
          onStartDirectMessage={handleCreateDirectMessage}
          onRefreshChannels={handleRefreshChannels}
          onRefreshCurrentChannel={handleRefreshCurrentChannel}
        />
        <ChatMessages
          currentChat={currentChannelInfo.displayName}
          originalChannelName={currentChannelInfo.name}
          isDMChannel={currentChannelInfo.isDMChannel}
          directUsers={directUsers}
          channelInfo={currentChannelInfo}
          messages={messages[activeChannel] || []}
          onSendMessage={handleSendMessage}
          onCreateChannel={() => setShowCreateChannel(true)}
          onDeleteMessage={handleDeleteMessage}
          onEditMessage={handleEditMessage}
          onForwardMessage={(msg) => setForwardingMessage(msg)}
          onReplyMessage={handleReplyMessage}
          onReaction={handleReactionClick}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          socketStatus={socketStatus}
          currentUser={currentUser}
          userName={userName}
          userId={currentUser}
          userRole={userRole}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          editingMessage={editingMessage}
          setEditingMessage={setEditingMessage}
          editText={editText}
          socket={socket.current}
          setEditText={setEditText}
          typingUsers={currentTypingUsers}
          onReconnect={handleReconnect}
          isConnected={socket.current?.connected || false}
          onClearChatHistory={handleClearChatHistory}
          onDeleteDirectMessage={handleDeleteDirectMessage}
          onDeleteChannel={handleDeleteChannel}
          usersList={usersList}
          activeChannel={activeChannel}
          onRefreshCurrentChannel={handleRefreshCurrentChannel}
            onRefreshChannels={handleRefreshChannels}
        />
      </div>

      {/* Reaction Picker Modal */}
      {showReactionPicker.show && showReactionPicker.message && (
        <ReactionPicker
          position={showReactionPicker.position}
          onSelect={(emoji) => handleSendReaction(showReactionPicker.message.id || showReactionPicker.message._id, emoji)}
          onClose={() => setShowReactionPicker({ show: false, message: null, position: { x: 0, y: 0 } })}
        />
      )}

      {/* Forward Modal */}
{forwardingMessage && (
  <ForwardModal
    message={forwardingMessage}
    currentChannel={activeChannel}
    channels={channels.filter(c => !c.isDirectMessage)} // Exclude DMs
    usersList={usersList}
    onForward={(message, target) => {
      if (typeof target === 'string') {
        // target is a channelId
        console.log('Forwarding to channel:', target);
        handleForwardMessage(message, target);
      } else if (target && target.id) {
        // target is a user object
        console.log('Forwarding to user:', target.name);
        handleForwardToUser(message, target);
      }
    }}
    onClose={() => setForwardingMessage(null)}
  />
)}
      {/* Create Channel Modal */}
      {showCreateChannel && (userRole === 'team_lead' || userRole === 'admin') && (
        <CreateChannelModal
          teamId={teamId}
          userName={userName}
          onCreate={handleCreateChannel}
          onClose={() => setShowCreateChannel(false)}
        />
      )}
    </div>
  );
};

export default Chat;