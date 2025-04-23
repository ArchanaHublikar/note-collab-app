const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permission: {
    type: String,
    enum: ['read', 'write'],
    required: true
  },
  sharedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a unique compound index on noteId and userId
shareSchema.index({ noteId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Share', shareSchema);