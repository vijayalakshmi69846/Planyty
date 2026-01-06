//socket.controller.js
const { sequelize, Op } = require('../config/database');
const Message = require('../models/message.model');
const Channel = require('../models/channel.model');
const { User, Project, Task, Team, TeamMember } = require('../models');
const schedule = require('node-schedule');

module.exports = (io, socket, connectedUsers) => {
  const userId = socket.userId ? String(socket.userId) : 'anonymous';
  const userRole = socket.userRole || 'team_member';
  const teamId = socket.teamId ? String(socket.teamId) : null;
  const userName = socket.userName || 'User';
  console.log(`🔧 Socket controller initialized for: ${userName} (${userId})`);
// socket.controller.js - UPDATED send_message handler
// Add this function at the top
const sendMessageWithAudio = async (data) => {
  console.log('🎤 Sending message with audio:', {
    channelId: data.channelId,
    hasAudio: !!data.message.audioUrl
  });
  
  try {
    let messageText = data.message.text;
    let audioUrl = null;
    let audioSize = null;
    let audioDuration = null;
    let files = [];

    // Handle voice message
    if (data.message.audioUrl) {
      messageText = data.message.text || `🎤 Voice message (${data.message.audioDuration || 0}s)`;
      audioUrl = data.message.audioUrl;
      audioSize = data.message.audioSize;
      audioDuration = data.message.audioDuration;
      files = data.message.files || [];
      
      console.log('🎵 Audio data:', {
        audioUrl: audioUrl,
        duration: audioDuration,
        size: audioSize
      });
    }

    // Create and save message
    const newMessage = new Message({
      chatId: data.channelId,
      senderId: userId,
      senderName: userName,
      text: messageText,
      audioUrl: audioUrl,
      audioSize: audioSize,
      audioDuration: audioDuration,
      files: files,
      readBy: [{ userId, userName, readAt: new Date() }],
      reactions: [],
      edited: false,
      replyTo: data.message.replyTo || null,
      createdAt: new Date()
    });

    const savedMsg = await newMessage.save();
    
    console.log('💾 Message saved:', {
      id: savedMsg._id,
      hasAudio: !!savedMsg.audioUrl,
      audioUrl: savedMsg.audioUrl
    });

    // Get channel info
    let channel;
    if (data.channelId === 'general') {
      channel = { 
        _id: 'general', 
        name: 'general', 
        type: 'public' 
      };
    } else {
      channel = await Channel.findOne({
        $or: [{ _id: data.channelId }, { name: data.channelId }]
      });
      if (!channel) {
        channel = { _id: data.channelId, name: data.channelId, type: 'public' };
      }
    }

    const totalMembers = await getChannelMembersCount(channel);

    // Prepare message for broadcast
    const messageToSend = {
      ...savedMsg.toObject(),
      id: savedMsg._id,
      _id: savedMsg._id,
      isReadByAll: false,
      readCount: 1,
      totalMembers,
      senderName: userName,
      audioUrl: audioUrl,
      audioSize: audioSize,
      audioDuration: audioDuration,
      files: files
    };

    console.log('📤 Broadcasting message...');
    
    // Broadcast to all users in channel
    io.to(data.channelId).emit('receive_message', { 
      channelId: data.channelId, 
      message: messageToSend
    });

    console.log('✅ Message sent successfully');

  } catch (err) {
    console.error('❌ Message save error:', err);
    throw err;
  }
};

// // Update the send_message handler
// socket.on('send_message', async (data) => {
//   try {
//     await sendMessageWithAudio(data);
//   } catch (err) {
//     console.error('❌ Send message error:', err.message);
//     socket.emit('error', { message: 'Failed to send message: ' + err.message });
//   }
// });
  // Helper function to get user info
  const getUserInfo = async (userId) => {
    try {
      if (connectedUsers.has(userId)) {
        return connectedUsers.get(userId);
      }
      
      const user = await User.findOne({
        where: { id: parseInt(userId) },
        attributes: ['id', 'name', 'email', 'role']
      });
      
      if (user) {
        const userInfo = {
          userId: String(user.id),
          userName: user.name,
          userRole: user.role,
          email: user.email,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
        };
        
        connectedUsers.set(userId, userInfo);
        return userInfo;
      }
      
      return {
        userId,
        userName: 'Unknown User',
        userRole: 'member',
        email: null,
        avatar: `https://ui-avatars.com/api/?name=Unknown&background=random`
      };
    } catch (error) {
      console.error('Error getting user info:', error.message);
      return {
        userId,
        userName: 'Unknown User',
        userRole: 'member',
        email: null,
        avatar: `https://ui-avatars.com/api/?name=Unknown&background=random`
      };
    }
  };

  // Get direct message users
  const getDirectMessageUsers = async () => {
    try {
      console.log(`🔍 Getting direct message users for ${userName} (${userId})`);
      
      const allUsers = await User.findAll({
        where: { 
          is_active: true,
          id: { [Op.ne]: parseInt(userId) }
        },
        attributes: ['id', 'name', 'email', 'role'],
        order: [['name', 'ASC']]
      });
      
      const existingDMChannels = await Channel.find({
        members: userId,
        $or: [
          { type: 'private' },
          { isDirectMessage: true },
          { name: { $regex: '^dm-' } }
        ]
      });
      
      const usersWithExistingDMs = new Set();
      existingDMChannels.forEach(channel => {
        if (channel.members) {
          channel.members.forEach(memberId => {
            if (memberId !== userId) {
              usersWithExistingDMs.add(memberId);
            }
          });
        }
      });
      
      const formattedUsers = allUsers.map((user) => {
        const userIdStr = String(user.id);
        const hasExistingDM = usersWithExistingDMs.has(userIdStr);
        
        let existingChannelId = null;
        if (hasExistingDM) {
          const existingChannel = existingDMChannels.find(channel => 
            channel.members && 
            channel.members.includes(userIdStr) && 
            channel.members.includes(userId)
          );
          existingChannelId = existingChannel?._id || null;
        }
        
        return {
          id: userIdStr,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
          hasExistingDM,
          existingChannelId,
          isOnline: false
        };
      });
      
      console.log(`📊 Found ${formattedUsers.length} users for direct messages`);
      return formattedUsers;
      
    } catch (error) {
      console.error('❌ Error getting direct message users:', error);
      return [];
    }
  };

  // Get all team channels accessible to the user
  const getTeamChannelsForUser = async () => {
    try {
      let accessibleChannels = [];
      
      const user = await User.findOne({
        where: { id: parseInt(userId) },
        include: [{
          model: Team,
          as: 'teams',
          attributes: ['id', 'name', 'workspace_id']
        }]
      });

      if (!user) {
        console.log(`❌ User ${userId} not found`);
        return [];
      }

      const userTeamIds = user.teams ? user.teams.map(team => String(team.id)) : [];
      
      if (teamId && !userTeamIds.includes(teamId)) {
        userTeamIds.push(teamId);
      }

      const teamChannels = await Channel.find({
        type: 'team',
        $or: [
          { teamId: { $in: userTeamIds } },
          { members: userId }
        ]
      });

      for (const channel of teamChannels) {
        try {
          let enhancedChannel = channel.toObject ? channel.toObject() : channel;
          
          if (channel.teamId) {
            const team = await Team.findOne({
              where: { id: parseInt(channel.teamId) },
              attributes: ['id', 'name', 'workspace_id']
            });

            if (team) {
              enhancedChannel.teamInfo = {
                id: team.id,
                name: team.name,
                workspaceId: team.workspace_id
              };
            }
          }

          accessibleChannels.push(enhancedChannel);
        } catch (error) {
          console.error(`❌ Error enhancing channel ${channel.name}:`, error.message);
          accessibleChannels.push(channel);
        }
      }

      return accessibleChannels;
    } catch (error) {
      console.error('❌ Error getting team channels:', error.message);
      return [];
    }
  };

  // Helper functions for channel access and members
  const canAccessChannel = (channel, userId, userRole, teamId) => {
    if (channel._id === 'general') return true;
    if (channel.type === 'public') return true;
    if (channel.type === 'team') {
      if (channel.members && channel.members.includes(userId)) return true;
      if (channel.teamId && channel.teamId === teamId) return true;
      if (userRole === 'admin') return true;
      return false;
    }
    if (channel.type === 'private' && channel.members && channel.members.includes(userId)) return true;
    if (userRole === 'admin') return true;
    return false;
  };

  const getChannelMembersCount = async (channel) => {
    if (!channel) return 1;
    
    if (channel._id === 'general') {
      const room = io.sockets.adapter.rooms.get('general');
      return room ? room.size : 1;
    }
    
    if (channel.type === 'public') {
      const room = io.sockets.adapter.rooms.get(channel._id);
      return room ? room.size : 1;
    }
    
    if (channel.type === 'team' && channel.teamId) {
      return 5;
    }
    
    if (channel.type === 'private' && channel.members) {
      return channel.members.length;
    }
    
    return 1;
  };

  const checkIfReadByAll = (message, totalMembers) => {
    if (!message.readBy) return false;
    return message.readBy.length >= totalMembers;
  };

  // 1. GET CHANNELS
  socket.on('get_channels', async () => {
    console.log(`📡 ${userName} requested channels list`);
    try {
      let channels = [];
      
      channels.push({
        _id: 'general',
        name: 'general',
        displayName: 'General',
        type: 'public',
        description: 'Company-wide announcements',
        isGeneral: true
      });

      // Get public channels
      const publicChannels = await Channel.find({ 
        type: 'public',
        name: { $ne: 'general' }
      });

      // Get team channels
      const teamChannels = await getTeamChannelsForUser();

      // Get ALL channels where user is a member
      const userChannels = await Channel.find({
        members: userId
      });
      
      // Enhance channels with DM flags
      const enhancedChannels = userChannels.map((channel) => {
        const channelObj = channel.toObject ? channel.toObject() : channel;
        
        const isDMName = channelObj.name && channelObj.name.startsWith('dm-');
        const hasTwoMembers = channelObj.members && channelObj.members.length === 2;
        
        if ((isDMName && hasTwoMembers) || channelObj.type === 'direct' || channelObj.isDirectMessage) {
          console.log(`🎯 Identified as DM channel: ${channelObj.name}`);
          channelObj.isDirectMessage = true;
          
          if (channelObj.members && channelObj.members.length > 0) {
            channelObj.directMessageUsers = [];
            
            for (const memberId of channelObj.members) {
              if (memberId !== userId) {
                const userNameFromChannel = channelObj.displayName || 'User';
                channelObj.directMessageUsers.push({
                  userId: memberId,
                  userName: userNameFromChannel,
                  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userNameFromChannel)}&background=random`
                });
              }
            }
          }
          
          if (channelObj.displayName && channelObj.displayName.startsWith('dm-')) {
            if (channelObj.directMessageUsers && channelObj.directMessageUsers.length > 0) {
              channelObj.displayName = channelObj.directMessageUsers[0].userName;
            }
          }
        }
        
        return channelObj;
      });

      // Combine all channels
      const allChannels = [...channels, ...publicChannels, ...teamChannels, ...enhancedChannels];
      
      // Remove duplicates based on _id
      const uniqueChannels = [];
      const seenIds = new Set();
      
      for (const channel of allChannels) {
        const channelId = channel._id || channel.id;
        if (!seenIds.has(channelId)) {
          seenIds.add(channelId);
          uniqueChannels.push(channel);
        }
      }

      console.log(`📤 Sending ${uniqueChannels.length} unique channels to ${userName}`);
      socket.emit('channels_list', uniqueChannels);
      
    } catch (err) {
      console.error("❌ Channels Error:", err.message);
      socket.emit('error', { message: 'Failed to load channels' });
    }
  });

  // 2. CREATE CHANNEL
  socket.on('create_channel', async (data) => {
    console.log(`📡 ${userName} creating channel:`, data.name);
    try {
      if (userRole !== 'team_lead' && userRole !== 'admin') {
        console.log(`❌ ${userName} not authorized to create channels`);
        return socket.emit('error', { message: 'Only team leads and admins can create channels' });
      }

      const existingChannel = await Channel.findOne({ name: data.name });
      if (existingChannel) {
        console.log(`❌ Channel ${data.name} already exists`);
        return socket.emit('error', { message: 'Channel name already exists' });
      }

      const members = data.type === 'private' 
        ? [userId, ...(data.members || []).map(m => String(m))] 
        : [];

      const newChannel = new Channel({
        name: data.name,
        displayName: data.displayName || data.name,
        description: data.description || '',
        type: data.type,
        createdBy: userId,
        teamId: data.type === 'team' ? teamId : null,
        members: members,
        projectId: data.projectId || null
      });

      const savedChannel = await newChannel.save();
      
      const channelObj = savedChannel.toObject ? savedChannel.toObject() : savedChannel;
      
      socket.join(savedChannel._id);
      
      console.log(`📢 Broadcasting channel creation to all users: ${channelObj.name}`);
      io.emit('channel_created', channelObj);
      
      socket.emit('success', { message: `Channel #${data.name} created successfully` });
      
    } catch (err) {
      console.error("❌ Create Channel Error:", err.message);
      socket.emit('error', { message: 'Failed to create channel: ' + err.message });
    }
  });

  // 3. JOIN CHANNEL
  socket.on('join_channel', async (channelId) => {
    console.log(`📡 ${userName} joining channel: ${channelId}`);
    try {
      socket.join(channelId);
      console.log(`✅ ${userName} joined room: ${channelId}`);
      
      let channel;
      let isGeneral = false;
      
      if (channelId === 'general') {
        channel = { 
          _id: 'general', 
          name: 'general', 
          displayName: 'General',
          type: 'public',
          description: 'Company-wide announcements'
        };
        isGeneral = true;
      } else {
        channel = await Channel.findOne({
          $or: [{ _id: channelId }, { name: channelId }]
        });
        
        if (!channel) {
          console.log(`❌ Channel ${channelId} not found`);
          return socket.emit('error', { message: 'Channel not found' });
        }
      }

      let enhancedChannel = isGeneral ? channel : (channel.toObject ? channel.toObject() : channel);
      
      if (!canAccessChannel(enhancedChannel, userId, userRole, teamId)) {
        console.log(`❌ ${userName} denied access to #${enhancedChannel.displayName || enhancedChannel.name}`);
        return socket.emit('error', { 
          message: `You don't have access to #${enhancedChannel.displayName || enhancedChannel.name}` 
        });
      }

      const history = await Message.find({ 
        chatId: channelId,
        deleted: { $ne: true }
      })
        .sort({ createdAt: 1 })
        .limit(200);

      const historyWithUserNames = await Promise.all(
        history.map(async (msg) => {
          try {
            const userInfo = await getUserInfo(msg.senderId);
            return {
              ...msg.toObject(),
              _id: msg._id,
              id: msg._id,
              senderName: userInfo.userName,
              senderRole: userInfo.userRole,
              avatar: userInfo.avatar,
              text: msg.text || '',
              createdAt: msg.createdAt || new Date(),
              updatedAt: msg.updatedAt || new Date(),
              reactions: msg.reactions || [],
              readBy: msg.readBy || []
            };
          } catch (error) {
            console.error(`Error getting user info for ${msg.senderId}:`, error.message);
            return {
              ...msg.toObject(),
              _id: msg._id,
              id: msg._id,
              senderName: 'Unknown User',
              senderRole: 'member',
              avatar: `https://ui-avatars.com/api/?name=Unknown&background=random`,
              text: msg.text || '',
              createdAt: msg.createdAt || new Date(),
              updatedAt: msg.updatedAt || new Date(),
              reactions: msg.reactions || [],
              readBy: msg.readBy || []
            };
          }
        })
      );

      await Message.updateMany(
        { 
          chatId: channelId,
          senderId: { $ne: userId },
          'readBy.userId': { $ne: userId }
        },
        { $push: { readBy: { userId, userName, readAt: new Date() } } }
      );

      const totalMembers = await getChannelMembersCount(enhancedChannel);

      console.log(`📤 Sending ${historyWithUserNames.length} messages to ${userName}`);
      
      socket.emit('channel_joined', { 
        channel: enhancedChannel, 
        history: historyWithUserNames.map(msg => ({
          ...msg,
          isReadByAll: checkIfReadByAll(msg, totalMembers)
        }))
      });

      socket.to(channelId).emit('user_joined', {
        userId,
        userName,
        channelId,
        joinedAt: new Date()
      });

    } catch (err) {
      console.error("❌ Join Channel Error:", err.message);
      socket.emit('error', { message: 'Failed to join channel: ' + err.message });
    }
  });
// In socket.controller.js - Update the forward_message handler
socket.on('forward_message', async ({ targetChannelId, message, sender }) => {
  console.log(`↪️ Forwarding message to ${targetChannelId}`, {
    hasFiles: message.files?.length > 0,
    hasAudio: !!message.audioUrl
  });
  
  try {
    const userInfo = await getUserInfo(sender);
    
    // Prepare the forwarded message
    const forwardedText = `↪️ Forwarded from ${message.senderName || message.senderId}:\n${message.text || 'File/voice message'}`;
    
    // Create new message with forwarded content
    const newMessage = new Message({
      chatId: targetChannelId,
      senderId: sender,
      senderName: userInfo.userName,
      text: forwardedText,
      forwardedFrom: message.senderName || message.senderId,
      originalMessageId: message.id || message._id,
      files: message.files || [], // Include files if present
      audioUrl: message.audioUrl || null,
      audioSize: message.audioSize || null,
      audioDuration: message.audioDuration || null,
      isVoiceMessage: message.isVoiceMessage || false,
      readBy: [{ userId: sender, userName: userInfo.userName, readAt: new Date() }],
      reactions: [],
      createdAt: new Date()
    });

    const savedMsg = await newMessage.save();
    
    console.log('✅ Forwarded message saved:', {
      id: savedMsg._id,
      fileCount: savedMsg.files?.length || 0,
      hasAudio: !!savedMsg.audioUrl
    });
    
    // Get channel info
    let channel;
    if (targetChannelId === 'general') {
      channel = { 
        _id: 'general', 
        name: 'general', 
        type: 'public' 
      };
    } else {
      channel = await Channel.findOne({
        $or: [{ _id: targetChannelId }, { name: targetChannelId }]
      });
      if (!channel) {
        channel = { _id: targetChannelId, name: targetChannelId, type: 'public' };
      }
    }

    const totalMembers = await getChannelMembersCount(channel);

    // Prepare message for broadcast
    const messageToSend = {
      ...savedMsg.toObject(),
      id: savedMsg._id,
      _id: savedMsg._id,
      isReadByAll: false,
      readCount: 1,
      totalMembers,
      senderName: userInfo.userName,
      audioUrl: savedMsg.audioUrl,
      audioSize: savedMsg.audioSize,
      audioDuration: savedMsg.audioDuration,
      isVoiceMessage: savedMsg.isVoiceMessage,
      files: savedMsg.files || []
    };

    console.log('📤 Broadcasting forwarded message to channel:', targetChannelId);
    
    // Broadcast to target channel
    io.to(targetChannelId).emit('receive_message', {
      channelId: targetChannelId,
      message: messageToSend
    });
    
    console.log(`✅ Message forwarded to ${targetChannelId}`);
    
  } catch (err) {
    console.error('❌ Forward message error:', err.message);
    socket.emit('error', { message: 'Failed to forward message: ' + err.message });
  }
});
// In socket.controller.js - Fix the send_message handler
socket.on('send_message', async (data) => {
  console.log('📡 SEND_MESSAGE received:', {
    from: userName,
    channelId: data.channelId,
    hasFiles: data.message?.files?.length > 0,
    hasAudio: !!data.message?.audioUrl
  });
  
  try {
    // Validate and format files array
    let files = [];
    if (data.message?.files && Array.isArray(data.message.files)) {
      files = data.message.files.map(file => ({
        name: file.name || 'file',
        type: file.type || 'document',
        size: file.size || 0,
        url: file.url || '',
        filename: file.filename || file.name,
        mimetype: file.mimetype || 'application/octet-stream',
        path: file.path || undefined
      }));
    }

    // Get audio data if present
    const audioUrl = data.message?.audioUrl || null;
    const audioSize = data.message?.audioSize || null;
    const audioDuration = data.message?.audioDuration || null;
    const isVoiceMessage = data.message?.isVoiceMessage || false;
    
    // Determine message text
    let messageText = data.message?.text || '';
    
    // If it's a voice message but no text, add default text
    if (isVoiceMessage && !messageText) {
      messageText = `🎤 Voice message (${audioDuration || 0}s)`;
    }
    
    // If it's a file message but no text, add default text
    if (files.length > 0 && !messageText) {
      messageText = `${files.length} file(s) uploaded`;
    }

    // Create and save message
    const newMessage = new Message({
      chatId: data.channelId,
      senderId: userId,
      senderName: userName,
      text: messageText,
      audioUrl: audioUrl,
      audioSize: audioSize,
      audioDuration: audioDuration,
      isVoiceMessage: isVoiceMessage,
      files: files,
      readBy: [{ userId, userName, readAt: new Date() }],
      reactions: [],
      edited: false,
      replyTo: data.message?.replyTo || null,
      createdAt: new Date()
    });

    const savedMsg = await newMessage.save();
    
    console.log('💾 Message saved:', {
      id: savedMsg._id,
      fileCount: savedMsg.files?.length || 0,
      hasAudio: !!savedMsg.audioUrl,
      isVoiceMessage: savedMsg.isVoiceMessage
    });

    // Get channel info
    let channel;
    if (data.channelId === 'general') {
      channel = { 
        _id: 'general', 
        name: 'general', 
        type: 'public' 
      };
    } else {
      channel = await Channel.findOne({
        $or: [{ _id: data.channelId }, { name: data.channelId }]
      });
      if (!channel) {
        channel = { _id: data.channelId, name: data.channelId, type: 'public' };
      }
    }

    const totalMembers = await getChannelMembersCount(channel);

    // Prepare message for broadcast
    const messageToSend = {
      ...savedMsg.toObject(),
      id: savedMsg._id,
      _id: savedMsg._id,
      isReadByAll: false,
      readCount: 1,
      totalMembers,
      senderName: userName,
      audioUrl: savedMsg.audioUrl,
      audioSize: savedMsg.audioSize,
      audioDuration: savedMsg.audioDuration,
      isVoiceMessage: savedMsg.isVoiceMessage,
      files: savedMsg.files || []
    };

    console.log('📤 Broadcasting message to channel:', {
      channelId: data.channelId,
      messageId: savedMsg._id,
      fileCount: savedMsg.files?.length || 0
    });
    
    // Broadcast to all users in channel
    io.to(data.channelId).emit('receive_message', { 
      channelId: data.channelId, 
      message: messageToSend
    });

    console.log('✅ Message sent successfully');

  } catch (err) {
    console.error('❌ Message save error:', err.message);
    socket.emit('error', { 
      message: 'Failed to send message: ' + err.message
    });
  }
});
// socket.controller.js - ADD THIS HANDLER AFTER send_message handler
socket.on('edit_message', async ({ channelId, messageId, newText }) => {
  console.log(`✏️ ${userName} editing message ${messageId}`);
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      console.log(`❌ Message ${messageId} not found`);
      return socket.emit('error', { 
        message: 'Message not found or was deleted' 
      });
    }

    const canEdit = message.senderId === userId || userRole === 'admin';
    if (!canEdit) {
      console.log(`❌ ${userName} not authorized to edit this message`);
      return socket.emit('error', { message: 'You can only edit your own messages' });
    }

    message.text = newText;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    console.log(`✅ Message ${messageId} edited successfully`);

    io.to(channelId).emit('message_updated', {
      channelId,
      messageId,
      newText,
      editedAt: message.editedAt
    });

  } catch (err) {
    console.error("❌ Edit Message Error:", err.message);
    socket.emit('error', { message: 'Failed to edit message' });
  }
});
// In socket.controller.js - Update the delete_channel handler to allow both team_lead and admin to delete general channel
socket.on('delete_channel', async ({ channelId }) => {
  console.log(`🗑️ ${userName} deleting channel: ${channelId}`);
  try {
    // Check permissions - Only admin or team_lead can delete
    if (userRole !== 'team_lead' && userRole !== 'admin') {
      console.log(`❌ ${userName} not authorized to delete channels`);
      socket.emit('error', { 
        message: 'Only team leads and admins can delete channels',
        icon: '🚫'
      });
      return;
    }

    // Allow both team_lead and admin to delete general channel
    if (channelId === 'general') {
      console.log(`⚠️ ${userRole} ${userName} deleting general channel`);
    }

    let channel;
    if (channelId === 'general') {
      channel = {
        _id: 'general',
        name: 'general',
        displayName: 'General',
        type: 'public'
      };
    } else {
      channel = await Channel.findById(channelId);
      
      if (!channel) {
        console.log(`❌ Channel ${channelId} not found`);
        socket.emit('error', { 
          message: 'Channel not found',
          icon: '🔍'
        });
        return;
      }
    }

    // Additional check for team channels
    if (channel.type === 'team' && channel.teamId) {
      console.log(`🔍 Checking team lead status for team ${channel.teamId}, user ${userId}, role ${userRole}`);
      
      // If user is admin, allow deletion
      if (userRole === 'admin') {
        console.log(`✅ User ${userName} is admin, allowing deletion`);
      } 
      // If user is team_lead, check team membership
      else if (userRole === 'team_lead') {
        // Check if user is a member of this team
        const teamMember = await TeamMember.findOne({
          where: {
            team_id: parseInt(channel.teamId),
            user_id: parseInt(userId)
          }
        });
        
        if (teamMember) {
          console.log(`✅ User ${userName} is member of team ${channel.teamId}`);
          
          // If the team has a specific role field, check it
          if (teamMember.role === 'team_lead') {
            console.log(`✅ User ${userName} is team lead for team ${channel.teamId}`);
          } else {
            console.log(`ℹ️ User ${userName} is member but not team lead of team ${channel.teamId}`);
          }
        } else {
          console.log(`❌ User ${userName} is not a member of team ${channel.teamId}`);
          socket.emit('error', { 
            message: 'Only team lead or admin of this team can delete team channels',
            icon: '🚫'
          });
          return;
        }
      } else {
        console.log(`❌ ${userName} not authorized to delete team channel`);
        socket.emit('error', { 
          message: 'Only team lead or admin can delete team channels',
          icon: '🚫'
        });
        return;
      }
    }

    let messageCount = 0;
    
    // Delete messages for all channels including general
    messageCount = await Message.countDocuments({ chatId: channel._id || channelId });
    
    if (channelId !== 'general') {
      await Message.deleteMany({ chatId: channel._id });
      await Channel.findByIdAndDelete(channel._id);
    } else {
      // For general channel, just delete messages but keep the channel
      await Message.deleteMany({ chatId: 'general' });
    }
    
    console.log(`🗑️ Deleted channel ${channel.name} with ${messageCount} messages`);

    const userInfo = await getUserInfo(userId);
    
    io.emit('channel_deleted_immediate', {
      channelId: channel._id || 'general',
      channelName: channel.displayName || channel.name,
      deletedBy: userInfo.userName,
      messageCount: messageCount
    });

    socket.emit('success', { 
      message: `Deleted channel "${channel.name}" and ${messageCount} messages`,
      icon: '✅'
    });

    // Send notification with icon
    io.emit('receive_notification', {
      type: 'info',
      title: 'Channel Deleted',
      message: `Channel "${channel.name}" was deleted by ${userInfo.userName}`,
      icon: '🗑️',
      timestamp: new Date()
    });

  } catch (err) {
    console.error("❌ Delete Channel Error:", err.message);
    socket.emit('error', { 
      message: 'Failed to delete channel: ' + err.message,
      icon: '❌'
    });
  }
});
  // 6. SEND REACTION
  socket.on('send_reaction', async ({ channelId, messageId, emoji }) => {
    console.log(`😊 ${userName} reacting to message ${messageId} with ${emoji}`);
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        console.log(`❌ Message ${messageId} not found`);
        return socket.emit('error', { 
          message: 'Message not found or was deleted' 
        });
      }

      const existingReactionIndex = message.reactions.findIndex(
        r => r.userId === userId
      );

      if (existingReactionIndex > -1) {
        const existingReaction = message.reactions[existingReactionIndex];
        
        if (existingReaction.emoji === emoji) {
          message.reactions.splice(existingReactionIndex, 1);
          console.log(`➖ ${userName} removed their ${emoji} reaction`);
        } else {
          message.reactions[existingReactionIndex] = {
            userId,
            userName,
            emoji,
            reactedAt: new Date()
          };
          console.log(`🔄 ${userName} changed reaction from ${existingReaction.emoji} to ${emoji}`);
        }
      } else {
        message.reactions.push({
          userId,
          userName,
          emoji,
          reactedAt: new Date()
        });
        console.log(`➕ ${userName} added ${emoji} reaction`);
      }

      await message.save();

      console.log(`📢 Broadcasting reaction update to channel ${channelId}`);
      io.to(channelId).emit('receive_reaction', {
        channelId,
        messageId,
        reactions: message.reactions
      });

    } catch (err) {
      console.error("❌ Reaction Error:", err.message);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });
// In socket.controller.js - Update the delete_channel handler
socket.on('delete_channel', async ({ channelId }) => {
  console.log(`🗑️ ${userName} deleting channel: ${channelId}`);
  try {
    // Check permissions - Only admin or team_lead can delete
    if (userRole !== 'team_lead' && userRole !== 'admin') {
      console.log(`❌ ${userName} not authorized to delete channels`);
      return socket.emit('error', { 
        message: 'Only team leads and admins can delete channels' 
      });
    }

    if (channelId === 'general') {
      console.log(`❌ Cannot delete general channel`);
      return socket.emit('error', { 
        message: 'Cannot delete the General channel' 
      });
    }

    const channel = await Channel.findById(channelId);
    
    if (!channel) {
      console.log(`❌ Channel ${channelId} not found`);
      return socket.emit('error', { message: 'Channel not found' });
    }

    // Additional check for team channels
    if (channel.type === 'team' && channel.teamId) {
      console.log(`🔍 Checking team lead status for team ${channel.teamId}, user ${userId}, role ${userRole}`);
      
      // If user is admin, allow deletion
      if (userRole === 'admin') {
        console.log(`✅ User ${userName} is admin, allowing deletion`);
      } 
      // If user is team_lead in general (not specific to this team), check team membership
      else if (userRole === 'team_lead') {
        // Check if user is a member of this team
        const teamMember = await TeamMember.findOne({
          where: {
            team_id: parseInt(channel.teamId),
            user_id: parseInt(userId)
          }
        });
        
        if (teamMember) {
          console.log(`✅ User ${userName} is member of team ${channel.teamId}`);
          
          // If the team has a specific role field, check it
          if (teamMember.role === 'team_lead') {
            console.log(`✅ User ${userName} is team lead for team ${channel.teamId}`);
          } else {
            console.log(`ℹ️ User ${userName} is member but not team lead of team ${channel.teamId}`);
          }
        } else {
          console.log(`❌ User ${userName} is not a member of team ${channel.teamId}`);
          return socket.emit('error', { 
            message: 'Only team lead or admin of this team can delete team channels' 
          });
        }
      } else {
        console.log(`❌ ${userName} not authorized to delete team channel`);
        return socket.emit('error', { 
          message: 'Only team lead or admin can delete team channels' 
        });
      }
    }

    const messageCount = await Message.countDocuments({ chatId: channel._id });
    
    await Message.deleteMany({ chatId: channel._id });
    await Channel.findByIdAndDelete(channel._id);
    
    console.log(`🗑️ Deleted channel ${channel.name} with ${messageCount} messages`);

    const userInfo = await getUserInfo(userId);
    
    io.emit('channel_deleted_immediate', {
      channelId: channel._id,
      channelName: channel.displayName || channel.name,
      deletedBy: userInfo.userName,
      messageCount: messageCount
    });

    socket.emit('success', { 
      message: `Deleted channel "${channel.name}" and ${messageCount} messages` 
    });

    // Send notification
    io.emit('receive_notification', {
      type: 'info',
      title: 'Channel Deleted',
      message: `Channel "${channel.name}" was deleted by ${userInfo.userName}`,
      timestamp: new Date()
    });

  } catch (err) {
    console.error("❌ Delete Channel Error:", err.message);
    socket.emit('error', { message: 'Failed to delete channel: ' + err.message });
  }
});
  // 8. MARK MESSAGE AS READ (For Read Receipts)
  socket.on('mark_read', async ({ channelId, messageId }) => {
    console.log(`👀 ${userName} marking message ${messageId} as read`);
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        console.log(`❌ Message ${messageId} not found`);
        return;
      }

      const alreadyRead = message.readBy.some(r => r.userId === userId);
      if (alreadyRead) {
        console.log(`ℹ️ ${userName} already read this message`);
        return;
      }

      message.readBy.push({ userId, userName, readAt: new Date() });
      await message.save();

      let channel;
      if (channelId === 'general') {
        channel = { _id: 'general', name: 'general', type: 'public' };
      } else {
        channel = await Channel.findOne({
          $or: [{ _id: channelId }, { name: channelId }]
        });
      }
      
      const totalMembers = await getChannelMembersCount(channel);
      const isReadByAll = message.readBy.length >= totalMembers;

      // Send read receipt to the sender
      const senderSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === message.senderId);
      
      if (senderSocket && message.senderId !== userId) {
        senderSocket.emit('message_read_receipt', {
          messageId,
          channelId,
          readBy: { userId, userName },
          readAt: new Date(),
          isReadByAll
        });
      }

      io.to(channelId).emit('message_seen', {
        channelId,
        messageId,
        seenBy: { userId, userName },
        seenAt: new Date(),
        isReadByAll
      });

    } catch (err) {
      console.error("❌ Mark Read Error:", err.message);
    }
  });

  // 9. GET ALL USERS FOR MENTIONING
  socket.on('get_users', async () => {
    console.log(`👥 ${userName} requested users list`);
    try {
      const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'role'],
        where: { 
          is_active: true,
          id: { [Op.ne]: parseInt(userId) }
        },
        order: [['name', 'ASC']]
      });
      
      console.log(`📤 Sending ${users.length} users to ${userName}`);
      socket.emit('users_list', users.map(user => ({
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
      })));
    } catch (err) {
      console.error("❌ Get Users Error:", err.message);
      socket.emit('error', { message: 'Failed to load users' });
    }
  });

  // 10. GET DIRECT MESSAGE USERS
  socket.on('get_direct_users', async () => {
    console.log(`📡 ${userName} requested direct users list`);
    try {
      const directUsersList = await getDirectMessageUsers();
      console.log(`📤 Sending ${directUsersList.length} direct users to ${userName}`);
      socket.emit('direct_users_list', directUsersList);
    } catch (err) {
      console.error("❌ Get Direct Users Error:", err.message);
      socket.emit('error', { message: 'Failed to load direct message users' });
    }
  });

  // 11. CREATE OR GET DIRECT MESSAGE CHANNEL
  socket.on('create_direct_message', async ({ targetUserId, targetUserName }) => {
    console.log(`📨 ${userName} creating direct message with ${targetUserName} (${targetUserId})`);
    try {
      const sortedIds = [parseInt(userId), parseInt(targetUserId)].sort((a, b) => a - b);
      const channelName = `dm-${sortedIds[0]}-${sortedIds[1]}`;
      
      let channel = await Channel.findOne({
        name: channelName
      });

      if (!channel) {
        console.log(`🔄 Creating new direct message channel: ${channelName}`);
        
        channel = new Channel({
          name: channelName,
          displayName: targetUserName,
          description: `Direct message between ${userName} and ${targetUserName}`,
          type: 'private',
          createdBy: userId,
          members: [userId, targetUserId],
          isDirectMessage: true,
          directMessageUsers: [
            { userId, userName },
            { userId: targetUserId, userName: targetUserName }
          ]
        });

        await channel.save();
        console.log(`✅ Created direct message channel: ${channelName} with ID: ${channel._id}`);
      } else {
        console.log(`✅ Using existing direct message channel: ${channelName}`);
      }

      const history = await Message.find({ chatId: channel._id })
        .sort({ createdAt: 1 })
        .limit(100);
// In your message formatting code
const historyWithUserNames = await Promise.all(
  history.map(async (msg) => {
    try {
      const userInfo = await getUserInfo(msg.senderId);
      return {
        ...msg.toObject(),
        _id: msg._id,
        id: msg._id,
        senderName: userInfo.userName,
        senderRole: userInfo.userRole,
        avatar: userInfo.avatar,
        text: msg.text || '',
        files: msg.files || [], // Make sure files are included
        createdAt: msg.createdAt || new Date(),
        updatedAt: msg.updatedAt || new Date(),
        reactions: msg.reactions || [],
        readBy: msg.readBy || []
      };
    } catch (error) {
      console.error(`Error getting user info:`, error.message);
      return {
        ...msg.toObject(),
        _id: msg._id,
        id: msg._id,
        senderName: 'Unknown User',
        senderRole: 'member',
        avatar: `https://ui-avatars.com/api/?name=Unknown&background=random`,
        text: msg.text || '',
        files: msg.files || [], // Make sure files are included here too
        createdAt: msg.createdAt || new Date(),
        updatedAt: msg.updatedAt || new Date(),
        reactions: msg.reactions || [],
        readBy: msg.readBy || []
      };
    }
  })
);
      socket.join(channel._id);
      console.log(`👤 ${userName} joined DM channel: ${channel._id}`);
      
      const channelObj = channel.toObject ? channel.toObject() : channel;
      
      if (!channelObj.displayName) {
        channelObj.displayName = targetUserName;
      }
      
      channelObj.isDirectMessage = true;
      
      socket.emit('direct_channel_created', { 
        channel: channelObj,
        history: historyWithUserNames
      });

      console.log(`✅ Direct message channel ready for ${userName} and ${targetUserName}`);

    } catch (err) {
      console.error("❌ Create Direct Message Error:", err.message);
      socket.emit('error', { message: 'Failed to create direct message: ' + err.message });
    }
  });

  // 12. INVITE USER TO CHANNEL VIA EMAIL
  socket.on('invite_user_to_channel', async ({ channelId, userEmail, userName: invitedUserName }) => {
    console.log(`📧 ${userName} inviting ${userEmail} to channel ${channelId}`);
    try {
      if (userRole !== 'team_lead' && userRole !== 'admin') {
        console.log(`❌ ${userName} not authorized to invite users`);
        return socket.emit('error', { message: 'Only team leads and admins can invite users' });
      }

      const userToInvite = await User.findOne({
        where: { email: userEmail },
        attributes: ['id', 'name', 'email']
      });

      if (!userToInvite) {
        console.log(`❌ User with email ${userEmail} not found`);
        return socket.emit('error', { message: 'User not found with that email' });
      }

      let channel;
      if (channelId === 'general') {
        channel = {
          _id: 'general',
          name: 'general',
          displayName: 'General',
          type: 'public'
        };
      } else {
        channel = await Channel.findById(channelId);
        if (!channel) {
          console.log(`❌ Channel ${channelId} not found`);
          return socket.emit('error', { message: 'Channel not found' });
        }
      }

      if (channel._id !== 'general') {
        if (channel.members && channel.members.includes(String(userToInvite.id))) {
          console.log(`ℹ️ User ${userToInvite.name} is already a member`);
          return socket.emit('info', { message: `${userToInvite.name} is already a member` });
        }

        channel.members.push(String(userToInvite.id));
        await channel.save();
      }

      console.log(`✅ Added ${userToInvite.name} to channel ${channel.name}`);

      try {
        const { sendMemberAddedEmail } = require('../services/email.service');
        await sendMemberAddedEmail(
          userEmail,
          channel.displayName || channel.name,
          userName
        );
        console.log(`📧 Invitation email sent to ${userEmail}`);
      } catch (emailError) {
        console.warn(`⚠️ Failed to send email: ${emailError.message}`);
      }

      const invitedUserSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === String(userToInvite.id));
      
      if (invitedUserSocket) {
        invitedUserSocket.emit('channel_invite', {
          channelId: channel._id,
          channelName: channel.displayName || channel.name,
          invitedBy: { id: userId, name: userName }
        });
      }

      if (channel._id !== 'general') {
        io.to(channelId).emit('user_added_to_channel', {
          channelId,
          addedUser: {
            id: String(userToInvite.id),
            name: userToInvite.name,
            email: userToInvite.email
          },
          addedBy: { id: userId, name: userName }
        });
      }

      socket.emit('success', { 
        message: `Successfully invited ${userToInvite.name} to #${channel.displayName || channel.name}` 
      });

    } catch (err) {
      console.error("❌ Invite User Error:", err.message);
      socket.emit('error', { message: 'Failed to invite user: ' + err.message });
    }
  });
// Update the delete_direct_message handler with toast icons
socket.on('delete_direct_message', async ({ channelId }) => {
  console.log(`🗑️ ${userName} deleting direct message channel: ${channelId}`);
  try {
    const channel = await Channel.findById(channelId);
    
    if (!channel) {
      console.log(`❌ Channel ${channelId} not found`);
      socket.emit('error', { 
        message: 'Channel not found',
        icon: '🔍'
      });
      return;
    }

    const isDM = channel.isDirectMessage || (channel.name && channel.name.startsWith('dm-'));
    if (!isDM) {
      console.log(`❌ Channel ${channelId} is not a direct message channel`);
      socket.emit('error', { 
        message: 'Only direct message channels can be deleted this way',
        icon: '🚫'
      });
      return;
    }

    if (!channel.members || !channel.members.includes(userId)) {
      console.log(`❌ ${userName} not authorized to delete this channel`);
      socket.emit('error', { 
        message: 'You are not a member of this conversation',
        icon: '🚫'
      });
      return;
    }

    const messageCount = await Message.countDocuments({ chatId: channel._id });
    
    await Message.deleteMany({ chatId: channel._id });
    await Channel.findByIdAndDelete(channel._id);
    
    console.log(`🗑️ Deleted DM channel ${channel._id} with ${messageCount} messages`);

    const otherMemberId = channel.members.find(memberId => memberId !== userId);
    
    const userInfo = await getUserInfo(userId);
    
    socket.emit('direct_message_deleted_immediate', {
      channelId: channel._id,
      success: true,
      messageCount: messageCount,
      deletedBy: userInfo,
      icon: '🗑️'
    });
    
    if (otherMemberId) {
      const otherUserSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === String(otherMemberId));
      
      if (otherUserSocket) {
        otherUserSocket.emit('direct_message_deleted_immediate', {
          channelId: channel._id,
          success: true,
          messageCount: messageCount,
          deletedBy: userInfo,
          icon: '🗑️'
        });
      }
    }
    
    io.emit('channel_deleted_immediate', {
      channelId: channel._id,
      deletedBy: userId,
      channelName: channel.displayName || channel.name,
      icon: '🗑️'
    });

    socket.emit('success', { 
      message: `Deleted conversation and ${messageCount} messages`,
      icon: '✅'
    });

  } catch (err) {
    console.error("❌ Delete Direct Message Error:", err.message);
    socket.emit('error', { 
      message: 'Failed to delete direct message: ' + err.message,
      icon: '❌'
    });
  }
});
  // 14. CLEAR CHAT HISTORY
  socket.on('clear_chat_history', async ({ channelId }) => {
    console.log(`🧹 ${userName} clearing chat history for channel: ${channelId}`);
    try {
      let channel;
      let isGeneral = false;
      
      if (channelId === 'general') {
        channel = {
          _id: 'general',
          name: 'general',
          displayName: 'General',
          type: 'public'
        };
        isGeneral = true;
      } else {
        channel = await Channel.findById(channelId);
        
        if (!channel) {
          console.log(`❌ Channel ${channelId} not found`);
          return socket.emit('error', { message: 'Channel not found' });
        }
      }

      const canClear = isGeneral || 
                      (channel.members && channel.members.includes(userId)) || 
                      userRole === 'admin';
      
      if (!canClear) {
        console.log(`❌ ${userName} not authorized to clear this chat`);
        return socket.emit('error', { message: 'You are not authorized to clear this chat' });
      }

      const result = await Message.deleteMany({ chatId: channel._id || channelId });
      console.log(`🗑️ Deleted ${result.deletedCount} messages from channel ${channel._id || channelId}`);

      const userInfo = await getUserInfo(userId);
      
      io.to(channel._id || channelId).emit('chat_history_cleared_immediate', {
        channelId: channel._id || channelId,
        clearedBy: userInfo,
        clearedAt: new Date(),
        deletedCount: result.deletedCount
      });

      io.to(channel._id || channelId).emit('channel_messages_cleared', {
        channelId: channel._id || channelId
      });

      socket.emit('success', { 
        message: `Cleared ${result.deletedCount} messages from chat` 
      });

    } catch (err) {
      console.error("❌ Clear Chat History Error:", err.message);
      socket.emit('error', { message: 'Failed to clear chat history' });
    }
  });

  // 15. CHANNEL REFRESH EVENT
  socket.on('channel_refresh', async ({ channelId }) => {
    console.log(`🔄 User ${userName} requesting refresh for channel: ${channelId}`);
    
    if (channelId === 'general') {
      socket.emit('join_channel', channelId);
    } else {
      const channel = await Channel.findOne({
        $or: [{ _id: channelId }, { name: channelId }]
      });
      
      if (channel && canAccessChannel(channel, userId, userRole, teamId)) {
        socket.emit('join_channel', channelId);
      }
    }
  });

  // 16. CHANNELS REFRESH EVENT
  socket.on('channels_refresh', async () => {
    console.log(`🔄 ${userName} requesting full channels refresh`);
    try {
      let channels = [];
      
      channels.push({
        _id: 'general',
        name: 'general',
        displayName: 'General',
        type: 'public',
        description: 'Company-wide announcements',
        isGeneral: true
      });

      const userChannels = await Channel.find({
        $or: [
          { type: 'public' },
          { members: userId },
          { teamId: teamId },
          { type: { $in: ['team', 'private'] } }
        ]
      });

      const allChannels = [...channels, ...userChannels];
      const uniqueChannels = [];
      const seenIds = new Set();
      
      for (const channel of allChannels) {
        const channelId = channel._id || channel.id;
        if (!seenIds.has(channelId)) {
          seenIds.add(channelId);
          uniqueChannels.push(channel);
        }
      }

      console.log(`📤 Sending refreshed channels list (${uniqueChannels.length} channels) to ${userName}`);
      socket.emit('channels_list', uniqueChannels);
      
    } catch (err) {
      console.error("❌ Channels refresh error:", err.message);
      socket.emit('error', { message: 'Failed to refresh channels' });
    }
  });

  // 17. DEBUG: LISTEN FOR ALL EVENTS
  socket.onAny((eventName, ...args) => {
    if (eventName !== 'typing_start' && eventName !== 'typing_stop') {
      console.log(`📡 Event received: ${eventName}`, args.length > 0 ? args[0] : '');
    }
  });
};