const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  keyInsights: {
    type: [String],
    default: [],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    author: String,
    genre: String,
    publicationYear: String,
    pages: String,
  },
  wordCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for faster queries
summarySchema.index({ timestamp: -1 });
summarySchema.index({ id: 1 });

module.exports = mongoose.model('Summary', summarySchema);
