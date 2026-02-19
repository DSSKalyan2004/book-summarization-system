const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  book_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book reference is required']
  },
  summary_text: {
    type: String,
    required: [true, 'Summary text is required'],
    minlength: [10, 'Summary must be at least 10 characters long']
  },
  summary_type: {
    type: String,
    enum: {
      values: ['short', 'detailed'],
      message: 'Summary type must be either "short" or "detailed"'
    },
    required: [true, 'Summary type is required'],
    default: 'short'
  },
  // Additional useful fields
  key_insights: {
    type: [String],
    default: []
  },
  word_count: {
    type: Number,
    default: 0
  },
  generated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  generation_date: {
    type: Date,
    default: Date.now
  },
  ai_model: {
    type: String,
    default: 'gemini-1.5-flash'
  },
  language: {
    type: String,
    default: 'en'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for performance
summarySchema.index({ book_id: 1, summary_type: 1 });
summarySchema.index({ generation_date: -1 });
summarySchema.index({ summary_type: 1 });

// Pre-save middleware to calculate word count
summarySchema.pre('save', function(next) {
  if (this.isModified('summary_text')) {
    this.word_count = this.summary_text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
  next();
});

// Method to get summary excerpt
summarySchema.methods.getExcerpt = function(length = 100) {
  if (this.summary_text.length <= length) {
    return this.summary_text;
  }
  return this.summary_text.substring(0, length) + '...';
};

module.exports = mongoose.model('Summary', summarySchema);
