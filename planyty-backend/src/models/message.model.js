const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  text: { type: String, default: '' },
  audioUrl: { type: String },
  audioSize: { type: Number },
  audioDuration: { type: Number },
  isVoiceMessage: { type: Boolean, default: false },
  files: [{
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    path: { type: String }
  }],
  readBy: [{
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    readAt: { type: Date, default: Date.now }
  }],
  reactions: [{
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    emoji: { type: String, required: true },
    reactedAt: { type: Date, default: Date.now }
  }],
  edited: { type: Boolean, default: false },
  editedAt: { type: Date },
  replyTo: {
    id: { type: String },
    sender: { type: String },
    text: { type: String }
  },
  deleted: { type: Boolean, default: false },
  deletedBy: { type: String },
  pinned: { type: Boolean, default: false }
}, { timestamps: true });
// Add indexes for better performance
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ 'readBy.userId': 1 });
messageSchema.index({ deleted: 1 });

module.exports = mongoose.model('Message', messageSchema);