import { fakeDB } from './fakeDB';

export const FakeServer = {
  login(email) {
    return fakeDB.users.find(u => u.email === email) || null;
  },

  getChannels() {
    return [...fakeDB.channels];
  },

  getTeams() {
    return [...fakeDB.teams];
  },

  getInitialTeams() {
    return [...fakeDB.teams];
  },

  getMessages(chatId) {
    return [...(fakeDB.messages[chatId] || [])];
  },

  getInitialMessages(chatId) {
    return this.getMessages(chatId);
  },

  sendMessage(chatId, text, sender = "Mock User") {
    const msg = { 
      id: Date.now() + Math.random(),
      sender, 
      text, 
      timestamp: new Date().toISOString(),
      type: 'text',
      edited: false,
      editHistory: []
    };
    if (!fakeDB.messages[chatId]) fakeDB.messages[chatId] = [];
    fakeDB.messages[chatId].push(msg);
    
    if (sender !== "You") {
      this.incrementUnread(chatId);
    }
    
    return msg;
  },

  addTeam(team) {
    const existingTeam = fakeDB.teams.find(t => t.id === team.id);
    if (!existingTeam) {
      fakeDB.teams.push(team);
      fakeDB.messages[team.id] = [];
      fakeDB.unread[team.id] = 0;
      return team;
    }
    return existingTeam;
  },

  addChannel(channel) {
    const existingChannel = fakeDB.channels.find(c => c.id === channel.id);
    if (!existingChannel) {
      fakeDB.channels.push(channel);
      fakeDB.messages[channel.id] = [];
      fakeDB.unread[channel.id] = 0;
      return channel;
    }
    return existingChannel;
  },

  incrementUnread(chatId) {
    if (fakeDB.unread[chatId] !== undefined) {
      fakeDB.unread[chatId]++;
    } else {
      fakeDB.unread[chatId] = 1;
    }
  },

  resetUnread(chatId) {
    fakeDB.unread[chatId] = 0;
  },

  getUnread(chatId) {
    return fakeDB.unread[chatId] || 0;
  },
  

  // FIXED: Get random message from different senders
  getRandomMessage(chatId) {
    const messages = fakeDB.messages[chatId] || [];
    if (!messages.length) return null;
    
    // Get messages not sent by 'You'
    const otherMessages = messages.filter(m => m.sender !== 'You');
    if (!otherMessages.length) return null;
    
    const randomIndex = Math.floor(Math.random() * otherMessages.length);
    const message = otherMessages[randomIndex];
    
    // Return a COPY of the message with a new ID and timestamp
    // This makes it appear as a new message from the same sender
    return {
      ...message,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      edited: false,
      editHistory: []
    };
  },

  // FIXED: Simulate incoming messages from different senders
  simulateIncomingMessage(chatId) {
    // List of possible senders (excluding 'You')
    const possibleSenders = ['John', 'Alice', 'Harshini', 'Bob', 'Charlie', 'Emma', 'David', 'Sophia'];
    
    // List of possible messages by context
    const messageTemplates = {
      general: [
        "Has anyone seen the latest report?",
        "Good morning everyone!",
        "Don't forget about the meeting at 3 PM",
        "Could someone review my PR?",
        "The new update looks great!",
        "Anyone free for a quick sync?",
        "Check out this interesting article",
        "Reminder: Team lunch tomorrow",
        "Happy Friday everyone! 🎉",
        "Who's working on the backend API?"
      ],
      design: [
        "I've updated the mockups",
        "What do you think about the new color scheme?",
        "Can someone review the latest designs?",
        "I'll share the Figma link shortly",
        "The design system needs updating",
        "Feedback on the new UI components?",
        "Mobile version is ready for review",
        "Let's discuss the user flow",
        "Added dark mode support",
        "Design review at 2 PM tomorrow"
      ],
      'frontend-team': [
        "The React component is ready",
        "Anyone facing issues with the build?",
        "I've fixed the bug in the login flow",
        "Need help with TypeScript types",
        "The new feature is deployed",
        "Let's discuss performance optimizations",
        "UI tests are failing",
        "Check the new component library",
        "API integration is complete",
        "Mobile responsive fixes done"
      ],
      default: [
        "Hello!",
        "How's everyone doing?",
        "Can someone help me with this?",
        "Interesting, tell me more",
        "Let me check and get back to you",
        "Thanks for the update!",
        "Looking good!",
        "I'll take care of that",
        "When can we expect this?",
        "Great work everyone!"
      ]
    };
    
    // Determine which template to use based on chatId
    let template = messageTemplates.default;
    if (chatId in messageTemplates) {
      template = messageTemplates[chatId];
    } else if (chatId.includes('team')) {
      template = messageTemplates['frontend-team'];
    }
    
    // Pick a random sender and message
    const randomSender = possibleSenders[Math.floor(Math.random() * possibleSenders.length)];
    const randomMessage = template[Math.floor(Math.random() * template.length)];
    
    // Create the message
    const msg = {
      id: Date.now() + Math.random(),
      sender: randomSender,
      text: randomMessage,
      timestamp: new Date().toISOString(),
      type: 'text',
      edited: false,
      editHistory: []
    };
    
    // Store in fakeDB
    if (!fakeDB.messages[chatId]) fakeDB.messages[chatId] = [];
    fakeDB.messages[chatId].push(msg);
    
    // Increment unread count
    this.incrementUnread(chatId);
    
    return msg;
  },

  addMessage(chatId, msg) {
    if (!fakeDB.messages[chatId]) fakeDB.messages[chatId] = [];
    
    const messageId = msg.id || Date.now() + Math.random();
    const existingMsg = fakeDB.messages[chatId].find(m => m.id === messageId);
    
    if (!existingMsg) {
      const messageWithId = {
        ...msg,
        id: messageId,
        edited: false,
        editHistory: []
      };
      fakeDB.messages[chatId].push(messageWithId);
      
      if (msg.sender !== 'You') {
        this.incrementUnread(chatId);
      }
      
      return messageWithId;
    }
    return existingMsg;
  },

  getAllChats() {
    return [
      ...fakeDB.channels.map(c => ({ ...c, type: 'channel' })),
      ...fakeDB.teams.map(t => ({ ...t, type: 'team' })),
      { id: 'dm_john', name: 'John Doe', type: 'dm' }
    ];
  },

  getChatInfo(chatId) {
    const chatTypes = {
      'general': { name: 'general', description: 'General workspace discussion', type: 'channel', members: 42 },
      'design': { name: 'design', description: 'Design team discussions', type: 'channel', members: 12 },
      'announcements': { name: 'announcements', description: 'Company announcements', type: 'channel', members: 50 },
      'frontend-team': { name: 'Frontend Team', description: 'Frontend development team', type: 'team', members: 8 },
      'backend-team': { name: 'Backend Team', description: 'Backend development team', type: 'team', members: 6 },
      'dm_john': { name: 'John Doe', description: 'Frontend Lead', type: 'dm', status: 'online' },
    };
    
    return chatTypes[chatId] || { name: 'Unknown', description: 'No description', type: 'channel', members: 0 };
  },

  // EDIT MESSAGE FUNCTION
  editMessage(chatId, messageId, newText, userId = "You") {
    const chat = fakeDB.messages[chatId];
    if (!chat) {
      console.error(`Chat ${chatId} not found`);
      return null;
    }
    
    const message = chat.find(msg => msg.id === messageId);
    if (!message) {
      console.error(`Message ${messageId} not found in chat ${chatId}`);
      return null;
    }
    
    // Check if user is the sender (only sender can edit)
    if (message.sender !== userId && userId !== "You") {
      console.error(`User ${userId} is not authorized to edit this message`);
      return null;
    }
    
    // Save the original text to edit history
    if (!message.editHistory) {
      message.editHistory = [];
    }
    
    // Add current state to history before editing
    message.editHistory.push({
      text: message.text,
      timestamp: message.lastEdited || message.timestamp,
      editedBy: message.sender
    });
    
    // Update the message
    const originalText = message.text;
    message.text = newText;
    message.edited = true;
    message.lastEdited = new Date().toISOString();
    
    console.log(`Message edited from "${originalText}" to "${newText}"`);
    
    // Return the updated message
    return {
      ...message,
      // Include the full edit history in the response
      editHistory: [...message.editHistory]
    };
  },

  // Get edit history for a message
  getEditHistory(chatId, messageId) {
    const chat = fakeDB.messages[chatId];
    if (!chat) return [];
    
    const message = chat.find(msg => msg.id === messageId);
    if (!message || !message.editHistory) return [];
    
    return [...message.editHistory];
  },

  // Delete message function
  deleteMessage(chatId, messageId, forEveryone = false) {
    const chat = fakeDB.messages[chatId];
    if (chat) {
      if (forEveryone) {
        // Delete for everyone
        const index = chat.findIndex(msg => msg.id === messageId);
        if (index > -1) {
          chat.splice(index, 1);
        }
      } else {
        // Just mark as deleted for current user
        const message = chat.find(msg => msg.id === messageId);
        if (message) {
          message.deletedForUser = true;
        }
      }
    }
    return true;
  },

  // Add reaction function
  addReaction(chatId, messageId, emoji, userId) {
    const chat = fakeDB.messages[chatId];
    if (chat) {
      const message = chat.find(msg => msg.id === messageId);
      if (message) {
        if (!message.reactions) {
          message.reactions = {};
        }
        if (!message.reactions[emoji]) {
          message.reactions[emoji] = [];
        }
        
        const userIndex = message.reactions[emoji].indexOf(userId);
        if (userIndex > -1) {
          // Remove reaction
          message.reactions[emoji].splice(userIndex, 1);
          if (message.reactions[emoji].length === 0) {
            delete message.reactions[emoji];
          }
        } else {
          // Add reaction
          message.reactions[emoji].push(userId);
        }
        return message.reactions;
      }
    }
    return null;
  },

  // Helper method to check if a message can be edited
  canEditMessage(chatId, messageId, userId = "You") {
    const chat = fakeDB.messages[chatId];
    if (!chat) return false;
    
    const message = chat.find(msg => msg.id === messageId);
    if (!message) return false;
    
    // Only sender can edit their own messages
    return message.sender === userId || userId === "You";
  },

  // Helper method to check edit time limit (optional: add time limit for editing)
  canEditWithinTimeLimit(chatId, messageId, timeLimitMinutes = 15) {
    const chat = fakeDB.messages[chatId];
    if (!chat) return false;
    
    const message = chat.find(msg => msg.id === messageId);
    if (!message) return false;
    
    const messageTime = new Date(message.timestamp);
    const currentTime = new Date();
    const timeDiff = (currentTime - messageTime) / (1000 * 60); // Convert to minutes
    
    return timeDiff <= timeLimitMinutes;
  }
};