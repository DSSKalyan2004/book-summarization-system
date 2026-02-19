const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret (should be in .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// In-memory fallback if MongoDB not connected
let users = [];

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Try MongoDB first
    try {
      const user = await User.findOne({ email: decoded.email, isActive: true });
      if (user) {
        req.user = {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        };
        return next();
      }
    } catch (dbError) {
      // Fallback to in-memory
      const user = users.find(u => u.email === decoded.email && u.isActive);
      if (user) {
        req.user = { ...user, password: undefined };
        return next();
      }
    }
    
    return res.status(401).json({ error: 'User not found or inactive' });
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware for optional authentication (continues even without token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = users.find(u => u.email === decoded.email && u.isActive);
      if (user) {
        req.user = { ...user, password: undefined };
      }
    }
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'email', 'password']
      });
    }

    // Try MongoDB first
    try {
      // Check if user exists in MongoDB
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      // Create new user in MongoDB
      const user = new User({
        name,
        email,
        password,
        role: role || 'user'
      });

      await user.save();
      console.log('✅ User registered in MongoDB:', email);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      });
    } catch (dbError) {
      // Fallback to in-memory storage
      console.log('⚠️  MongoDB not available, using memory storage');
      
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      const user = {
        id: Date.now().toString(),
        _id: Date.now().toString(),
        name,
        email,
        password: Buffer.from(password).toString('base64'),
        role: role || 'user',
        isActive: true,
        createdAt: new Date().toISOString()
      };

      users.push(user);
      console.log('✅ User registered in memory:', email);

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed', 
      message: error.message 
    });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password']
      });
    }

    // Try MongoDB first
    try {
      const user = await User.findOne({ email }).select('+password');
      if (user) {
        if (!user.isActive) {
          return res.status(403).json({ error: 'Account is inactive' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log('✅ User logged in (MongoDB):', email);

        const token = jwt.sign(
          { userId: user._id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

        return res.json({
          message: 'Login successful',
          user: {
            id: user._id,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token
        });
      }
    } catch (dbError) {
      // Fallback to in-memory
      const user = users.find(u => u.email === email);
      if (user) {
        if (!user.isActive) {
          return res.status(403).json({ error: 'Account is inactive' });
        }

        const isPasswordValid = Buffer.from(password).toString('base64') === user.password;
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log('✅ User logged in (memory):', email);

        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

        return res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token
        });
      }
    }

    return res.status(401).json({ error: 'Invalid email or password' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      message: error.message 
    });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch user profile', 
      message: error.message 
    });
  }
});

// GET /api/auth/admin/users - View all users (Admin dashboard)
router.get('/admin/users', async (req, res) => {
  try {
    // Try MongoDB first
    try {
      const mongoUsers = await User.find({}).select('-password').sort({ createdAt: -1 });
      
      if (mongoUsers && mongoUsers.length >= 0) {
        return res.json({
          total: mongoUsers.length,
          users: mongoUsers.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            isActive: u.isActive,
            createdAt: u.createdAt
          })),
          storage: 'mongodb',
          note: '🎉 Connected to MongoDB Atlas! User data is permanently stored.'
        });
      }
    } catch (dbError) {
      // Fallback to in-memory
      console.log('MongoDB not available, using memory storage');
    }
    
    // Fallback: Return in-memory users
    const usersWithoutPasswords = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt
    }));
    
    res.json({
      total: users.length,
      users: usersWithoutPasswords,
      storage: 'memory',
      note: '⚠️ Temporary storage - User data will reset on server restart'
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users', 
      message: error.message 
    });
  }
});

// Export router and middleware
module.exports = {
  router,
  authenticateToken,
  optionalAuth,
  requireAdmin
};
