# Book Summarization Platform - Backend Server

A professional Node.js/Express backend with MongoDB for the Intelligent Book Summarization Platform.

## Features

### 📚 Core Functionality
- **User Authentication & Authorization** - JWT-based auth with role management
- **Book Management** - Upload, store, and manage books (PDF, DOCX, TXT)
- **Text Extraction** - Automatic text extraction from uploaded files
- **Summary Management** - Create and manage book summaries (short/detailed)
- **Search & Filter** - Full-text search and advanced filtering

### 🔒 Security
- Bcrypt password hashing
- JWT token authentication
- Role-based access control (Admin/User)
- Protected API endpoints
- Input validation and sanitization

### 🗄️ Database Schema
- **Users** - User accounts with authentication
- **Books** - Book metadata and file information
- **RawText** - Extracted full text from books
- **Summaries** - AI-generated summaries with types

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB 4.4+ (local or Atlas)

### Installation

1. **Clone and navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/book-summarization
   PORT=5000
   JWT_SECRET=your-secure-random-secret-key
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

   **Generate a secure JWT secret:**
   ```bash
   # Linux/Mac
   openssl rand -base64 32
   
   # Windows PowerShell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```

5. **Start the server:**
   ```bash
   # Production
   npm start
   
   # Development (with auto-reload)
   npm run dev
   ```

6. **Verify server is running:**
   ```bash
   curl http://localhost:5000/api/health
   ```

## Project Structure

```
server/
├── models/              # Mongoose models
│   ├── User.js         # User model with authentication
│   ├── Book.js         # Book metadata model
│   ├── RawText.js      # Extracted text storage
│   └── Summary.js      # Book summaries model
├── routes/             # API route handlers
│   ├── auth.js         # Authentication & user management
│   ├── books.js        # Book upload & management
│   └── summaries.js    # Summary CRUD operations
├── utils/              # Utility functions
│   └── fileExtractor.js # Text extraction utilities
├── uploads/            # Temporary file storage (auto-created)
├── index.js            # Server entry point
├── package.json        # Dependencies
├── .env.example        # Environment variables template
├── API_DOCUMENTATION.md # Complete API reference
└── MIGRATION_GUIDE.md  # Migration from old schema
```

## API Overview

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login user
GET    /api/auth/me                # Get current user
PUT    /api/auth/me                # Update profile
PUT    /api/auth/change-password   # Change password
GET    /api/auth/users             # Get all users (admin)
PUT    /api/auth/users/:id         # Update user (admin)
DELETE /api/auth/users/:id         # Delete user (admin)
```

### Book Endpoints
```
POST   /api/books/upload           # Upload & extract book
GET    /api/books                  # Get all books (paginated)
GET    /api/books/my-books         # Get user's books
GET    /api/books/:id              # Get book details
GET    /api/books/:id/text         # Get book full text
PUT    /api/books/:id              # Update book metadata
DELETE /api/books/:id              # Delete book & related data
GET    /api/books/:id/summaries    # Get book's summaries
```

### Summary Endpoints
```
GET    /api/summaries              # Get all summaries (paginated)
GET    /api/summaries/:id          # Get single summary
POST   /api/summaries              # Create summary
PUT    /api/summaries/:id          # Update summary
DELETE /api/summaries/:id          # Delete summary
GET    /api/summaries/book/:bookId # Get summaries by book
```

## Usage Examples

### 1. Register and Login

```javascript
// Register
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'securePass123'
  })
});

const { token, user } = await response.json();
localStorage.setItem('token', token);
```

### 2. Upload a Book

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('title', 'The Great Book');
formData.append('author', 'John Author');
formData.append('genre', 'Fiction');

const response = await fetch('http://localhost:5000/api/books/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { book } = await response.json();
```

### 3. Create a Summary

```javascript
const response = await fetch('http://localhost:5000/api/summaries', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    book_id: book.id,
    summary_text: 'This book is about...',
    summary_type: 'short',
    key_insights: ['Key point 1', 'Key point 2']
  })
});
```

### 4. Get All Books with Search

```javascript
const response = await fetch(
  'http://localhost:5000/api/books?search=fiction&limit=20&page=1',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { books, pagination } = await response.json();
```

## Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'admin' | 'user',
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Book Model
```javascript
{
  title: String,
  author: String,
  uploaded_by: ObjectId (ref: User),
  upload_date: Date,
  genre: String,
  publication_year: Number,
  pages: Number,
  original_filename: String,
  file_size: Number,
  file_type: 'pdf' | 'docx' | 'txt',
  is_processed: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### RawText Model
```javascript
{
  book_id: ObjectId (ref: Book, unique),
  full_text: String,
  word_count: Number (auto-calculated),
  character_count: Number (auto-calculated),
  extraction_method: 'pdf' | 'docx' | 'txt' | 'manual',
  extraction_date: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Summary Model
```javascript
{
  book_id: ObjectId (ref: Book),
  summary_text: String,
  summary_type: 'short' | 'detailed',
  key_insights: [String],
  word_count: Number (auto-calculated),
  generated_by: ObjectId (ref: User),
  generation_date: Date,
  ai_model: String,
  language: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Dependencies

### Production Dependencies
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **multer** - File upload handling
- **pdf-parse** - PDF text extraction
- **mammoth** - DOCX text extraction
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables

### Development Dependencies
- **nodemon** - Auto-reload during development

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/book-summarization` | Yes |
| `PORT` | Server port | `5000` | No |
| `JWT_SECRET` | Secret key for JWT | - | Yes |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` | No |
| `NODE_ENV` | Environment mode | `development` | No |

## Scripts

```bash
# Start server
npm start

# Start with auto-reload (development)
npm run dev

# Install dependencies
npm install
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Security Best Practices

1. **Always use HTTPS in production**
2. **Change JWT_SECRET to a strong random value**
3. **Use environment variables for sensitive data**
4. **Keep dependencies updated**
5. **Enable MongoDB authentication**
6. **Implement rate limiting for production**
7. **Validate and sanitize all inputs**

## Performance Optimization

- Database indexes on frequently queried fields
- Pagination for large result sets
- File size limits (50MB max)
- Automatic cleanup of temporary files
- Connection pooling with Mongoose

## Monitoring & Logging

- Console logging for important operations
- Error stack traces in development
- Health check endpoint: `/api/health`

## Testing

```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Migration Guide](./MIGRATION_GUIDE.md) - Upgrade from old schema

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB (if installed locally)
mongod

# Or use MongoDB Atlas (cloud)
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=5001

# Or kill the process using port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill
```

### JWT Token Issues
- Ensure JWT_SECRET is set in .env
- Check token expiration
- Verify Authorization header format: `Bearer <token>`

## Contributing

1. Follow existing code structure
2. Use consistent naming conventions
3. Add error handling
4. Update documentation
5. Test endpoints before committing

## License

MIT

## Support

For issues and questions:
- Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- Review server logs
- Verify MongoDB connection
- Check environment variables
