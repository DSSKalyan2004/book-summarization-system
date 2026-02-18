const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Summary = require('../models/Summary');
const Book = require('../models/Book');
const RawText = require('../models/RawText');
const { authenticateToken, optionalAuth } = require('./auth');
const { extractTextFromFile } = require('../utils/fileExtractor');

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

// POST /api/summaries/upload - Upload file and extract text (no auth required for text extraction)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📄 Processing uploaded file: ${req.file.originalname}`);
    
    // Extract text from file
    const fileExtension = path.extname(req.file.originalname);
    const extractedText = await extractTextFromFile(req.file.path, fileExtension);
    
    // Clean up the uploaded file after extraction
    try {
      await fs.unlink(req.file.path);
      console.log(`🗑️ Cleaned up temporary file: ${req.file.filename}`);
    } catch (cleanupError) {
      console.warn('Failed to delete temporary file:', cleanupError);
    }
    
    res.status(200).json({
      text: extractedText,
      filename: req.file.originalname,
      message: 'File processed successfully'
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
    
    console.error('File upload error:', error);
    res.status(500).json({ 
      error: 'File processing failed', 
      message: error.message 
    });
  }
});

// GET /api/summaries - Get all summaries
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { summary_type, limit = 50, page = 1 } = req.query;
    
    let query = {};
    
    if (summary_type && ['short', 'detailed'].includes(summary_type)) {
      query.summary_type = summary_type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const summaries = await Summary.find(query)
      .populate('book_id', 'title author')
      .populate('generated_by', 'name email')
      .sort({ generation_date: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-__v');

    const total = await Summary.countDocuments(query);

    res.json({
      summaries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Fetch summaries error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch summaries', 
      message: error.message 
    });
  }
});

// GET /api/summaries/:id - Get single summary by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const summary = await Summary.findById(req.params.id)
      .populate('book_id', 'title author genre publication_year')
      .populate('generated_by', 'name email')
      .select('-__v');

    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    res.json(summary);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch summary', 
      message: error.message 
    });
  }
});

// POST /api/summaries - Create new summary
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { book_id, summary_text, summary_type, key_insights, ai_model, language } = req.body;

    // Validation
    if (!book_id || !summary_text || !summary_type) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['book_id', 'summary_text', 'summary_type']
      });
    }

    // Check if book exists
    const book = await Book.findById(book_id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Create summary
    const summary = new Summary({
      book_id,
      summary_text,
      summary_type,
      key_insights: key_insights || [],
      generated_by: req.user._id,
      generation_date: new Date(),
      ai_model: ai_model || 'gemini-1.5-flash',
      language: language || 'en'
    });

    await summary.save();

    const populatedSummary = await Summary.findById(summary._id)
      .populate('book_id', 'title author')
      .populate('generated_by', 'name email');

    res.status(201).json({
      message: 'Summary created successfully',
      summary: populatedSummary
    });
  } catch (error) {
    console.error('Create summary error:', error);
    res.status(400).json({ 
      error: 'Failed to create summary', 
      message: error.message 
    });
  }
});

// PUT /api/summaries/:id - Update summary
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const summary = await Summary.findById(req.params.id);
    
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    // Check ownership or admin
    if (summary.generated_by && summary.generated_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to update this summary' });
    }

    const { summary_text, summary_type, key_insights, language } = req.body;
    const updates = {};

    if (summary_text !== undefined) updates.summary_text = summary_text;
    if (summary_type !== undefined) updates.summary_type = summary_type;
    if (key_insights !== undefined) updates.key_insights = key_insights;
    if (language !== undefined) updates.language = language;

    const updatedSummary = await Summary.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('book_id', 'title author')
     .populate('generated_by', 'name email');

    res.json({
      message: 'Summary updated successfully',
      summary: updatedSummary
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Failed to update summary', 
      message: error.message 
    });
  }
});

// DELETE /api/summaries/:id - Delete summary
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const summary = await Summary.findById(req.params.id);
    
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    // Check ownership or admin
    if (summary.generated_by && summary.generated_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this summary' });
    }

    await Summary.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'Summary deleted successfully',
      summaryId: req.params.id
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete summary', 
      message: error.message 
    });
  }
});

// GET /api/summaries/book/:bookId - Get summaries for specific book
router.get('/book/:bookId', authenticateToken, async (req, res) => {
  try {
    const summaries = await Summary.find({ book_id: req.params.bookId })
      .populate('generated_by', 'name email')
      .sort({ generation_date: -1 })
      .select('-__v');

    res.json({
      book_id: req.params.bookId,
      count: summaries.length,
      summaries
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch summaries for book', 
      message: error.message 
    });
  }
});

module.exports = router;

