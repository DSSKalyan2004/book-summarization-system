const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Summary = require('../models/Summary');
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

// POST upload and extract text from file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📄 Processing uploaded file: ${req.file.originalname}`);
    
    const fileExtension = path.extname(req.file.originalname);
    const extractedText = await extractTextFromFile(req.file.path, fileExtension);
    
    // Clean up the uploaded file after extraction
    try {
      await fs.unlink(req.file.path);
      console.log(`🗑️ Cleaned up temporary file: ${req.file.filename}`);
    } catch (cleanupError) {
      console.warn('Failed to delete temporary file:', cleanupError);
    }
    
    res.json({
      success: true,
      text: extractedText,
      filename: req.file.originalname,
      size: req.file.size,
      extractedLength: extractedText.length
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

// GET all summaries
router.get('/', async (req, res) => {
  try {
    const summaries = await Summary.find()
      .sort({ timestamp: -1 })
      .select('-__v -createdAt -updatedAt');
    res.json(summaries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summaries', message: error.message });
  }
});

// GET single summary by ID
router.get('/:id', async (req, res) => {
  try {
    const summary = await Summary.findOne({ id: req.params.id })
      .select('-__v -createdAt -updatedAt');
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary', message: error.message });
  }
});

// POST create new summary
router.post('/', async (req, res) => {
  try {
    const summaryData = req.body;
    const newSummary = new Summary(summaryData);
    await newSummary.save();
    res.status(201).json(newSummary);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create summary', message: error.message });
  }
});

// DELETE summary by ID
router.delete('/:id', async (req, res) => {
  try {
    const result = await Summary.findOneAndDelete({ id: req.params.id });
    if (!result) {
      return res.status(404).json({ error: 'Summary not found' });
    }
    res.json({ message: 'Summary deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete summary', message: error.message });
  }
});

// PUT update summary by ID
router.put('/:id', async (req, res) => {
  try {
    const summary = await Summary.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    ).select('-__v -createdAt -updatedAt');
    
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }
    res.json(summary);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update summary', message: error.message });
  }
});

module.exports = router;
