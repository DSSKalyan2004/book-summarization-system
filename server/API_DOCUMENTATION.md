# Book Summarization Platform - API Documentation

## Database Schema

### 1. Users Collection
```javascript
{
  _id: ObjectId,
  name: String (required, 2-100 chars),
  email: String (required, unique, validated),
  password: String (required, hashed, min 6 chars),
  role: String (enum: 'admin' | 'user', default: 'user'),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Books Collection
```javascript
{
  _id: ObjectId,
  title: String (required, 1-500 chars),
  author: String (required, max 200 chars),
  uploaded_by: ObjectId (ref: User, required),
  upload_date: Date (default: now),
  genre: String (max 100 chars),
  publication_year: Number (1000 - current year),
  pages: Number (min 1),
  original_filename: String,
  file_size: Number,
  file_type: String (enum: 'pdf' | 'docx' | 'txt'),
  is_processed: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### 3. RawText Collection
```javascript
{
  _id: ObjectId,
  book_id: ObjectId (ref: Book, required, unique),
  full_text: String (required),
  word_count: Number (auto-calculated),
  character_count: Number (auto-calculated),
  extraction_method: String (enum: 'pdf' | 'docx' | 'txt' | 'manual'),
  extraction_date: Date (default: now),
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Summaries Collection
```javascript
{
  _id: ObjectId,
  book_id: ObjectId (ref: Book, required),
  summary_text: String (required, min 10 chars),
  summary_type: String (enum: 'short' | 'detailed', required),
  key_insights: [String],
  word_count: Number (auto-calculated),
  generated_by: ObjectId (ref: User),
  generation_date: Date (default: now),
  ai_model: String (default: 'gemini-1.5-flash'),
  language: String (default: 'en'),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "user" // optional, defaults to 'user'
}

Response 201:
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "jwt-token-here"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response 200:
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "jwt-token-here"
}
```

#### Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <token>

Response 200:
{
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true
  }
}
```

#### Update Profile
```http
PUT /api/auth/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "email": "newemail@example.com"
}
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

#### Get All Users (Admin Only)
```http
GET /api/auth/users
Authorization: Bearer <admin-token>

Response 200:
{
  "count": 5,
  "users": [...]
}
```

#### Update User (Admin Only)
```http
PUT /api/auth/users/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "admin",
  "isActive": true
}
```

#### Delete User (Admin Only)
```http
DELETE /api/auth/users/:id
Authorization: Bearer <admin-token>
```

### Books Routes (`/api/books`)

#### Upload Book
```http
POST /api/books/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- file: [PDF/DOCX/TXT file]
- title: "Book Title"
- author: "Author Name"
- genre: "Fiction" (optional)
- publication_year: "2024" (optional)
- pages: "300" (optional)

Response 201:
{
  "message": "Book uploaded and processed successfully",
  "book": {
    "id": "...",
    "title": "Book Title",
    "author": "Author Name",
    "upload_date": "2024-01-01T00:00:00.000Z",
    "file_size": 1234567,
    "word_count": 50000
  }
}
```

#### Get All Books
```http
GET /api/books?search=keyword&sort=-upload_date&limit=50&page=1
Authorization: Bearer <token>

Response 200:
{
  "books": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "pages": 2
  }
}
```

#### Get My Books
```http
GET /api/books/my-books
Authorization: Bearer <token>

Response 200:
{
  "count": 5,
  "books": [...]
}
```

#### Get Single Book
```http
GET /api/books/:id
Authorization: Bearer <token>

Response 200:
{
  "book": {...},
  "textInfo": {
    "word_count": 50000,
    "character_count": 250000,
    "extraction_method": "pdf"
  },
  "summariesCount": 2
}
```

#### Get Book Full Text
```http
GET /api/books/:id/text
Authorization: Bearer <token>

Response 200:
{
  "book_id": "...",
  "title": "Book Title",
  "full_text": "Full text content...",
  "word_count": 50000,
  "character_count": 250000
}
```

#### Update Book Metadata
```http
PUT /api/books/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "author": "Updated Author",
  "genre": "Non-Fiction"
}
```

#### Delete Book
```http
DELETE /api/books/:id
Authorization: Bearer <token>

Response 200:
{
  "message": "Book and all associated data deleted successfully",
  "bookId": "..."
}
```

#### Get Book Summaries
```http
GET /api/books/:id/summaries
Authorization: Bearer <token>

Response 200:
{
  "book_id": "...",
  "title": "Book Title",
  "summaries_count": 2,
  "summaries": [...]
}
```

### Summaries Routes (`/api/summaries`)

#### Get All Summaries
```http
GET /api/summaries?summary_type=short&limit=50&page=1
Authorization: Bearer <token>

Response 200:
{
  "summaries": [...],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

#### Get Single Summary
```http
GET /api/summaries/:id
Authorization: Bearer <token>

Response 200:
{
  "_id": "...",
  "book_id": {
    "title": "Book Title",
    "author": "Author Name"
  },
  "summary_text": "Summary content...",
  "summary_type": "short",
  "key_insights": ["insight 1", "insight 2"],
  "word_count": 150,
  "generated_by": {
    "name": "John Doe"
  },
  "generation_date": "2024-01-01T00:00:00.000Z"
}
```

#### Create Summary
```http
POST /api/summaries
Authorization: Bearer <token>
Content-Type: application/json

{
  "book_id": "book-id-here",
  "summary_text": "This is a summary of the book...",
  "summary_type": "short",
  "key_insights": ["Key point 1", "Key point 2"],
  "ai_model": "gemini-1.5-flash",
  "language": "en"
}

Response 201:
{
  "message": "Summary created successfully",
  "summary": {...}
}
```

#### Update Summary
```http
PUT /api/summaries/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "summary_text": "Updated summary...",
  "summary_type": "detailed",
  "key_insights": ["Updated insight"]
}
```

#### Delete Summary
```http
DELETE /api/summaries/:id
Authorization: Bearer <token>

Response 200:
{
  "message": "Summary deleted successfully",
  "summaryId": "..."
}
```

#### Get Summaries by Book
```http
GET /api/summaries/book/:bookId
Authorization: Bearer <token>

Response 200:
{
  "book_id": "...",
  "count": 2,
  "summaries": [...]
}
```

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained from:
- `/api/auth/register`
- `/api/auth/login`

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields",
  "required": ["field1", "field2"]
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong!",
  "message": "Detailed error message"
}
```

## Setup Instructions

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Create `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update environment variables in `.env`:
   - Set `MONGODB_URI` to your MongoDB connection string
   - Set `JWT_SECRET` to a secure random string
   - Configure other settings as needed

4. Start the server:
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

## Database Indexes

The following indexes are created for optimal performance:

### Users
- `email` (unique)
- `role`

### Books
- `title, author` (full-text search)
- `uploaded_by`
- `upload_date` (descending)
- `is_processed`

### RawText
- `book_id` (unique)
- `extraction_date` (descending)

### Summaries
- `book_id, summary_type` (compound)
- `generation_date` (descending)
- `summary_type`

## Features

### User Management
- ✅ User registration with email validation
- ✅ Secure password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ Role-based access control (admin/user)
- ✅ User profile management
- ✅ Password change functionality
- ✅ Admin user management

### Book Management
- ✅ File upload (PDF, DOCX, TXT)
- ✅ Text extraction from uploaded files
- ✅ Book metadata management
- ✅ Full-text search
- ✅ Pagination and sorting
- ✅ User ownership tracking
- ✅ Cascade deletion (deletes related text and summaries)

### Summary Management
- ✅ Create summaries (short/detailed)
- ✅ Key insights extraction
- ✅ Word count calculation
- ✅ AI model tracking
- ✅ Multi-language support
- ✅ User attribution
- ✅ Filter by summary type

### Security Features
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Protected routes with middleware
- ✅ Role-based authorization
- ✅ User ownership validation
- ✅ Input validation and sanitization
