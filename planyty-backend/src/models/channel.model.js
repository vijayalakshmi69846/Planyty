// channel.model.js - SIMPLEST WORKING VERSION
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const channelSchema = new Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  displayName: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  type: { 
    type: String, 
    enum: ['public', 'private', 'team'], 
    default: 'public' 
  },
  createdBy: { 
    type: String, 
    required: true 
  },
  teamId: { 
    type: String, 
    default: null 
  },
  members: [{ 
    type: String 
  }],
  projectId: { 
    type: String, 
    default: null 
  },
  projectInfo: { 
    type: Object, 
    default: null 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// NO MIDDLEWARE FOR NOW - get it working first
// channelSchema.pre('save', ...);

const Channel = mongoose.model('Channel', channelSchema);
module.exports = Channel;