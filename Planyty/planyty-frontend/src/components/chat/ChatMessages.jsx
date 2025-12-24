import React, { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Image as ImageIcon, FileText, Video, ChevronRight, Reply as ReplyIcon, X, Check, Edit } from 'lucide-react';
import { FakeServer } from '../../fake-backend/fakeServer';
import TeamInfoModal from './modals/TeamInfoModal';
import MessageActionsModal from './modals/MessageActionsModal';
import ReactionsModal from './modals/ReactionsModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import ForwardModal from './modals/ForwardModal';

// Import EmojiMart components
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const ChatMessages = ({ 
  currentChat, 
  messages, 
  onSendMessage, 
  onDeleteMessage,
  onAddReaction,
  onEditMessage,
  onStartEditing,  onCancelEdit,  socketStatus,
  currentUser,
  teams = [],
  channels = [],
  isEditMode,  editingMessage,  editText,  setEditText}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showTeamInfo, setShowTeamInfo] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [simulatedMessages, setSimulatedMessages] = useState([]);
  // Local messages state for optimistic updates (sync from prop)
  const [messagesState, setMessages] = useState(messages || []);
  useEffect(() => {
    setMessages(messages || []);
  }, [messages]);
  
  // Message action states
  const [messageActions, setMessageActions] = useState({
    isOpen: false,
    message: null,
    position: { x: 0, y: 0 },
    isCurrentUser: false,
  });
  const [reactionsModal, setReactionsModal] = useState({
    isOpen: false,
    message: null,
    position: { x: 0, y: 0 },
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    messageId: null,
    forEveryone: false,
  });
  const [forwardModal, setForwardModal] = useState({
    isOpen: false,
    message: null,
  });
  const [isReplying, setIsReplying] = useState(false);
  const [replyingMessage, setReplyingMessage] = useState(null);
  
  // REMOVED local edit state - using props from parent
  
  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const textareaRef = useRef(null);

  // Base chat info
  const baseChatInfo = {
    'general': { 
      name: 'general', 
      description: 'General workspace discussion', 
      type: 'channel', 
      members: 42 
    },
    'design': { 
      name: 'design', 
      description: 'Design team discussions', 
      type: 'channel', 
      members: 12 
    },
    'announcements': { 
      name: 'announcements', 
      description: 'Company announcements', 
      type: 'channel', 
      members: 50 
    },
    'frontend-team': { 
      name: 'Frontend Team', 
      description: 'Frontend development team', 
      type: 'team', 
      members: 8 
    },
    'backend-team': { 
      name: 'Backend Team', 
      description: 'Backend development team', 
      type: 'team', 
      members: 6 
    },
    'dm_john': { 
      name: 'John Doe', 
      description: 'Frontend Lead', 
      type: 'dm', 
      status: 'online' 
    },
  };

  const getChatInfo = () => {
    if (baseChatInfo[currentChat]) {
      return baseChatInfo[currentChat];
    }
    
    const team = teams.find(t => t.id === currentChat);
    if (team) {
      return {
        name: team.name,
        description: `${team.name} workspace`,
        type: 'team',
        members: Math.floor(Math.random() * 10) + 5
      };
    }
    
    const channel = channels.find(c => c.id === currentChat);
    if (channel) {
      return {
        name: channel.name,
        description: `${channel.name} channel`,
        type: 'channel',
        members: Math.floor(Math.random() * 30) + 10
      };
    }
    
    if (currentChat.startsWith('dm_')) {
      const name = currentChat.replace('dm_', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return {
        name,
        description: 'Direct message conversation',
        type: 'dm',
        status: 'online'
      };
    }
    
    if (currentChat.includes('team') || currentChat.includes('-team')) {
      const name = currentChat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return {
        name,
        description: `${currentChat.replace(/-/g, ' ')} workspace`,
        type: 'team',
        members: Math.floor(Math.random() * 10) + 5
      };
    }
    
    return {
      name: currentChat,
      description: `${currentChat} channel`,
      type: 'channel',
      members: Math.floor(Math.random() * 30) + 10
    };
  };

  const chatInfo = getChatInfo();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, simulatedMessages]);

  // Focus textarea when edit mode changes
  useEffect(() => {
    if (isEditMode && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.select();
      }, 100);
    }
  }, [isEditMode]);

  // Message simulation effect
  useEffect(() => {
    let isMounted = true;
    let timeoutId;
    
    const simulateIncomingMessage = () => {
      if (!isMounted) return;
      
      const incoming = FakeServer.simulateIncomingMessage(currentChat);
      
      if (incoming && incoming.sender !== currentUser) {
        setSimulatedMessages(prev => {
          const exists = prev.some(msg => msg.id === incoming.id);
          if (exists) return prev;
          
          return [...prev, incoming];
        });
        
        FakeServer.addMessage(currentChat, incoming);
      }
    };
    
    timeoutId = setTimeout(() => {
      if (isMounted) {
        simulateIncomingMessage();
        
        const scheduleNextMessage = () => {
          if (!isMounted) return;
          
          const randomDelay = 8000 + Math.random() * 7000;
          timeoutId = setTimeout(() => {
            simulateIncomingMessage();
            scheduleNextMessage();
          }, randomDelay);
        };
        
        scheduleNextMessage();
      }
    }, 5000);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [currentChat, currentUser]);

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check emoji picker
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      
      // Check message actions modal
      const isOutsideMessageActions = !event.target.closest('.message-actions-modal');
      const isOutsideReactions = !event.target.closest('.reactions-modal');
      
      if (messageActions.isOpen && isOutsideMessageActions) {
        setMessageActions({ ...messageActions, isOpen: false });
      }
      if (reactionsModal.isOpen && isOutsideReactions) {
        setReactionsModal({ ...reactionsModal, isOpen: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [messageActions, reactionsModal]);

  // ========== MESSAGE ACTION HANDLERS ==========
  const handleDoubleClick = (message, event, isCurrentUser) => {
    event.stopPropagation();
    setMessageActions({
      isOpen: true,
      message,
      position: { x: event.clientX, y: event.clientY },
      isCurrentUser,
    });
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessageActions({ ...messageActions, isOpen: false });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleReply = (message) => {
    setReplyingMessage(message);
    setIsReplying(true);
    setMessageActions({ ...messageActions, isOpen: false });
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  const handleForward = (message) => {
    setForwardModal({ isOpen: true, message });
    setMessageActions({ ...messageActions, isOpen: false });
  };

  const handleActualForward = (message, chatId) => {
    const forwardMessage = {
      ...message,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      forwarded: true,
      originalSender: message.sender,
      sender: 'You',
      text: `Forwarded: ${message.text}`
    };
    
    onSendMessage(forwardMessage);
    FakeServer.addMessage(currentChat, forwardMessage);
    
    FakeServer.addMessage(chatId, {
      ...forwardMessage,
      id: `${Date.now()}-${Math.random() + 1}`
    });
    
    setForwardModal({ ...forwardModal, isOpen: false });
  };

  const handleDelete = (messageId) => {
    setDeleteModal({ isOpen: true, messageId, forEveryone: false });
    setMessageActions({ ...messageActions, isOpen: false });
  };

  const handleDeleteForEveryone = (messageId) => {
    setDeleteModal({ isOpen: true, messageId, forEveryone: true });
    setMessageActions({ ...messageActions, isOpen: false });
  };

  const confirmDelete = () => {
    const { messageId, forEveryone } = deleteModal;
    onDeleteMessage(messageId, forEveryone);
    setDeleteModal({ isOpen: false, messageId: null, forEveryone: false });
  };

  const handleReact = (message) => {
    if (!message || !message.id) {
      console.error('Cannot react: Message or message.id is missing', message);
      return;
    }
    
    setReactionsModal({
      isOpen: true,
      message: message,
      position: { 
        x: messageActions.position.x, 
        y: messageActions.position.y - 50 
      },
    });
    
    setMessageActions({ ...messageActions, isOpen: false });
  };

  // UPDATED: EDIT HANDLER - Use parent's function
  const handleEdit = (message) => {
    console.log('Edit message called:', message);
    
    // Use parent's function to start editing
    if (onStartEditing) {
      onStartEditing(message);
    }
    
    setMessageActions({ ...messageActions, isOpen: false });
  };

  // UPDATED: HANDLE SEND - SUPPORTS BOTH NEW MESSAGES AND EDITS
  const handleSend = (e) => {
    e.preventDefault();
    
    // If in edit mode, handle editing
    if (isEditMode && editText.trim()) {
      const msg = {
        text: editText.trim(),
        timestamp: new Date().toISOString(),
        type: 'text',
        sender: currentUser
      };
      
      console.log('Sending edited message:', msg);
      onSendMessage(msg);
      return;
    }
    
    // Original send logic for new messages
    if (!newMessage.trim()) return;

    const msg = {
      id: `${Date.now()}-${Math.random()}`,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
      sender: currentUser,
      replyTo: replyingMessage ? {
        id: replyingMessage.id,
        sender: replyingMessage.sender,
        text: replyingMessage.text
      } : null
    };

    onSendMessage(msg);
    FakeServer.addMessage(currentChat, msg);
    setNewMessage('');
    setReplyingMessage(null);
    setIsReplying(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const msg = {
        id: `${Date.now()}-${Math.random()}`,
        text: `Uploaded file: ${file.name}`,
        file,
        timestamp: new Date().toISOString(),
        type: 'file',
        sender: currentUser,
        replyTo: replyingMessage ? {
          id: replyingMessage.id,
          sender: replyingMessage.sender,
          text: replyingMessage.text
        } : null
      };

      onSendMessage(msg);
      FakeServer.addMessage(currentChat, msg);
      e.target.value = '';
      setReplyingMessage(null);
      setIsReplying(false);
    }
  };

  // UPDATED: Emoji picker handler
  const handleEmojiSelect = (emoji) => {
    if (isEditMode) {
      setEditText(prev => prev + emoji.native);
    } else {
      setNewMessage(prev => prev + emoji.native);
    }
    setShowEmojiPicker(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) {
      return <ImageIcon className="w-3 h-3" />;
    } else if (['mp4', 'mov', 'avi'].includes(ext)) {
      return <Video className="w-3 h-3" />;
    } else {
      return <FileText className="w-3 h-3" />;
    }
  };

  const allMessages = [...(messagesState || []), ...simulatedMessages]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const groupMessagesByDate = () => {
    const groups = {};
    allMessages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate();
  const isTeamChat = chatInfo.type === 'team';

 // Message Bubble Component - FIXED VERSION
// Message Bubble Component - FIXED VERSION with reactions below bubble
const MessageBubble = ({ message, isCurrentUser, showTimestamp = false }) => {
  const hasReactions = message.reactions && 
    ((Array.isArray(message.reactions) && message.reactions.length > 0) ||
     (typeof message.reactions === 'object' && Object.keys(message.reactions).length > 0));
  
  return (
    <div className={`relative ${isCurrentUser ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
      {/* Message bubble */}
      <div className={`relative px-3 py-2 rounded-lg max-w-xs ${
        isCurrentUser
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
          : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
      }`}>
        {message.replyTo && (
          <div className="mb-1.5 pb-1.5 border-l-2 border-purple-400 pl-2">
            <div className="text-xs opacity-90">
              Replying to <span className="font-medium">{message.replyTo.sender}</span>
            </div>
            <div className="text-xs truncate opacity-80">
              {message.replyTo.text.length > 35 
                ? `${message.replyTo.text.substring(0, 35)}...` 
                : message.replyTo.text}
            </div>
          </div>
        )}
        
        {message.type === 'file' ? (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded">
              {getFileIcon(message.file?.name || 'file')}
            </div>
            <div>
              <div className="text-sm font-medium">{message.file?.name || 'File'}</div>
              <div className="text-xs opacity-80">{message.text}</div>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words text-sm">
            {message.text}
            {message.edited && (
              <span className="text-xs italic ml-1 opacity-70">(edited)</span>
            )}
          </div>
        )}
        
        {/* Show timestamp if enabled */}
        {showTimestamp && (
          <div className={`text-xs mt-1 flex items-center justify-end gap-1 ${
            isCurrentUser ? 'text-purple-100' : 'text-gray-500'
          }`}>
            {formatTime(message.timestamp)}
            {isCurrentUser && message.read && (
              <span className="text-blue-300 text-xs">✓✓</span>
            )}
          </div>
        )}
      </div>
      
      {/* Reactions positioned below the bubble */}
      {hasReactions && (
        <div className={`flex flex-wrap gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
          {Array.isArray(message.reactions) 
            ? message.reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform ${
                    reaction.byMe
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddReaction(message.id, reaction.emoji);
                  }}
                  title={`${reaction.count || 1} reaction${(reaction.count || 1) > 1 ? 's' : ''} ${reaction.byMe ? '(You)' : ''}`}
                >
                  <span className="text-xs">{reaction.emoji}</span>
                  {(reaction.count || 1) > 1 && (
                    <span className="text-[10px] font-medium">{reaction.count || 1}</span>
                  )}
                </button>
              ))
            : Object.entries(message.reactions || {}).map(([emoji, users]) => (
                <button
                  key={emoji}
                  className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform ${
                    users.includes('You')
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddReaction(message.id, emoji);
                  }}
                  title={`${users.length} reaction${users.length > 1 ? 's' : ''} ${users.includes('You') ? '(You)' : ''}`}
                >
                  <span className="text-xs">{emoji}</span>
                  {users.length > 1 && (
                    <span className="text-[10px] font-medium">{users.length}</span>
                  )}
                </button>
              ))
          }
        </div>
      )}
    </div>
  );
};
  // add this handler INSIDE the ChatMessages component (before the return)
  const handleAddReaction = (messageId, emoji) => {
    // optimistic UI update against local state
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const reactionsObj = Array.isArray(m.reactions) ? [...m.reactions] : [];
      const existing = reactionsObj.find(r => r.emoji === emoji);
      if (existing) {
        existing.count = (existing.count || 1) + 1;
        existing.byMe = true;
      } else {
        reactionsObj.push({ emoji, count: 1, byMe: true });
      }
      return { ...m, reactions: reactionsObj };
    }));

    // notify parent / server
    if (typeof onAddReaction === 'function') {
      onAddReaction(messageId, emoji);
    }
  };
  
  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-white h-full">
      {/* Chat Header */}
      <div 
        className={`p-4 border-b border-gray-200 bg-white ${isTeamChat ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
        onClick={() => {
          if (isTeamChat) {
            setShowTeamInfo(true);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
              {chatInfo.name?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-800">
                  {chatInfo.type === 'dm' ? chatInfo.name : `#${chatInfo.name}`}
                </h2>
                {isTeamChat && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-500">
                {chatInfo.type === 'dm' 
                  ? `${chatInfo.description} • ${chatInfo.status}`
                  : `${chatInfo.description} • ${chatInfo.members} members`
                }
                {isTeamChat && (
                  <span className="ml-2 text-purple-600 font-medium">• Click for team info</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              socketStatus === 'connected' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {socketStatus === 'connected' ? '● Live' : '○ Offline'}
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date}>
            <div className="flex items-center justify-center my-3">
              <div className="flex-1 h-px bg-gray-200"></div>
              <div className="px-2 py-1 mx-2 bg-white text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                {date}
              </div>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="space-y-2">
              {dateMessages.map((message, index) => {
  const isCurrentUser = message.sender === currentUser;
  const showAvatar = index === 0 || dateMessages[index - 1].sender !== message.sender;
  const showTimestamp = index === dateMessages.length - 1 || dateMessages[index + 1].sender !== message.sender;

  return (
    <div 
      key={message.id} 
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-1`}
      onDoubleClick={(e) => handleDoubleClick(message, e, isCurrentUser)}
    >
      {!isCurrentUser && (
        <div className="flex items-start max-w-[70%]">
          {/* Avatar container - always takes up space */}
          <div className={`flex-shrink-0 ${showAvatar ? 'w-8' : 'w-8 invisible'}`}>
            {showAvatar && (
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-medium">
                {message.sender.charAt(0)}
              </div>
            )}
          </div>
          
          {/* Message content container */}
          <div className="ml-2">
            {/* Sender name - only show for first message in group */}
            {showAvatar && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-700">{message.sender}</span>
                {showTimestamp && (
                  <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                )}
              </div>
            )}
            
            {/* Message bubble */}
            <MessageBubble 
              message={message}
              isCurrentUser={isCurrentUser}
              showTimestamp={false}
            />
            
            {/* Timestamp for non-first messages in group */}
            {!showAvatar && showTimestamp && (
              <div className="text-xs text-gray-500 mt-1 ml-1">
                {formatTime(message.timestamp)}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Current user's messages */}
      {isCurrentUser && (
        <div className="flex flex-col items-end max-w-[70%]">
          <MessageBubble 
            message={message}
            isCurrentUser={isCurrentUser}
            showTimestamp={false}
          />
          
          {/* Timestamp for current user */}
          {showTimestamp && (
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              {formatTime(message.timestamp)}
              {message.read && (
                <span className="text-blue-500 text-xs">✓✓</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
})}
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white/90 backdrop-blur-sm">
        <form onSubmit={handleSend} className="space-y-3">
          {/* EDIT MODE INDICATOR - ADD THIS */}
          {isEditMode && editingMessage && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center justify-center text-white">
                  <Edit className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-blue-700">
                    Editing message
                  </div>
                  <div className="text-xs text-blue-600 truncate">
                    Original: "{editingMessage.text.length > 50 
                      ? `${editingMessage.text.substring(0, 50)}...` 
                      : editingMessage.text}"
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onCancelEdit}
                className="p-1 hover:bg-blue-100 rounded transition-colors text-blue-600 text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          )}
          
          {/* Reply Indicator */}
          {isReplying && replyingMessage && !isEditMode && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white">
                  <ReplyIcon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-purple-700">
                    Replying to {replyingMessage.sender}
                  </div>
                  <div className="text-xs text-purple-600 truncate max-w-xs">
                    {replyingMessage.text.length > 50 
                      ? `${replyingMessage.text.substring(0, 50)}...` 
                      : replyingMessage.text}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReplying(false);
                  setReplyingMessage(null);
                }}
                className="p-1 hover:bg-purple-100 rounded transition-colors"
                title="Cancel reply"
              >
                <X className="w-3 h-3 text-purple-600" />
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {/* File Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-600 transition-all duration-300 border border-purple-100 flex items-center justify-center"
              title="Attach file"
              style={{ height: '44px', width: '44px' }}
            >
              <Paperclip className="w-4 h-4" />
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            
            {/* UPDATED: Message Input Container */}
            <div className="flex-1 relative" ref={emojiPickerRef}>
              <textarea
                ref={textareaRef}
                value={isEditMode ? editText : newMessage}
                onChange={(e) => isEditMode ? setEditText(e.target.value) : setNewMessage(e.target.value)}
                placeholder={
                  isEditMode 
                    ? "Edit your message..." 
                    : `Message ${chatInfo.type === 'dm' ? chatInfo.name : '#' + chatInfo.name}`
                }
                className="message-input w-full min-h-[44px] px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none shadow-sm text-sm"
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  } else if (e.key === 'Escape' && isEditMode) {
                    onCancelEdit();
                  }
                }}
                style={{
                  minHeight: '44px',
                  maxHeight: '100px'
                }}
              />
              
              {/* Emoji Picker Button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded transition-all duration-200 ${
                  showEmojiPicker 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                }`}
                title="Add emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
              
              {/* EmojiMart Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-1 z-50">
                  <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                    <Picker
                      data={data}
                      onEmojiSelect={handleEmojiSelect}
                      theme="light"
                      previewPosition="none"
                      skinTonePosition="none"
                      perLine={8}
                      emojiSize={20}
                      emojiButtonSize={28}
                      maxFrequentRows={1}
                      navPosition="top"
                      searchPosition="top"
                      maxHeight={300}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={isEditMode ? !editText.trim() : !newMessage.trim()}
              className={`flex-shrink-0 p-3 rounded-lg transition-all duration-300 flex items-center justify-center ${
                (isEditMode ? editText.trim() : newMessage.trim())
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg hover:scale-105'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={isEditMode ? "Save changes" : "Send message"}
              style={{ height: '44px', width: '44px' }}
            >
              {isEditMode ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Input Hint */}
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              {isEditMode 
                ? "Enter to save • Escape to cancel" 
                : "Enter to send • Shift+Enter for new line"
              }
            </span>
            <span className={`font-medium ${
              (isEditMode ? editText.length : newMessage.length) > 500 
                ? 'text-red-500' 
                : 'text-gray-400'
            }`}>
              {isEditMode ? editText.length : newMessage.length}/500
            </span>
          </div>
        </form>
      </div>

      {/* Modals */}
      <MessageActionsModal
        isOpen={messageActions.isOpen}
        message={messageActions.message}
        isCurrentUser={messageActions.isCurrentUser}
        position={messageActions.position}
        onClose={() => setMessageActions({ ...messageActions, isOpen: false })}
        onCopy={handleCopy}
        onReply={handleReply}
        onForward={handleForward}
        onDelete={handleDelete}
        onDeleteForEveryone={handleDeleteForEveryone}
        onReact={handleReact}
        onEdit={handleEdit} // Use the updated handler
      />

      <ReactionsModal
        isOpen={reactionsModal.isOpen}
        message={reactionsModal.message}
        position={reactionsModal.position}
        onClose={() => setReactionsModal({ ...reactionsModal, isOpen: false })}
        onAddReaction={handleAddReaction}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        isDeleteForEveryone={deleteModal.forEveryone}
      />

      <ForwardModal
        isOpen={forwardModal.isOpen}
        onClose={() => setForwardModal({ ...forwardModal, isOpen: false })}
        message={forwardModal.message}
        channels={channels}
        teams={teams}
        onForward={handleActualForward}
      />

      {/* Team Info Modal */}
      {showTeamInfo && (
        <TeamInfoModal
          team={{ 
            id: currentChat, 
            name: chatInfo.name,
            description: chatInfo.description 
          }}
          onClose={() => setShowTeamInfo(false)}
          onLeaveTeam={() => {
            console.log('Leave team clicked');
            setShowTeamInfo(false);
          }}
          onDeleteTeam={() => {
            console.log('Delete team clicked');
            setShowTeamInfo(false);
          }}
        />
      )}
    </div>
  );
};

export default ChatMessages;