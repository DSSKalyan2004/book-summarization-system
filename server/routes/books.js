const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Book = require('../models/Book');
const RawText = require('../models/RawText');
const Summary = require('../models/Summary');
const { extractTextFromFile } = require('../utils/fileExtractor');
const { authenticateToken } = require('./auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
    }
  }
});

// POST /api/books/upload - Upload book file and extract text
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, author, genre, publication_year, pages } = req.body;

    // Validation
    if (!title || !author) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['title', 'author']
      });
    }

    console.log(`📄 Processing uploaded file: ${req.file.originalname}`);
    
    // Extract text from file
    const fileExtension = path.extname(req.file.originalname);
    const extractedText = await extractTextFromFile(req.file.path, fileExtension);
    
    // Create book record
    const book = new Book({
      title,
      author,
      uploaded_by: req.user._id,
      upload_date: new Date(),
      genre: genre || undefined,
      publication_year: publication_year ? parseInt(publication_year) : undefined,
      pages: pages ? parseInt(pages) : undefined,
      original_filename: req.file.originalname,
      file_size: req.file.size,
      file_type: fileExtension.substring(1), // Remove the dot
      is_processed: true
    });

    await book.save();

    // Create raw text record
    const rawText = new RawText({
      book_id: book._id,
      full_text: extractedText,
      extraction_method: fileExtension.substring(1)
    });

    await rawText.save();

    // Clean up the uploaded file after extraction
    try {
      await fs.unlink(req.file.path);
      console.log(`🗑️ Cleaned up temporary file: ${req.file.filename}`);
    } catch (cleanupError) {
      console.warn('Failed to delete temporary file:', cleanupError);
    }
    
    res.status(201).json({
      message: 'Book uploaded and processed successfully',
      book: {
        id: book._id,
        title: book.title,
        author: book.author,
        upload_date: book.upload_date,
        file_size: book.file_size,
        word_count: rawText.word_count
      }
    });
    
  } catch (error) {
    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to delete temporary file on error:', cleanupError);
      }
    }
    
    console.error('Book upload error:', error);
    res.status(500).json({ 
      error: 'Book upload failed', 
      message: error.message 
    });
  }
});

// GET /api/books - Get all books
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, sort = '-upload_date', limit = 50, page = 1 } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const books = await Book.find(query)
      .populate('uploaded_by', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .select('-__v');

    const total = await Book.countDocuments(query);

    res.json({
      books,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Fetch books error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch books', 
      message: error.message 
    });
  }
});

// GET /api/books/my-books - Get books uploaded by current user
router.get('/my-books', authenticateToken, async (req, res) => {
  try {
    const books = await Book.find({ uploaded_by: req.user._id })
      .sort({ upload_date: -1 })
      .select('-__v');

    res.json({
      count: books.length,
      books
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch your books', 
      message: error.message 
    });
  }
});

// GET /api/books/:id - Get single book with details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('uploaded_by', 'name email')
      .select('-__v');

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Get raw text info (without full text)
    const rawText = await RawText.findOne({ book_id: book._id })
      .select('word_count character_count extraction_method extraction_date');

    // Get summaries count
    const summariesCount = await Summary.countDocuments({ book_id: book._id });

    res.json({
      book,
      textInfo: rawText,
      summariesCount
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch book', 
      message: error.message 
    });
  }
});

// GET /api/books/:id/text - Get full text of a book
router.get('/:id/text', authenticateToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const rawText = await RawText.findOne({ book_id: book._id });
    
    if (!rawText) {
      return res.status(404).json({ error: 'Text not found for this book' });
    }

    res.json({
      book_id: book._id,
      title: book.title,
      full_text: rawText.full_text,
      word_count: rawText.word_count,
      character_count: rawText.character_count
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch book text', 
      message: error.message 
    });
  }
});

// PUT /api/books/:id - Update book metadata
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check ownership or admin
    if (book.uploaded_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to update this book' });
    }

    const { title, author, genre, publication_year, pages } = req.body;
    const updates = {};

    if (title !== undefined) updates.title = title;
    if (author !== undefined) updates.author = author;
    if (genre !== undefined) updates.genre = genre;
    if (publication_year !== undefined) updates.publication_year = publication_year;
    if (pages !== undefined) updates.pages = pages;

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('uploaded_by', 'name email');

    res.json({
      message: 'Book updated successfully',
      book: updatedBook
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Failed to update book', 
      message: error.message 
    });
  }
});

// DELETE /api/books/:id - Delete book and associated data
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check ownership or admin
    if (book.uploaded_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this book' });
    }

    // Delete associated raw text
    await RawText.deleteOne({ book_id: book._id });

    // Delete associated summaries
    await Summary.deleteMany({ book_id: book._id });

    // Delete the book
    await Book.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'Book and all associated data deleted successfully',
      bookId: req.params.id
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete book', 
      message: error.message 
    });
  }
});

// GET /api/books/:id/summaries - Get all summaries for a book
router.get('/:id/summaries', authenticateToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const summaries = await Summary.find({ book_id: book._id })
      .populate('generated_by', 'name email')
      .sort({ generation_date: -1 })
      .select('-__v');

    res.json({
      book_id: book._id,
      title: book.title,
      summaries_count: summaries.length,
      summaries
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch summaries', 
      message: error.message 
    });
  }
});

module.exports = router;
