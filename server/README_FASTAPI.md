# FastAPI Backend README

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd server
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `MONGODB_URI`: Your MongoDB connection string (optional for testing)
- `JWT_SECRET`: A secure random string for JWT tokens
- `PORT`: Server port (default: 5000)

### 3. Run the Server

**Development mode (with auto-reload):**
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

**Production mode:**
```bash
uvicorn main:app --host 0.0.0.0 --port 5000 --workers 4
```

### 4. Access the API

- **API Base URL:** http://localhost:5000/api
- **Interactive Docs (Swagger):** http://localhost:5000/docs
- **Alternative Docs (ReDoc):** http://localhost:5000/redoc
- **Health Check:** http://localhost:5000/api/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/users` - Get all users (admin only)

### Books
- `POST /api/books/upload` - Upload book file
- `GET /api/books` - Get all books
- `GET /api/books/my-books` - Get user's books
- `GET /api/books/{id}` - Get book by ID
- `GET /api/books/{id}/text` - Get raw text
- `DELETE /api/books/{id}` - Delete book

### Summaries
- `POST /api/summaries/upload` - Upload file for text extraction
- `GET /api/summaries` - Get all summaries
- `GET /api/summaries/{id}` - Get summary by ID
- `POST /api/summaries` - Create new summary
- `PUT /api/summaries/{id}` - Update summary
- `DELETE /api/summaries/{id}` - Delete summary
- `GET /api/summaries/book/{book_id}` - Get summaries for a book

## Features

✅ **FastAPI Framework** - Modern, fast Python web framework
✅ **Automatic API Documentation** - Swagger UI and ReDoc
✅ **MongoDB Integration** - Using Motor (async driver)
✅ **JWT Authentication** - Secure token-based auth
✅ **File Upload & Processing** - PDF, DOCX, TXT support
✅ **Password Hashing** - bcrypt for security
✅ **Type Validation** - Pydantic models
✅ **CORS Enabled** - For frontend integration
✅ **Memory Fallback** - Works without MongoDB for testing

## Project Structure

```
server/
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
├── .env.example        # Environment variables template
├── models/             # Pydantic models
│   ├── user.py
│   ├── book.py
│   ├── summary.py
│   └── raw_text.py
├── routes/             # API routes
│   ├── auth.py
│   ├── books.py
│   └── summaries.py
├── utils/              # Utility functions
│   ├── auth.py         # JWT and password utilities
│   └── file_extractor.py  # File processing
├── uploads/            # Temporary file storage
└── public/             # Static files
```

## MongoDB Setup (Optional)

The backend works in memory mode without MongoDB for testing.

**To enable MongoDB:**

1. Install MongoDB locally or use MongoDB Atlas
2. Update `MONGODB_URI` in `.env` file
3. Restart the server

**MongoDB Atlas (Cloud):**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/book-summarization
```

**Local MongoDB:**
```
MONGODB_URI=mongodb://localhost:27017/book-summarization
```

## Migration from Express

This FastAPI backend is a complete replacement for the Node.js/Express backend:

**Migrated from:**
- Express → FastAPI
- Mongoose → Motor (async MongoDB driver)
- bcryptjs → passlib with bcrypt
- jsonwebtoken → python-jose
- mammoth + pdf-parse → python-docx + PyPDF2
- multer → FastAPI's UploadFile

**Improvements:**
- ⚡ Faster performance with async/await
- 📚 Automatic interactive API documentation
- 🔒 Better type safety with Pydantic
- 🐍 Python ecosystem for AI/ML integration
- 🎯 Cleaner code structure

## Troubleshooting

**Import errors:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Port already in use:**
```bash
# Change PORT in .env or use different port:
uvicorn main:app --port 5001
```

**MongoDB connection issues:**
- The server works without MongoDB (memory mode)
- Check MongoDB is running: `mongod --version`
- Verify connection string in `.env`
