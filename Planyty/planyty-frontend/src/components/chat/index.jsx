import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatMessages from './ChatMessages';
import { useNotifications } from '../../contexts/NotificationContext';
import { FakeServer } from '../../fake-backend/fakeServer';

const Chat = () => {
  const [activeTab, setActiveTab] = useState('channels');
  const [activeChannel, setActiveChannel] = useState('general');
  const [activeTeam, setActiveTeam] = useState(null);
  const [messages, setMessages] = useState({});
  const [teams, setTeams] = useState([]);
  const [socketStatus, setSocketStatus] = useState('connected');
  const [channels, setChannels] = useState([]);
  
  // EDIT STATE MANAGEMENT
  const [editingMessage, setEditingMessage] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editText, setEditText] = useState('');
  
  // Use refs to track message IDs to prevent duplicates
  const processedMessageIds = useRef(new Set());
  const isSendingMessage = useRef(false);
  const messageCounter = useRef(0); // Counter to ensure unique IDs

  const { addNotification } = useNotifications();

  // Initialize channels, teams, and initial messages
  useEffect(() => {
    // Load channels from fake backend
    const loadedChannels = FakeServer.getChannels();
    setChannels(loadedChannels);
    
    // Load teams from fake backend
    const loadedTeams = FakeServer.getTeams();
    setTeams(loadedTeams);
    
    // Initialize messages for all existing chats
    const initialMessages = {};
    
    // Load messages for each channel
    loadedChannels.forEach(channel => {
      const channelMessages = FakeServer.getMessages(channel.id);
      
      // Ensure all messages have IDs
      initialMessages[channel.id] = channelMessages.map((msg, index) => {
        if (!msg.id) {
          // Generate a unique ID if missing
          const messageId = `${Date.now()}-${messageCounter.current++}`;
          return {
            ...msg,
            id: messageId
          };
        }
        return msg;
      });
      
      // Track existing message IDs and find the highest counter
      initialMessages[channel.id].forEach(msg => {
        processedMessageIds.current.add(msg.id);
        // Extract counter from ID if it exists
        const idParts = msg.id.toString().split('-');
        if (idParts.length > 1) {
          const counter = parseInt(idParts[1]);
          if (!isNaN(counter) && counter >= messageCounter.current) {
            messageCounter.current = counter + 1;
          }
        }
      });
    });
    
    // Load messages for each team
    loadedTeams.forEach(team => {
      const teamMessages = FakeServer.getMessages(team.id);
      
      // Ensure all messages have IDs
      initialMessages[team.id] = teamMessages.map((msg, index) => {
        if (!msg.id) {
          // Generate a unique ID if missing
          const messageId = `${Date.now()}-${messageCounter.current++}`;
          return {
            ...msg,
            id: messageId
          };
        }
        return msg;
      });
      
      // Track existing message IDs
      initialMessages[team.id].forEach(msg => {
        processedMessageIds.current.add(msg.id);
        // Extract counter from ID if it exists
        const idParts = msg.id.toString().split('-');
        if (idParts.length > 1) {
          const counter = parseInt(idParts[1]);
          if (!isNaN(counter) && counter >= messageCounter.current) {
            messageCounter.current = counter + 1;
          }
        }
      });
    });
    
    // Add DMs
    const dmIds = ['dm_john'];
    dmIds.forEach(dmId => {
      const dmMessages = FakeServer.getMessages(dmId);
      
      // Ensure all messages have IDs
      initialMessages[dmId] = dmMessages.map((msg, index) => {
        if (!msg.id) {
          // Generate a unique ID if missing
          const messageId = `${Date.now()}-${messageCounter.current++}`;
          return {
            ...msg,
            id: messageId
          };
        }
        return msg;
      });
      
      initialMessages[dmId].forEach(msg => {
        processedMessageIds.current.add(msg.id);
        // Extract counter from ID if it exists
        const idParts = msg.id.toString().split('-');
        if (idParts.length > 1) {
          const counter = parseInt(idParts[1]);
          if (!isNaN(counter) && counter >= messageCounter.current) {
            messageCounter.current = counter + 1;
          }
        }
      });
    });
    
    console.log('Initialized messages:', initialMessages);
    setMessages(initialMessages);
  }, []);

  // Simulate incoming messages from FakeServer
  useEffect(() => {
    let isMounted = true;
    let lastMessageTime = Date.now();
    
    const simulateMessage = () => {
      if (!isMounted) return;
      if (isSendingMessage.current) return; // Don't simulate while user is sending
      
      const now = Date.now();
      const timeSinceLastMessage = now - lastMessageTime;
      
      // Only simulate if it's been at least 8 seconds since last message
      if (timeSinceLastMessage < 8000) return;
      
      const incoming = FakeServer.getRandomMessage(activeChannel);
      
      if (incoming && incoming.sender !== 'You') {
        // Generate a unique ID
        const messageId = `${Date.now()}-${messageCounter.current++}`;
        incoming.id = messageId;
        
        // Check if we've already processed this message ID
        if (processedMessageIds.current.has(messageId)) {
          return;
        }
        
        processedMessageIds.current.add(messageId);
        lastMessageTime = now;
        
        setMessages(prev => {
          const currentMessages = prev[activeChannel] || [];
          
          return {
            ...prev,
            [activeChannel]: [...currentMessages, incoming]
          };
        });

        // Store in fake backend
        FakeServer.addMessage(activeChannel, incoming);

        // Add notification
        addNotification({
          title: `New message in #${activeChannel}`,
          message: `${incoming.sender}: ${incoming.text.length > 50 ? incoming.text.substring(0, 50) + '...' : incoming.text}`,
          type: 'message'
        });
      }
    };

    const interval = setInterval(() => {
      simulateMessage();
    }, 1000); // Check every second, but only send if conditions are met
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeChannel, addNotification]);

  // UPDATED: Handle both sending new messages and editing existing ones
  const handleSendMessage = useCallback((messageData) => {
    // If we're in edit mode, update the message instead of sending new one
    if (isEditMode && editingMessage) {
      console.log('Updating message:', editingMessage.id, 'with text:', messageData.text);
      
      // Clear edit state first
      const currentEditingMessage = editingMessage;
      const currentEditText = messageData.text;
      
      setEditingMessage(null);
      setIsEditMode(false);
      setEditText('');
      
      // Update local state
      setMessages(prev => {
        const updated = { ...prev };
        
        if (!updated[activeChannel]) {
          console.log('No messages in this channel:', activeChannel);
          return updated;
        }
        
        const messageIndex = updated[activeChannel].findIndex(msg => msg.id === currentEditingMessage.id);
        
        if (messageIndex === -1) {
          console.log('Message not found for editing:', currentEditingMessage.id);
          return updated;
        }
        
        // Create a deep copy of the messages array
        const newMessages = [...updated[activeChannel]];
        const messageToUpdate = { ...newMessages[messageIndex] };
        
        // Update the message text and add edited flag
        messageToUpdate.text = currentEditText;
        messageToUpdate.edited = true;
        messageToUpdate.editTimestamp = new Date().toISOString();
        
        newMessages[messageIndex] = messageToUpdate;
        
        console.log('Updated message in state:', messageToUpdate);
        
        return {
          ...updated,
          [activeChannel]: newMessages
        };
      });
      
      // Also update in FakeServer
      FakeServer.editMessage(activeChannel, currentEditingMessage.id, currentEditText);
      
      // Add notification
      addNotification({
        title: 'Message Edited',
        message: 'Your message has been updated',
        type: 'info',
        duration: 2000
      });
      
      return;
    }
    
    // Original send message logic for new messages
    isSendingMessage.current = true;
    
    const messageId = `${Date.now()}-${messageCounter.current++}`;
    const newMessage = {
      id: messageId,
      sender: 'You',
      text: messageData.text,
      timestamp: messageData.timestamp || new Date().toISOString(),
      type: messageData.type || 'text',
      file: messageData.file,
      read: true,
      replyTo: messageData.replyTo
    };

    console.log('Sending new message with ID:', messageId);

    // Track this message ID
    processedMessageIds.current.add(messageId);

    // Update local state
    setMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMessage]
    }));

    // Store in fake backend
    FakeServer.addMessage(activeChannel, newMessage);
    
    // Clear sending flag after a delay
    setTimeout(() => {
      isSendingMessage.current = false;
    }, 1000);
  }, [activeChannel, isEditMode, editingMessage, addNotification]);

  const handleDeleteMessage = useCallback((messageId, forEveryone = false) => {
    if (!messageId) {
      console.error('Cannot delete message: messageId is undefined');
      return;
    }
    
    setMessages(prev => {
      const updated = { ...prev };
      if (updated[activeChannel]) {
        updated[activeChannel] = updated[activeChannel].filter(msg => msg.id !== messageId);
      }
      return updated;
    });

    FakeServer.deleteMessage(activeChannel, messageId, forEveryone);
    
    addNotification({
      title: 'Message Deleted',
      message: forEveryone ? 'Message deleted for everyone' : 'Message deleted for you',
      type: 'info'
    });
  }, [activeChannel, addNotification]);

  const handleAddReaction = useCallback((messageId, emoji) => {
    if (!messageId) {
      console.error('Cannot add reaction: messageId is undefined');
      return;
    }
    
    console.log('Adding reaction to message:', messageId, 'with emoji:', emoji);
    
    setMessages(prev => {
      const updated = { ...prev };
      
      if (!updated[activeChannel]) {
        console.log('No messages in this channel:', activeChannel);
        return updated;
      }
      
      const messageIndex = updated[activeChannel].findIndex(msg => msg.id === messageId);
      
      if (messageIndex === -1) {
        console.log('Message not found:', messageId, 'in channel:', activeChannel);
        console.log('Available messages:', updated[activeChannel].map(m => m.id));
        return updated;
      }
      
      // Create a deep copy of the messages array
      const newMessages = [...updated[activeChannel]];
      const messageToUpdate = { ...newMessages[messageIndex] };
      
      // Initialize reactions object if it doesn't exist
      const currentReactions = messageToUpdate.reactions || {};
      
      // Clone the reactions object
      const newReactions = { ...currentReactions };
      
      // Get current users who reacted with this emoji
      const currentUsers = newReactions[emoji] || [];
      
      // Check if current user already reacted with this emoji
      if (currentUsers.includes('You')) {
        // Remove current user's reaction
        const updatedUsers = currentUsers.filter(user => user !== 'You');
        if (updatedUsers.length === 0) {
          // If no users left, remove the emoji
          delete newReactions[emoji];
        } else {
          newReactions[emoji] = updatedUsers;
        }
      } else {
        // Add current user's reaction
        newReactions[emoji] = [...currentUsers, 'You'];
      }
      
      // Update the message with new reactions
      messageToUpdate.reactions = newReactions;
      newMessages[messageIndex] = messageToUpdate;
      
      console.log('Updated message reactions:', messageToUpdate.reactions);
      
      return {
        ...updated,
        [activeChannel]: newMessages
      };
    });
    
    // Also update in FakeServer
    FakeServer.addReaction(activeChannel, messageId, emoji, 'You');
    
    // Add notification
    addNotification({
      title: 'Reaction Added',
      message: `You reacted with ${emoji}`,
      type: 'info',
      duration: 2000
    });
  }, [activeChannel, addNotification]);

  // UPDATED: Start editing a message
  const handleStartEditing = useCallback((message) => {
    console.log('Starting edit for message:', message);
    setEditingMessage(message);
    setEditText(message.text);
    setIsEditMode(true);
    
    // Add notification
    addNotification({
      title: 'Editing Message',
      message: 'You are now editing your message',
      type: 'info',
      duration: 2000
    });
  }, [addNotification]);

  // UPDATED: Cancel editing
  const handleCancelEdit = useCallback(() => {
    console.log('Canceling edit');
    setEditingMessage(null);
    setIsEditMode(false);
    setEditText('');
    
    addNotification({
      title: 'Edit Canceled',
      message: 'Message editing canceled',
      type: 'info',
      duration: 2000
    });
  }, [addNotification]);

  // UPDATED: Legacy edit function (for compatibility)
  const handleEditMessage = useCallback((messageId, newText) => {
    console.log('Editing message via function:', messageId, 'new text:', newText);
    
    setMessages(prev => {
      const updated = { ...prev };
      
      if (!updated[activeChannel]) {
        console.log('No messages in this channel:', activeChannel);
        return updated;
      }
      
      const messageIndex = updated[activeChannel].findIndex(msg => msg.id === messageId);
      
      if (messageIndex === -1) {
        console.log('Message not found:', messageId);
        return updated;
      }
      
      const newMessages = [...updated[activeChannel]];
      const messageToUpdate = { ...newMessages[messageIndex] };
      
      messageToUpdate.text = newText;
      messageToUpdate.edited = true;
      messageToUpdate.editTimestamp = new Date().toISOString();
      
      newMessages[messageIndex] = messageToUpdate;
      
      console.log('Updated message via function:', messageToUpdate);
      
      return {
        ...updated,
        [activeChannel]: newMessages
      };
    });
    
    FakeServer.editMessage(activeChannel, messageId, newText);
    
    addNotification({
      title: 'Message Edited',
      message: 'Your message has been updated',
      type: 'info',
      duration: 2000
    });
  }, [activeChannel, addNotification]);

  const handleNewChannel = useCallback((channelData) => {
    const newChannel = {
      id: channelData.name.toLowerCase().replace(/\s+/g, '-'),
      name: channelData.name,
      private: channelData.private || false
    };
    
    // Add to fake backend
    const addedChannel = FakeServer.addChannel(newChannel);
    
    if (addedChannel) {
      // Get updated channels list from FakeServer
      const updatedChannels = FakeServer.getChannels();
      setChannels(updatedChannels);
      
      // Initialize empty messages for new channel
      setMessages(prev => ({
        ...prev,
        [addedChannel.id]: []
      }));
      
      // Switch to new channel
      setActiveChannel(addedChannel.id);
      setActiveTab('channels');
      setActiveTeam(null);
      
      // Clear edit state when switching channels
      setEditingMessage(null);
      setIsEditMode(false);
      setEditText('');
      
      addNotification({
        title: 'Channel Created',
        message: `Created ${channelData.private ? 'private' : 'public'} channel: #${channelData.name}`,
        type: 'task'
      });
      
      return true;
    }
    
    return false;
  }, [addNotification]);

  const handleNewDirectMessage = () => {
    addNotification({
      title: 'Direct Message',
      message: 'Start new direct message feature is coming soon!',
      type: 'info'
    });
  };

  const handleChannelSelect = useCallback((channelId) => {
    // Clear edit state when switching channels
    setEditingMessage(null);
    setIsEditMode(false);
    setEditText('');
    
    setActiveChannel(channelId);
    setActiveTeam(null);
    setActiveTab('channels');
    
    // Reset unread count for this channel
    FakeServer.resetUnread(channelId);
  }, []);

  const handleTeamSelect = useCallback((teamId) => {
    // Clear edit state when switching channels
    setEditingMessage(null);
    setIsEditMode(false);
    setEditText('');
    
    setActiveChannel(teamId);
    setActiveTeam(teamId);
    setActiveTab('teams');
    
    // Reset unread count for this team
    FakeServer.resetUnread(teamId);
  }, []);

  const handleCreateTeam = useCallback((teamData) => {
    const newTeam = {
      id: teamData.name.toLowerCase().replace(/\s+/g, '-'),
      name: teamData.name
    };
    
    // Add to fake backend
    const addedTeam = FakeServer.addTeam(newTeam);
    
    if (addedTeam) {
      // Get updated teams list from FakeServer
      const updatedTeams = FakeServer.getTeams();
      setTeams(updatedTeams);
      
      // Initialize welcome messages for new team
      const welcomeMessages = [
        {
          id: `${Date.now()}-${messageCounter.current++}`,
          sender: 'System',
          text: `Welcome to the ${teamData.name} team chat!`,
          timestamp: new Date().toISOString(),
          type: 'system'
        },
        {
          id: `${Date.now()}-${messageCounter.current++}`,
          sender: 'System',
          text: teamData.description || 'No description provided.',
          timestamp: new Date().toISOString(),
          type: 'system'
        },
        {
          id: `${Date.now()}-${messageCounter.current++}`,
          sender: 'You',
          text: `Team "${teamData.name}" has been created!`,
          timestamp: new Date().toISOString(),
          type: 'text'
        }
      ];
      
      // Track message IDs
      welcomeMessages.forEach(msg => {
        processedMessageIds.current.add(msg.id);
      });
      
      setMessages(prev => ({
        ...prev,
        [addedTeam.id]: welcomeMessages
      }));
      
      // Store in fake backend
      welcomeMessages.forEach(msg => {
        FakeServer.addMessage(addedTeam.id, msg);
      });
      
      // Switch to new team
      setActiveChannel(addedTeam.id);
      setActiveTeam(addedTeam.id);
      setActiveTab('teams');
      
      // Clear edit state when switching channels
      setEditingMessage(null);
      setIsEditMode(false);
      setEditText('');
      
      addNotification({
        title: 'Team Created!',
        message: `Team "${teamData.name}" has been created.`,
        type: 'task'
      });
      
      return true;
    }
    
    return false;
  }, [addNotification]);

  // Get unread counts for sidebar
  const getUnreadCount = useCallback((chatId) => {
    return FakeServer.getUnread(chatId);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] rounded-2xl shadow-2xl shadow-purple-200/50 overflow-hidden">
      <div className="h-full">
        <div className="h-full flex bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <ChatSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            activeChannel={activeChannel}
            onChannelSelect={handleChannelSelect}
            activeTeam={activeTeam}
            onTeamSelect={handleTeamSelect}
            onNewChannel={handleNewChannel}
            onNewDirectMessage={handleNewDirectMessage}
            channels={channels}
            teams={teams}
            onCreateTeam={handleCreateTeam}
            getUnreadCount={getUnreadCount}
          />
          
          <ChatMessages
            currentChat={activeChannel}
            messages={messages[activeChannel] || []}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            onAddReaction={handleAddReaction}
            onEditMessage={handleEditMessage}
            onStartEditing={handleStartEditing}
            onCancelEdit={handleCancelEdit}
            socketStatus={socketStatus}
            currentUser="You"
            teams={teams}
            channels={channels}
            isEditMode={isEditMode}
            editingMessage={editingMessage}
            editText={editText}
            setEditText={setEditText}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;