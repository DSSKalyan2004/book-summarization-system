const mongoose = require('mongoose');

const rawTextSchema = new mongoose.Schema({
  book_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book reference is required'],
    unique: true // One raw text per book
  },
  full_text: {
    type: String,
    required: [true, 'Text content is required']
  },
  word_count: {
    type: Number,
    default: 0
  },
  character_count: {
    type: Number,
    default: 0
  },
  extraction_method: {
    type: String,
    enum: ['pdf', 'docx', 'txt', 'manual'],
    default: 'manual'
  },
  extraction_date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
rawTextSchema.index({ book_id: 1 });
rawTextSchema.index({ extraction_date: -1 });

// Pre-save middleware to calculate word and character counts
rawTextSchema.pre('save', function(next) {
  if (this.isModified('full_text')) {
    this.character_count = this.full_text.length;
    // Calculate word count (split by whitespace and filter empty strings)
    this.word_count = this.full_text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
  next();
});

// Method to get text excerpt
rawTextSchema.methods.getExcerpt = function(length = 200) {
  if (this.full_text.length <= length) {
    return this.full_text;
  }
  return this.full_text.substring(0, length) + '...';
};

module.exports = mongoose.model('RawText', rawTextSchema);
