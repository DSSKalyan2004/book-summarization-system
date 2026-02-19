const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { router: authRoutes } = require('./routes/auth');
const booksRoutes = require('./routes/books');
const summaryRoutes = require('./routes/summaries');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (for admin dashboard)
app.use(express.static('public'));

// MongoDB Connection (OPTIONAL - for now working without it)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/book-summarization';

if (MONGODB_URI.includes('mongodb+srv') || MONGODB_URI.includes('mongodb://') && !MONGODB_URI.includes('localhost')) {
  console.log('🔄 Connecting to MongoDB...');
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('✅ MongoDB connected successfully');
      console.log('📦 Database ready to store user accounts and summaries');
    })
    .catch((err) => {
      console.log('⚠️  MongoDB not connected - using local storage');
      console.log('   (This is OK for testing. Add MongoDB later for persistence)');
    });
} else {
  console.log('📝 Running in LOCAL MODE (no MongoDB required)');
  console.log('💡 User data stored in memory (will reset on server restart)');
  console.log('   To enable MongoDB: Update MONGODB_URI in .env file');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/summaries', summaryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Book Summarization Platform API',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      summaries: '/api/summaries',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
