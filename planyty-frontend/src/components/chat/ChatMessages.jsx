// ChatMessages.jsx - COMPLETE UPDATED FILE
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, MoreVertical, X, Check, CheckCheck, Copy, 
  Forward, Reply, Trash2, Edit2, Smile, Eye, Image,
  Paperclip, Mic, Calendar, MapPin, FileText,
  Heart, ThumbsUp, Laugh, Frown, Angry, Meh,
  ChevronDown, ChevronUp, MoreHorizontal,
  Users, Clock, Pin, Bookmark, Share2, Download,
  Maximize2, Minimize2, Volume2, VolumeX, Video,
  Phone, Info, Star, Filter, Search, EyeOff,
  MessageSquare, UserPlus, File, FileImage, FileVideo,
  XCircle, Upload, Play, Pause, StopCircle, ExternalLink,
  RefreshCw
} from 'lucide-react';
import MessageActionsModal from './modals/MessageActionsModal';
import ReactionsDisplay from './modals/ReactionsDisplay';
import ConfirmationModal from './modals/ConfirmationModal';
import { useNotifications } from '../../contexts/NotificationContext';
import InviteUserModal from './modals/InviteUserModal';
import FilePreviewModal from './modals/FilePreviewModal';
const ChatMessages = ({ 
  currentChat, messages, onSendMessage, onDeleteMessage, onEditMessage,
  onForwardMessage, onReplyMessage, onReaction, replyingTo, setReplyingTo,
  socketStatus, currentUser, userName, isEditMode, setIsEditMode, editingMessage, setEditingMessage, 
  editText, setEditText, onTypingStart, onTypingStop, typingUsers,
  isConnected, onReconnect, originalChannelName, isDMChannel, directUsers,
  channelInfo, onClearChatHistory, onDeleteDirectMessage, onDeleteChannel,
  userRole, socket, usersList, activeChannel, onUploadFile,
  onRefreshChannels, onRefreshCurrentChannel // Add these props
}) => {
  const { addNotification } = useNotifications();
  
  const [newMessage, setNewMessage] = useState('');
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [actionModal, setActionModal] = useState({ 
    isOpen: false, 
    message: null, 
    position: { x: 0, y: 0 } 
  });
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false
  });

  // File upload states
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [filePreviewModal, setFilePreviewModal] = useState({
  isOpen: false,
  files: [],
  currentIndex: 0
});
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  
  // Audio player states
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef(null);
  
  // LOCAL STATE MANAGEMENT
  const [localMessages, setLocalMessages] = useState(messages || []);

  // Update local messages when parent messages change
  useEffect(() => {
    console.log('📥 Updating local messages from props:', messages?.length);
    setLocalMessages(messages || []);
  }, [messages]);

  // Add socket event listeners for immediate UI updates
  useEffect(() => {
    if (!socket) return;

    const handleChatHistoryClearedImmediate = (data) => {
      console.log('🧹 IMMEDIATE: Chat history cleared event:', data);
      if (data.channelId === activeChannel) {
        setLocalMessages([]);
        addNotification(`Cleared ${data.deletedCount || 'all'} messages from chat`, 'info');
      }
    };

    const handleChannelMessagesCleared = (data) => {
      console.log('🧹 Channel messages cleared:', data);
      if (data.channelId === activeChannel) {
        setLocalMessages([]);
      }
    };

    const handleMessageDeleted = (data) => {
      console.log('🗑️ Message deleted event:', data);
      if (data.channelId === activeChannel) {
        if (data.deleteForEveryone) {
          setLocalMessages(prev => 
            prev.filter(msg => (msg.id || msg._id) !== data.messageId)
          );
        } else {
          setLocalMessages(prev => 
            prev.map(msg => 
              (msg.id || msg._id) === data.messageId ? {
                ...msg,
                text: "This message was deleted",
                deleted: true,
                deletedBy: data.deletedBy || currentUser
              } : msg
            )
          );
        }
        addNotification('Message deleted', 'info');
      }
    };

    const handleMessageUpdated = (data) => {
      console.log('✏️ Message updated event:', data);
      if (data.channelId === activeChannel) {
        setLocalMessages(prev => 
          prev.map(msg => 
            msg.id === data.messageId ? {
              ...msg,
              text: data.newText,
              edited: true,
              editedAt: data.editedAt
            } : msg
          )
        );
      }
    };

    const handleReceiveReaction = (data) => {
      console.log('😊 Reaction received:', data);
      if (data.channelId === activeChannel) {
        setLocalMessages(prev => 
          prev.map(msg => 
            msg.id === data.messageId ? { 
              ...msg, 
              reactions: data.reactions 
            } : msg
          )
        );
      }
    };

    const handleChannelCreated = (data) => {
      console.log('✅ Channel created immediately:', data);
      addNotification(`Channel #${data.name} created successfully`, 'success');
    };

    const handleChannelDeleted = (data) => {
      console.log('🗑️ Channel deleted:', data);
      if (activeChannel === data.channelId) {
        addNotification(`Channel "${data.channelName}" has been deleted`, 'info');
      }
    };

    socket.on('chat_history_cleared_immediate', handleChatHistoryClearedImmediate);
    socket.on('channel_messages_cleared', handleChannelMessagesCleared);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_updated', handleMessageUpdated);
    socket.on('receive_reaction', handleReceiveReaction);
    socket.on('channel_created', handleChannelCreated);
    socket.on('channel_deleted_immediate', handleChannelDeleted);

    return () => {
      socket.off('chat_history_cleared_immediate', handleChatHistoryClearedImmediate);
      socket.off('channel_messages_cleared', handleChannelMessagesCleared);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('receive_reaction', handleReceiveReaction);
      socket.off('channel_created', handleChannelCreated);
      socket.off('channel_deleted_immediate', handleChannelDeleted);
    };
  }, [socket, activeChannel, addNotification, currentUser]);
const toggleAudioPlayback = useCallback(async (audioUrl, messageId) => {
  console.log('🎵 Audio playback requested:', { audioUrl, messageId });

  // Stop currently playing audio
  if (playingAudio && audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPlayingAudio(null);
    setAudioProgress(0);
    
    if (playingAudio === audioUrl) {
      return;
    }
  }

  // Create a new audio element
  const audio = new Audio();
  audioRef.current = audio;

  // Set up event listeners
  audio.onloadedmetadata = () => {
    console.log('✅ Audio loaded');
    setAudioDuration(audio.duration);
    setPlayingAudio(audioUrl);
    audio.play().catch(err => {
      console.error('❌ Play failed:', err);
      addNotification('Cannot play audio. File might be missing.', 'error');
    });
  };

  audio.ontimeupdate = () => {
    if (audio.duration > 0) {
      setAudioProgress((audio.currentTime / audio.duration) * 100);
    }
  };

  audio.onended = () => {
    console.log('✅ Playback ended');
    setPlayingAudio(null);
    setAudioProgress(0);
  };

  audio.onerror = (e) => {
    console.error('❌ Audio error:', audio.error);
    addNotification('Cannot play voice message. File may have been deleted.', 'error');
    setPlayingAudio(null);
    
    // Mark this message as unavailable
    setLocalMessages(prev => 
      prev.map(msg => 
        (msg.id || msg._id) === messageId ? {
          ...msg,
          audioUnavailable: true
        } : msg
      )
    );
  };

  // Set the source and try to play
  audio.src = audioUrl.startsWith('http') ? audioUrl : `http://localhost:5000${audioUrl}`;
  audio.crossOrigin = 'anonymous';
  audio.preload = 'auto';

}, [playingAudio, addNotification, setLocalMessages]);
// In ChatMessages.jsx - Update sendVoiceMessage function:
const sendVoiceMessage = async () => {
  if (!recordedAudio) return;

  try {
    console.log('🎤 Sending voice message...');
    
    const formData = new FormData();
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 1000000000);
    const filename = `voice-${timestamp}-${randomId}.webm`;
    
    formData.append('audio', recordedAudio.blob, filename);
    formData.append('duration', recordingTime);
    formData.append('senderId', currentUser);
    formData.append('senderName', userName);

    // Upload
    const response = await fetch('http://localhost:5000/api/upload/audio', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    console.log('✅ Upload result:', result);

    // Use the URL returned by server
    const audioUrl = result.audioUrl || `/uploads/audio/${result.filename}`;
    
    // Send the message as an object with audio data
    onSendMessage({
      text: `🎤 Voice message (${recordingTime}s)`,
      audioUrl: audioUrl,
      audioSize: result.size || recordedAudio.blob.size,
      audioDuration: result.duration || recordingTime,
      isVoiceMessage: true
    });

    // Clean up
    if (recordedAudio.url) {
      URL.revokeObjectURL(recordedAudio.url);
    }
    setRecordedAudio(null);
    setRecordingTime(0);
    
    addNotification('Voice message sent!', 'success');

  } catch (error) {
    console.error('❌ Voice message error:', error);
    addNotification('Failed to send voice message', 'error');
    
    if (recordedAudio?.url) {
      URL.revokeObjectURL(recordedAudio.url);
    }
    setRecordedAudio(null);
    setRecordingTime(0);
  }
};
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);
// ChatMessages.jsx - Update getFileIcon function
const getFileIcon = useCallback((fileType, fileName) => {
  if (fileType === 'image') return <FileImage size={20} className="text-blue-500" />;
  if (fileType === 'video') return <FileVideo size={20} className="text-purple-500" />;
  if (fileType === 'audio') return <Volume2 size={20} className="text-green-500" />;
  
  // Check file extension for documents
  const ext = fileName.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return <FileText size={20} className="text-red-500" />;
  if (['doc', 'docx'].includes(ext)) return <FileText size={20} className="text-blue-600" />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileText size={20} className="text-green-600" />;
  if (['ppt', 'pptx'].includes(ext)) return <FileText size={20} className="text-orange-500" />;
  if (['txt', 'rtf'].includes(ext)) return <FileText size={20} className="text-gray-500" />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <File size={20} className="text-yellow-500" />;
  
  return <File size={20} className="text-gray-500" />;
}, []);
  // Show confirmation modal
  const showConfirmation = useCallback((config) => {
    setConfirmationModal({
      isOpen: true,
      type: config.type || 'danger',
      title: config.title,
      message: config.message,
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, isLoading: true }));
        try {
          await config.onConfirmAction();
        } catch (error) {
          addNotification(error.message || 'Action failed', 'error');
        } finally {
          setConfirmationModal(prev => ({ ...prev, isLoading: false, isOpen: false }));
        }
      },
      isLoading: false
    });
  }, [addNotification]);

  // Function to clear chat history with confirmation
  const handleClearChatHistory = useCallback(() => {
    if (!channelInfo || !channelInfo._id) {
      addNotification('Cannot clear chat: Channel ID not found', 'error');
      return;
    }

    showConfirmation({
      type: 'danger',
      title: 'Clear Chat History',
      message: `Are you sure you want to clear all messages in this chat? This action cannot be undone.`,
      onConfirmAction: async () => {
        console.log('🧹 Calling onClearChatHistory for channel:', channelInfo._id);
        onClearChatHistory(channelInfo._id);
      }
    });
  }, [channelInfo, addNotification, showConfirmation, onClearChatHistory]);

  // Function to delete entire conversation with confirmation
  const handleDeleteConversation = useCallback(() => {
    if (!channelInfo || !channelInfo._id) {
      addNotification('Cannot delete conversation: Channel ID not found', 'error');
      return;
    }

    showConfirmation({
      type: 'danger',
      title: 'Delete Conversation',
      message: `Are you sure you want to delete this entire conversation? This will remove the chat for all participants and cannot be undone.`,
      onConfirmAction: async () => {
        console.log('🗑️ Calling onDeleteDirectMessage for channel:', channelInfo._id);
        onDeleteDirectMessage(channelInfo._id);
      }
    });
  }, [channelInfo, addNotification, showConfirmation, onDeleteDirectMessage]);

  // Function to delete channel with confirmation
  const handleDeleteChannel = useCallback(() => {
    if (!channelInfo || !channelInfo._id) {
      addNotification('Cannot delete channel: Channel ID not found', 'error');
      return;
    }

    if (channelInfo._id === 'general') {
      addNotification('Cannot delete the General channel', 'error');
      return;
    }

    showConfirmation({
      type: 'danger',
      title: 'Delete Channel',
      message: `Are you sure you want to delete the channel "#${channelInfo.name}"? This will delete all messages and remove the channel for all members. This action cannot be undone.`,
      onConfirmAction: async () => {
        console.log('🗑️ Calling onDeleteChannel for channel:', channelInfo._id);
        onDeleteChannel(channelInfo._id);
      }
    });
  }, [channelInfo, addNotification, showConfirmation, onDeleteChannel]);
// In ChatMessages.jsx - Update handleDeleteMessage function
const handleDeleteMessage = useCallback((messageId, deleteForEveryone = false) => {
  showConfirmation({
    type: deleteForEveryone ? 'danger' : 'warning',
    title: deleteForEveryone ? 'Delete for Everyone' : 'Delete for Me',
    message: deleteForEveryone 
      ? 'This message will be deleted for all participants. This action cannot be undone.'
      : 'This message will be deleted only for you. Other participants will still see it.',
    onConfirmAction: async () => {
      try {
        console.log(`🗑️ Deleting message ${messageId} (for everyone: ${deleteForEveryone})`);
        
        // Call the parent delete function
        onDeleteMessage(messageId, deleteForEveryone);
        
        // Immediate UI update for better UX
        setLocalMessages(prev => {
          if (deleteForEveryone) {
            // Remove message completely
            return prev.filter(msg => (msg.id || msg._id) !== messageId);
          } else {
            // Soft delete - mark as deleted
            return prev.map(msg => 
              (msg.id || msg._id) === messageId ? {
                ...msg,
                text: "This message was deleted",
                deleted: true,
                deletedBy: currentUser
              } : msg
            );
          }
        });
        
        addNotification(
          deleteForEveryone ? 'Message deleted for everyone' : 'Message deleted for you',
          'info'
        );
        
      } catch (error) {
        console.error('❌ Delete error:', error);
        addNotification(error.message || 'Failed to delete message', 'error');
      }
    }
  });
}, [showConfirmation, onDeleteMessage, addNotification, currentUser]);
  // File upload functions
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'video/mp4', 'video/mpeg', 'audio/mpeg', 'audio/wav', 'audio/webm'
    ];
    
    const validFiles = files.filter(file => {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        addNotification(`${file.name} exceeds 50MB limit`, 'error');
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        addNotification(`${file.name} file type not allowed`, 'error');
        return false;
      }
      return true;
    });

    setAttachedFiles(prev => [...prev, ...validFiles.map(file => ({
      file,
      type: file.type.startsWith('image/') ? 'image' : 
            file.type.startsWith('video/') ? 'video' : 
            file.type.startsWith('audio/') ? 'audio' : 'document',
      name: file.name,
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }))]);
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
// ChatMessages.jsx - Update uploadFiles function
const uploadFiles = async () => {
  if (attachedFiles.length === 0) return;

  setIsUploading(true);
  setUploadProgress(0);

  try {
    console.log('📤 Uploading files:', attachedFiles.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size
    })));

    const formData = new FormData();
    attachedFiles.forEach(fileData => {
      formData.append('files', fileData.file);
    });
    formData.append('channelId', activeChannel);
    formData.append('senderId', currentUser);
    formData.append('senderName', userName);

    const response = await fetch('http://localhost:5000/api/upload/files', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Upload result:', result);
    
    // Update progress to 100%
    setUploadProgress(100);
    
    // **IMPORTANT: Check if there's any voice message data interfering**
    console.log('🔍 Checking for voice message interference:', {
      hasRecordedAudio: !!recordedAudio,
      recordingTime: recordingTime,
      isRecording: isRecording
    });
    
    // **FIX: Make sure we're ONLY sending file data**
    const messageData = {
      text: newMessage.trim() || `${result.files.length} file(s) uploaded`,
      files: result.files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: file.url,
        filename: file.filename,
        mimetype: file.mimetype
      })),
      // **EXPLICITLY SET voice message properties to false/undefined**
      audioUrl: undefined,
      audioSize: undefined,
      audioDuration: undefined,
      isVoiceMessage: false,
      replyTo: replyingTo ? {
        id: replyingTo.id || replyingTo._id,
        sender: getSenderDisplayName(replyingTo),
        text: replyingTo.text
      } : null
    };
    
    console.log('📦 Sending CLEAN file message:', {
      text: messageData.text,
      fileCount: messageData.files.length,
      hasAudio: !!messageData.audioUrl,
      isVoiceMessage: messageData.isVoiceMessage
    });
    
    // Send the message using onSendMessage
    onSendMessage(messageData);
    
    // Clear files after successful upload
    attachedFiles.forEach(file => {
      if (file.preview) URL.revokeObjectURL(file.preview);
    });
    setAttachedFiles([]);
    setIsUploading(false);
    setUploadProgress(0);
    setNewMessage('');
    
    addNotification(`Uploaded ${attachedFiles.length} file(s) successfully`, 'success');

  } catch (error) {
    console.error('Upload error:', error);
    addNotification(`Failed to upload files: ${error.message}`, 'error');
    setIsUploading(false);
  }
};
  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio({
          blob: audioBlob,
          url: audioUrl,
          duration: recordingTime
        });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      addNotification('Could not access microphone. Please check permissions.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
    }
  };
  const cancelRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio.url);
      setRecordedAudio(null);
    }
    setRecordingTime(0);
  };

  // Resolve chat name
  const getResolvedChatName = useCallback(() => {
    if (!isDMChannel) {
      const name = currentChat || 'Channel';
      return name.startsWith('#') ? name : `#${name}`;
    }
    
    if (channelInfo?.displayName && channelInfo.displayName !== 'Unknown User') {
      return channelInfo.displayName;
    }
    
    if (currentChat && currentChat !== 'Unknown User' && !currentChat.startsWith('dm-')) {
      return currentChat;
    }
    
    return userName || 'Direct Message';
  }, [currentChat, isDMChannel, channelInfo, userName]);
  
  const resolvedChatName = getResolvedChatName();
  
  const getSenderDisplayName = useCallback((msg) => {
    if (msg.senderName) return msg.senderName;
    if (msg.sender) {
      if (msg.sender === currentUser || msg.senderId === currentUser) {
        return userName;
      }
      
      if (msg.sender.length > 10) {
        if (directUsers && Array.isArray(directUsers)) {
          const user = directUsers.find(u => 
            u.id === msg.sender || 
            u._id === msg.sender ||
            String(u.id) === String(msg.sender) ||
            String(u._id) === String(msg.sender)
          );
          if (user?.name) return user.name;
        }
      }
      
      return msg.sender;
    }
    return 'Unknown User';
  }, [currentUser, userName, directUsers]);

  const [showReactionsPicker, setShowReactionsPicker] = useState(false);
  const [reactionsPosition, setReactionsPosition] = useState({ x: 0, y: 0 });
  const [selectedMessageForReactions, setSelectedMessageForReactions] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const quickReactions = [
    { emoji: '❤️', label: 'Love' },
    { emoji: '👍', label: 'Like' },
    { emoji: '😂', label: 'Haha' },
    { emoji: '😮', label: 'Wow' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' }
  ];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsScrolling(!isAtBottom);
      
      if (isAtBottom && unreadCount > 0) {
        setUnreadCount(0);
      }
    }
  }, [unreadCount]);

  useEffect(() => {
    const handleInputChange = () => {
      if (newMessage.trim() && onTypingStart) {
        onTypingStart();
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
          if (onTypingStop) {
            onTypingStop();
          }
        }, 3000);
      }
    };

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('input', handleInputChange);
      return () => {
        inputElement.removeEventListener('input', handleInputChange);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [newMessage, onTypingStart, onTypingStop]);

  const renderTypingIndicator = useCallback(() => {
    if (!typingUsers || typingUsers.length === 0) return null;
    
    const typingNames = typingUsers.map(u => u.userName || u.name).join(', ');
    const isMultiple = typingUsers.length > 1;
    
    return (
      <div className="flex items-center gap-2 px-6 py-3 animate-fadeIn">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce delay-200"></div>
        </div>
        <span className="text-sm text-gray-500 font-medium">
          {isMultiple ? `${typingNames} are typing...` : `${typingNames} is typing...`}
        </span>
      </div>
    );
  }, [typingUsers]);

  useEffect(() => {
    if (inputRef.current && !isEditMode) {
      inputRef.current.focus();
    }
  }, [isEditMode, replyingTo]);
// ChatMessages.jsx - Update handleSend function
const handleSend = useCallback((e) => {
  e?.preventDefault();
  
  if (!isConnected) {
    addNotification('Not connected to server. Please wait...', 'error');
    return;
  }
  
  // **LOG: Check what we're trying to send**
  console.log('🔄 handleSend called with:', {
    hasAttachedFiles: attachedFiles.length > 0,
    hasRecordedAudio: !!recordedAudio,
    hasNewMessage: !!newMessage.trim()
  });
  
  if (attachedFiles.length > 0) {
    // **ONLY** handle file uploads
    console.log('📁 Calling uploadFiles (files only)');
    uploadFiles();
  } else if (recordedAudio) {
    // **ONLY** handle voice message
    console.log('🎤 Calling sendVoiceMessage (voice only)');
    sendVoiceMessage();
  } else if (newMessage.trim()) {
    // Handle regular text message
    console.log('📝 Sending regular text message');
    const messageData = {
      text: newMessage.trim(),
      replyTo: replyingTo ? {
        id: replyingTo.id || replyingTo._id,
        sender: getSenderDisplayName(replyingTo),
        text: replyingTo.text
      } : null
    };
    
    onSendMessage(messageData);
    setNewMessage('');
    setEmojiPickerVisible(false);
  }
}, [isConnected, addNotification, onSendMessage, newMessage, attachedFiles, uploadFiles, recordedAudio, sendVoiceMessage, replyingTo, getSenderDisplayName]);
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }, [handleSend]);

  const handleCopyText = useCallback((text) => {
    navigator.clipboard.writeText(text);
    addNotification('Message copied to clipboard', 'success');
  }, [addNotification]);
const handleFileDownload = async (file) => {
  try {
    // Try direct download first
    const fileUrl = file.url?.startsWith('http') ? file.url : `http://localhost:5000${file.url}`;
    const downloadUrl = file.downloadUrl || `http://localhost:5000/api/upload/download/${file.filename || file.name}?category=${file.type}s`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification(`Downloading ${file.name}...`, 'info');
  } catch (error) {
    console.error('Download error:', error);
    addNotification(`Failed to download ${file.name}`, 'error');
  }
};
  const openMessageActions = useCallback((e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    setActionModal({ 
      isOpen: true, 
      message: msg, 
      position: { x: e.clientX, y: e.clientY } 
    });
  }, []);

  const openReactionPicker = useCallback((e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMessageForReactions(msg);
    setReactionsPosition({ x: e.clientX, y: e.clientY });
    setShowReactionsPicker(true);
  }, []);

  // SINGLE REFRESH FUNCTION - Combined
  const handleRefresh = useCallback(() => {
    console.log('🔄 Refreshing chat...');
    
    // Refresh channels list if function exists
    if (onRefreshChannels) {
      onRefreshChannels();
    }
    
    // Refresh current channel if function exists
    if (onRefreshCurrentChannel) {
      onRefreshCurrentChannel();
    }
    
    addNotification('Refreshing chat...', 'info');
  }, [onRefreshChannels, onRefreshCurrentChannel, addNotification]);

  const handleReactionClick = useCallback((reaction) => {
    if (selectedMessageForReactions && onReaction) {
      console.log('🎯 Sending reaction:', reaction.emoji, 'to message:', selectedMessageForReactions.id);
      onReaction(selectedMessageForReactions, { x: reactionsPosition.x, y: reactionsPosition.y });
    }
    setShowReactionsPicker(false);
    setSelectedMessageForReactions(null);
  }, [selectedMessageForReactions, onReaction, reactionsPosition]);

  const handleQuickReaction = useCallback((msg, emoji) => {
    if (onReaction && msg) {
      console.log('🎯 Quick reaction:', emoji, 'to message:', msg.id);
      onReaction(msg, { x: 0, y: 0 });
      
      if (socket?.emit && channelInfo?._id && msg.id) {
        socket.emit('send_reaction', { 
          channelId: channelInfo._id, 
          messageId: msg.id, 
          emoji 
        });
      }
    }
  }, [onReaction, socket, channelInfo]);

  const addEmojiToMessage = useCallback((emoji) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current.focus();
  }, []);

  const renderReadReceipts = useCallback((msg) => {
    const isMe = msg.senderId === currentUser || msg.sender === currentUser;
    
    if (!isMe) return null;
    
    const readCount = msg.readBy?.length || 0;
    const totalMembers = msg.totalMembers || 1;
    const isReadByAll = msg.isReadByAll || false;

    if (readCount === 0) {
      return <Check size={12} className="text-gray-400" />;
    } else if (isReadByAll) {
      return (
        <div className="flex items-center gap-1">
          <CheckCheck size={12} className="text-blue-500" />
          <span className="text-[10px] text-blue-500">Seen</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1">
          <CheckCheck size={12} className="text-gray-400" />
          <span className="text-[10px] text-gray-500">
            {readCount}/{totalMembers}
          </span>
        </div>
      );
    }
  }, [currentUser]);

  const formatTime = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const formatMessageTime = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const formatAudioTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Update renderMessageContent function to properly handle voice messages
  const renderMessageContent = useCallback((msg) => {
// Replace the audio rendering section with this:
if (msg.audioUrl || msg.isVoiceMessage) {
  // Check if marked as unavailable
  if (msg.audioUnavailable) {
    return (
      <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 rounded-xl border border-gray-300">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center">
            <VolumeX size={20} className="text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-600">Voice Message</div>
            <div className="text-sm text-gray-500">Audio unavailable</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleAudioPlayback(msg.audioUrl, msg.id || msg._id)}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center hover:opacity-90"
          >
            {playingAudio === msg.audioUrl ? (
              <Pause size={20} className="text-white" />
            ) : (
              <Play size={20} className="text-white" />
            )}
          </button>
          <div>
            <div className="font-medium text-gray-800">Voice Message</div>
            <div className="text-sm text-gray-500">
              {formatAudioTime(msg.audioDuration || 0)} • {formatFileSize(msg.audioSize || 0)}
            </div>
          </div>
        </div>
      </div>
      
      {playingAudio === msg.audioUrl && (
        <div className="mt-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              style={{ width: `${audioProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
// In renderMessageContent function, update the file rendering part
if (msg.files && msg.files.length > 0) {
  return (
    <div className="space-y-3">
      {msg.text && msg.text !== '📎 File:' && (
        <div className="text-gray-800 mb-3">
          {msg.text}
        </div>
      )}
      
      <div className="space-y-2">
        {msg.files.map((file, index) => {
          const fileUrl = file.url?.startsWith('http') ? file.url : `http://localhost:5000${file.url}`;
          const previewUrl = file.previewUrl || `http://localhost:5000/api/upload/preview/${file.filename || file.name}?category=${file.type}s`;
          
          return (
            <div 
              key={index} 
              className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 p-4 rounded-xl border border-blue-200/50 hover:border-blue-300 transition-colors group cursor-pointer"
              onClick={() => {
                setFilePreviewModal({
                  isOpen: true,
                  files: msg.files,
                  currentIndex: index
                });
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    {getFileIcon(file.type, file.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate" title={file.name}>
                      {file.name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{file.type.charAt(0).toUpperCase() + file.type.slice(1)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (file.type === 'image') {
                        window.open(previewUrl, '_blank');
                      } else {
                        setFilePreviewModal({
                          isOpen: true,
                          files: msg.files,
                          currentIndex: index
                        });
                      }
                    }}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title={file.type === 'image' ? "View" : "Preview"}
                  >
                    <Eye size={16} className="text-blue-500" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileDownload(file);
                    }}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download size={16} className="text-blue-500" />
                  </button>
                </div>
              </div>
              
              {/* Image thumbnail preview */}
              {file.type === 'image' && fileUrl && (
                <div className="mt-3">
                  <img
                    src={fileUrl}
                    alt={file.name}
                    className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
    if (msg.replyTo) {
      const replyToName = msg.replyTo.senderName || getSenderDisplayName(msg.replyTo);
      return (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 p-3 rounded-xl border-l-3 border-blue-500">
            <div className="flex items-center gap-2 mb-1">
              <Reply size={12} className="text-blue-500" />
              <p className="text-xs font-semibold text-blue-600">
                Replying to {replyToName}
              </p>
            </div>
            <p className="text-sm text-gray-700 line-clamp-2">
              {msg.replyTo.text}
            </p>
          </div>
          <div className="text-gray-800">
            {msg.text}
          </div>
        </div>
      );
    }

    if (msg.forwardedFrom) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50/50 px-3 py-1.5 rounded-full w-fit">
            <Forward size={12} />
            <span>Forwarded from {msg.forwardedFrom}</span>
          </div>
          <div className="text-gray-800">
            {msg.text}
          </div>
        </div>
      );
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const hasLinks = msg.text && urlRegex.test(msg.text);

    if (hasLinks) {
      const parts = msg.text.split(urlRegex);
      return (
        <div className="text-gray-800 space-y-2">
          {parts.map((part, index) => {
            if (urlRegex.test(part)) {
              return (
                <a
                  key={index}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 underline break-all"
                >
                  {part}
                </a>
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </div>
      );
    }

    return <div className="text-gray-800 whitespace-pre-wrap break-words">{msg.text}</div>;
  }, [getSenderDisplayName, playingAudio, audioProgress, audioDuration, toggleAudioPlayback, formatFileSize, formatAudioTime, addNotification, getFileIcon]);

  const popularEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
    '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
    '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
    '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
    '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
    '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
    '😹', '😻', '😼', '😽', '🙀', '😿', '😾'
  ];

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <div className="px-8 py-5 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {isDMChannel ? '👤' : '#'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                <span className="text-white text-[10px]">✕</span>
              </div>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-xl">
                {resolvedChatName}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                  ● Disconnected
                </span>
                <button
                  onClick={onReconnect}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 hover:underline"
                >
                  Click to reconnect
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center mx-auto shadow-xl">
                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-full blur-xl"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Disconnected from Server</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              You are currently offline. Messages may not send until you reconnect to the chat server.
            </p>
            <button
              onClick={onReconnect}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Reconnect Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50/50 to-white">
      {/* Hidden audio element for playback */}
      <audio ref={audioRef} className="hidden" crossOrigin="anonymous" />
      
      {/* Modern Header - FIXED: Single Refresh Button */}
      <div className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow">
              <span className="text-white font-bold">
                {isDMChannel ? '👤' : '#'}
              </span>
            </div>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-xl">
              {resolvedChatName}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                socketStatus === 'connected' ? 'bg-emerald-100 text-emerald-700' : 
                socketStatus === 'reconnecting' ? 'bg-amber-100 text-amber-700' : 
                'bg-red-100 text-red-700'
              }`}>
                {socketStatus === 'connected' ? '● Online' : 
                 socketStatus === 'reconnecting' ? '● Reconnecting...' : 
                 '● Offline'}
              </span>
              <span className="text-sm text-gray-500 font-medium">
                {localMessages.length} messages
              </span>
              {isDMChannel && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Users size={14} />
                  <span>Direct Message</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isDMChannel && (userRole === 'team_lead' || userRole === 'admin') && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
              title="Invite users to this channel"
            >
              <UserPlus size={20} className="text-gray-600 group-hover:text-purple-600 transition-colors" />
            </button>
          )}
          
          {/* Delete Channel Button for Admins/Team Leads */}
          {!isDMChannel && channelInfo._id !== 'general' && (userRole === 'team_lead' || userRole === 'admin') && (
            <button
              onClick={handleDeleteChannel}
              className="p-2 hover:bg-red-50 rounded-xl transition-colors text-gray-600 hover:text-red-600"
              title="Delete channel"
            >
              <Trash2 size={18} />
            </button>
          )}
          
          {isDMChannel && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearChatHistory}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 hover:text-red-600"
                title="Clear chat history"
              >
                <Trash2 size={18} />
              </button>
              
              <button
                onClick={handleDeleteConversation}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 hover:text-red-600"
                title="Delete conversation"
              >
                <X size={18} />
              </button>
            </div>
          )}
          {/* File Preview Modal */}
<FilePreviewModal
  isOpen={filePreviewModal.isOpen}
  onClose={() => setFilePreviewModal({ isOpen: false, files: [], currentIndex: 0 })}
  files={filePreviewModal.files}
  initialIndex={filePreviewModal.currentIndex}
/>
          {/* SINGLE Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
            title="Refresh chat"
          >
            <RefreshCw size={20} className="text-gray-600 group-hover:text-purple-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => !confirmationModal.isLoading && setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        isLoading={confirmationModal.isLoading}
        confirmText={confirmationModal.type === 'danger' ? 'Delete' : 'Confirm'}
      />
      
      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          channelName={resolvedChatName}
          onInvite={(email, userName) => {
            if (socket?.emit && channelInfo && channelInfo._id) {
              console.log('📧 Sending invite for channel:', channelInfo._id);
              socket.emit('invite_user_to_channel', {
                channelId: channelInfo._id,
                userEmail: email,
                userName: userName
              });
            } else {
              addNotification('Cannot invite user: Channel ID not found', 'error');
            }
          }}
          usersList={usersList}
        />
      )}

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent to-gray-50/30"
        onScroll={handleScroll}
      >
        <div className="p-6 space-y-6">
          {/* Welcome message */}
          {localMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="relative mb-8">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shadow-2xl">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                    <MessageSquare className="w-12 h-12 text-purple-400" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-2xl"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {isDMChannel ? `Start a conversation with ${resolvedChatName}` : 'Welcome to the chat!'}
              </h3>
              <p className="text-gray-600 max-w-md mb-8">
                {isDMChannel 
                  ? 'Send your first message to start chatting.' 
                  : 'Start the conversation by sending your first message. This is a safe space for team collaboration.'}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCheck size={16} className="text-emerald-500" />
                  <span>End-to-end encrypted</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={16} className="text-blue-500" />
                  <span>Messages sync across devices</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <EyeOff size={16} className="text-purple-500" />
                  <span>Private and secure</span>
                </div>
              </div>
            </div>
          )}

          {/* Messages list */}
          {localMessages.length > 0 && localMessages.map((msg, index) => {
            const isMe = msg.senderId === currentUser || msg.sender === currentUser;
            const messageKey = `${msg.id || msg._id}-${msg.deleted ? 'deleted' : 'active'}`;
            const isConsecutive = index > 0 && 
              localMessages[index - 1].senderId === msg.senderId &&
              new Date(msg.createdAt) - new Date(localMessages[index - 1].createdAt) < 5 * 60 * 1000;
            const showSender = !isConsecutive;
            const senderDisplayName = getSenderDisplayName(msg);
            
            return (
              <div
                key={messageKey}
                data-message-id={msg.id || msg._id}
                className={`group relative transition-all duration-300 hover:translate-x-1 ${
                  isMe ? 'text-right' : 'text-left'
                }`}
                onMouseEnter={() => setHoveredMessage(msg.id || msg._id)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
                <div className={`relative inline-block max-w-[85%] lg:max-w-[75%] ${
                  isMe ? 'ml-auto' : ''
                }`}>
                  {showSender && !isMe && (
                    <div className="flex items-center gap-2 mb-2 ml-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shadow">
                        {senderDisplayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-700">
                          {senderDisplayName}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <div
                      className={`relative rounded-2xl p-4 transition-all duration-300 ${
                        isMe 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-br-md shadow-lg' 
                          : 'bg-white text-gray-800 border border-gray-200/50 rounded-bl-md shadow-sm hover:shadow-md'
                      } ${
                        hoveredMessage === (msg.id || msg._id) ? 'scale-[1.02] shadow-xl' : ''
                      }`}
                    >
                      {msg.replyTo && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-l-2xl"></div>
                      )}

                      <div className="relative z-10">
                        {renderMessageContent(msg)}
                      </div>

                      <div className={`flex items-center justify-between mt-3 pt-3 ${
                        isMe ? 'border-t-white/20' : 'border-t-gray-100'
                      }`}>
                        <div className="flex items-center gap-2">
                          {msg.edited && (
                            <span className={`text-xs ${isMe ? 'text-white/80' : 'text-gray-400'} italic`}>
                              edited
                            </span>
                          )}
                          {msg.pinned && (
                            <Pin size={12} className={isMe ? 'text-white/80' : 'text-gray-400'} />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isMe && renderReadReceipts(msg)}
                          <span className={`text-xs ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
                            {formatMessageTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className={`mt-2 ${isMe ? 'text-right' : 'text-left'}`}>
                        <ReactionsDisplay 
                          reactions={msg.reactions}
                          onReactionClick={() => console.log('Show reaction details')}
                        />
                      </div>
                    )}

                    {hoveredMessage === (msg.id || msg._id) && (
                      <div className={`absolute flex gap-1 p-2 bg-white rounded-xl shadow-2xl border border-gray-200 ${
                        isMe ? 'left-0 -translate-x-full -translate-y-1/2' : 'right-0 translate-x-full -translate-y-1/2'
                      } top-1/2 z-20 animate-in slide-in-from-right-2`}>
                        {quickReactions.slice(0, 3).map((reaction) => (
                          <button
                            key={reaction.label}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickReaction(msg, reaction.emoji);
                            }}
                            className="p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:scale-110"
                            title={reaction.label}
                          >
                            <span className="text-lg">{reaction.emoji}</span>
                          </button>
                        ))}
                        <button
                          onClick={(e) => openReactionPicker(e, msg)}
                          className="p-2 hover:bg-gray-50 rounded-lg transition-all duration-200"
                          title="More reactions"
                        >
                          <Smile size={18} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => onReplyMessage && onReplyMessage(msg)}
                          className="p-2 hover:bg-gray-50 rounded-lg transition-all duration-200"
                          title="Reply"
                        >
                          <Reply size={18} className="text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => openMessageActions(e, msg)}
                          className="p-2 hover:bg-gray-30 rounded-lg transition-all duration-200"
                          title="More actions"
                        >
                          <MoreVertical size={18} className="text-gray-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {renderTypingIndicator()}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {isScrolling && unreadCount > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 z-10"
        >
          <ChevronDown size={20} />
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        </button>
      )}

      {emojiPickerVisible && (
        <div className="absolute bottom-24 left-6 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-80 max-h-64 overflow-y-auto z-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Emojis</h3>
            <button
              onClick={() => setEmojiPickerVisible(false)}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {popularEmojis.slice(0, 64).map((emoji, index) => (
              <button
                key={index}
                onClick={() => addEmojiToMessage(emoji)}
                className="p-2 hover:bg-gray-100 rounded-lg text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Click an emoji to add it to your message
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200/50">
        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <div className="mb-3 bg-gradient-to-r from-blue-50/80 to-purple-50/80 p-4 rounded-2xl border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Paperclip size={16} className="text-blue-500" />
                <span className="text-sm font-bold text-blue-700">
                  {attachedFiles.length} file(s) attached
                </span>
              </div>
              <button
                onClick={() => setAttachedFiles([])}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-white/50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    {file.type === 'image' && file.preview ? (
                      <img 
                        src={file.preview} 
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                        {file.type === 'image' ? (
                          <Image size={20} className="text-blue-500" />
                        ) : file.type === 'video' ? (
                          <Video size={20} className="text-purple-500" />
                        ) : file.type === 'audio' ? (
                          <Volume2 size={20} className="text-green-500" />
                        ) : (
                          <File size={20} className="text-gray-500" />
                        )}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-500"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              ))}
            </div>
            {isUploading && (
              <div className="mt-3">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1 text-center">
                  Uploading... {uploadProgress}%
                </div>
              </div>
            )}
          </div>
        )}

        {/* Voice Message Preview */}
        {recordedAudio && (
          <div className="mb-3 bg-gradient-to-r from-green-50/80 to-emerald-50/80 p-4 rounded-2xl border border-green-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mic size={16} className="text-green-500" />
                <span className="text-sm font-bold text-green-700">
                  Voice message ({recordingTime}s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={sendVoiceMessage}
                  className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                >
                  Send
                </button>
                <button
                  onClick={cancelRecording}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const audio = new Audio(recordedAudio.url);
                  audio.play();
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Play size={16} className="text-white" />
              </button>
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatAudioTime(recordingTime)}
                </div>
              </div>
            </div>
          </div>
        )}

        {replyingTo && (
          <div className="mb-3 bg-gradient-to-r from-blue-50/80 to-purple-50/80 p-4 rounded-2xl border-l-4 border-blue-500 shadow-sm animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Reply size={14} className="text-blue-500" />
                <span className="text-sm font-bold text-blue-700">
                  Replying to {getSenderDisplayName(replyingTo)}
                </span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-700 line-clamp-2 pl-6">
              {replyingTo.text}
            </p>
          </div>
        )}

        {isEditMode ? (
          <div className="mb-3 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 p-4 rounded-2xl border border-yellow-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Edit2 size={16} className="text-yellow-600" />
              <span className="text-sm font-bold text-yellow-700">
                Editing message
              </span>
            </div>
            <div className="flex gap-3">
              <textarea
                className="flex-1 bg-white/50 outline-none p-3 border border-yellow-300 rounded-xl resize-none shadow-inner focus:ring-2 focus:ring-yellow-500/20"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onEditMessage(editingMessage.id || editingMessage._id, editText)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-lg transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Check size={18} />
                  <span className="text-sm font-medium">Save</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setEditingMessage(null);
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <X size={18} />
                  <span className="text-sm font-medium">Cancel</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-3">
            <div className="flex items-center gap-2 px-2">
              {/* File Upload Button */}
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
              >
                <Paperclip size={20} className="text-gray-500 group-hover:text-purple-500 transition-colors" />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleFileSelect}
                />
              </button>
              
              {/* Image Upload Button */}
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
                onClick={() => imageInputRef.current?.click()}
                title="Add image"
              >
                <Image size={20} className="text-gray-500 group-hover:text-purple-500 transition-colors" />
                <input
                  type="file"
                  ref={imageInputRef}
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </button>
              
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
                onClick={() => setEmojiPickerVisible(!emojiPickerVisible)}
              >
                <Smile size={20} className={`${emojiPickerVisible ? 'text-yellow-500' : 'text-gray-500'} group-hover:text-yellow-500 transition-colors`} />
              </button>
              
              {/* Voice Recording Button */}
              <button
                type="button"
                className={`p-2 rounded-xl transition-colors ${
                  isRecording 
                    ? 'bg-red-100 text-red-500 animate-pulse' 
                    : recordedAudio
                    ? 'bg-green-100 text-green-500'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-purple-500'
                }`}
                title="Voice message"
                onClick={() => {
                  if (isRecording) {
                    stopRecording();
                  } else if (recordedAudio) {
                    sendVoiceMessage();
                  } else {
                    startRecording();
                  }
                }}
              >
                {isRecording ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    <Mic size={20} />
                  </div>
                ) : recordedAudio ? (
                  <Mic size={20} />
                ) : (
                  <Mic size={20} />
                )}
              </button>
              
              {/* Cancel Recording Button */}
              {(isRecording || recordedAudio) && (
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-red-500"
                  onClick={cancelRecording}
                  title="Cancel"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="flex items-end gap-3 bg-gray-100/50 p-3 rounded-2xl border border-gray-300/50 hover:border-purple-300/50 transition-all duration-300 focus-within:bg-white focus-within:border-purple-500/30 focus-within:shadow-lg">
              <textarea
                ref={inputRef}
                className="flex-1 bg-transparent outline-none px-2 py-2 resize-none max-h-40 text-gray-800 placeholder-gray-500 text-base"
                placeholder={`Message ${resolvedChatName}`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={1}
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && attachedFiles.length === 0 && !recordedAudio) || !isConnected}
                  className={`p-3 rounded-xl transition-all duration-300 shadow-lg ${
                    (newMessage.trim() || attachedFiles.length > 0 || recordedAudio) && isConnected
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-xl transform hover:-translate-y-0.5'
                      : 'bg-gray-300 text-gray-400 cursor-not-allowed'
                  }`}
                  title={!isConnected ? "Not connected to server" : "Send message"}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center px-3">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Press Enter to send • Shift+Enter for new line</span>
              </div>
              <div className={`text-xs font-medium ${
                newMessage.length > 1800 
                  ? 'text-red-500' 
                  : newMessage.length > 1500 
                  ? 'text-amber-500' 
                  : 'text-gray-400'
              }`}>
                {newMessage.length}/2000
              </div>
            </div>
          </form>
        )}
      </div>

      {showReactionsPicker && (
        <div 
          className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3"
          style={{
            left: `${reactionsPosition.x}px`,
            top: `${reactionsPosition.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="flex gap-2">
            {quickReactions.map((reaction) => (
              <button
                key={reaction.label}
                onClick={() => handleReactionClick(reaction)}
                className="p-3 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:scale-125"
                title={reaction.label}
              >
                <span className="text-2xl">{reaction.emoji}</span>
              </button>
            ))}
          </div>
          <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45"></div>
        </div>
      )}

      <MessageActionsModal
        isOpen={actionModal.isOpen}
        message={actionModal.message}
        position={actionModal.position}
        isCurrentUser={actionModal.message?.senderId === currentUser || actionModal.message?.sender === currentUser}
        onClose={() => setActionModal({ ...actionModal, isOpen: false })}
        onCopy={(msg) => {
          handleCopyText(msg.text);
          setActionModal({ ...actionModal, isOpen: false });
        }}
        onReply={(msg) => {
          onReplyMessage(msg);
          setActionModal({ ...actionModal, isOpen: false });
        }}
        onForward={(msg) => {
          onForwardMessage(msg);
          setActionModal({ ...actionModal, isOpen: false });
        }}
        onEdit={(msg) => {
          setEditingMessage(msg);
          setEditText(msg.text);
          setIsEditMode(true);
          setActionModal({ ...actionModal, isOpen: false });
        }}
        onDeleteForEveryone={(msg) => {
          handleDeleteMessage(msg.id || msg._id, true);
          setActionModal({ ...actionModal, isOpen: false });
        }}
        onDeleteForMe={(msg) => {
          handleDeleteMessage(msg.id || msg._id, false);
          setActionModal({ ...actionModal, isOpen: false });
        }}
        onReaction={(msg) => {
          setActionModal({ ...actionModal, isOpen: false });
          setTimeout(() => {
            const rect = document.querySelector(`[data-message-id="${msg.id || msg._id}"]`)?.getBoundingClientRect();
            if (rect) {
              setSelectedMessageForReactions(msg);
              setReactionsPosition({ x: rect.right - 100, y: rect.top - 50 });
              setShowReactionsPicker(true);
            }
          }, 100);
        }}
      />

      {/* Recording Timer */}
      {isRecording && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            <Mic size={20} />
            <span className="font-semibold">Recording... {recordingTime}s</span>
          </div>
          <button
            onClick={stopRecording}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium"
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatMessages;