const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    minlength: [1, 'Title must be at least 1 character long'],
    maxlength: [500, 'Title cannot exceed 500 characters']
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [200, 'Author name cannot exceed 200 characters']
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader information is required']
  },
  upload_date: {
    type: Date,
    default: Date.now,
    required: true
  },
  // Additional metadata
  genre: {
    type: String,
    trim: true,
    maxlength: [100, 'Genre cannot exceed 100 characters']
  },
  publication_year: {
    type: Number,
    min: [1000, 'Publication year must be valid'],
    max: [new Date().getFullYear() + 1, 'Publication year cannot be in the future']
  },
  pages: {
    type: Number,
    min: [1, 'Page count must be at least 1']
  },
  original_filename: {
    type: String,
    trim: true
  },
  file_size: {
    type: Number,
    min: [0, 'File size cannot be negative']
  },
  file_type: {
    type: String,
    enum: ['pdf', 'docx', 'txt'],
    lowercase: true
  },
  is_processed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for performance
bookSchema.index({ title: 'text', author: 'text' }); // Full-text search
bookSchema.index({ uploaded_by: 1 });
bookSchema.index({ upload_date: -1 });
bookSchema.index({ is_processed: 1 });

// Virtual for raw text
bookSchema.virtual('rawText', {
  ref: 'RawText',
  localField: '_id',
  foreignField: 'book_id',
  justOne: true
});

// Virtual for summaries
bookSchema.virtual('summaries', {
  ref: 'Summary',
  localField: '_id',
  foreignField: 'book_id'
});

// Enable virtuals in JSON
bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Book', bookSchema);
