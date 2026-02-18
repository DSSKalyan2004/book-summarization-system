# Migration Guide: Old Schema to Professional Schema

## Overview

This guide helps you migrate from the old simple schema to the new professional database structure.

## Schema Changes

### Old Schema
- **Summary** - Single collection with embedded metadata

### New Professional Schema
1. **Users** - User authentication and authorization
2. **Books** - Book metadata and file information
3. **RawText** - Extracted text from books
4. **Summaries** - Book summaries with type classification

## Migration Steps

### Step 1: Install New Dependencies

```bash
cd server
npm install bcryptjs jsonwebtoken
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the `server` directory:

```env
MONGODB_URI=mongodb://localhost:27017/book-summarization
PORT=5000
JWT_SECRET=your-secure-secret-key-here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

**Important:** Generate a secure JWT_SECRET:
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Step 3: Create Default Admin User (Optional)

After starting the server, create an admin user via API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "securePassword123",
    "role": "admin"
  }'
```

Save the returned JWT token for admin operations.

### Step 4: Migrate Existing Data (If Any)

If you have existing summaries in the old format, you need to:

1. **Create a User Account** for the uploader:
   ```javascript
   // Example: Create a default user for old summaries
   const defaultUser = await User.create({
     name: "Legacy User",
     email: "legacy@example.com",
     password: "changeMe123",
     role: "user"
   });
   ```

2. **Convert Old Summaries to New Schema**:
   ```javascript
   // Migration script example
   const oldSummaries = await OldSummary.find({});
   
   for (const oldSummary of oldSummaries) {
     // Create Book
     const book = await Book.create({
       title: oldSummary.title,
       author: oldSummary.metadata?.author || "Unknown",
       uploaded_by: defaultUser._id,
       upload_date: oldSummary.timestamp || new Date(),
       genre: oldSummary.metadata?.genre,
       publication_year: oldSummary.metadata?.publicationYear,
       pages: oldSummary.metadata?.pages,
       is_processed: true
     });
     
     // Create RawText (if you have the original text)
     await RawText.create({
       book_id: book._id,
       full_text: oldSummary.content || "", // Use content as text if available
       extraction_method: 'manual'
     });
     
     // Create Summary
     await Summary.create({
       book_id: book._id,
       summary_text: oldSummary.content,
       summary_type: 'short', // Determine based on word count
       key_insights: oldSummary.keyInsights || [],
       generated_by: defaultUser._id,
       generation_date: oldSummary.timestamp || new Date()
     });
   }
   ```

### Step 5: Update Frontend API Calls

Update your frontend to use the new API structure:

#### Old Upload Flow:
```javascript
// Old - Direct summary creation
const response = await fetch('/api/summaries/upload', {
  method: 'POST',
  body: formData
});
```

#### New Upload Flow:
```javascript
// New - Upload book with authentication
const token = localStorage.getItem('token');

// 1. Upload book and extract text
const uploadResponse = await fetch('/api/books/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData // Contains: file, title, author, etc.
});

const { book } = await uploadResponse.json();

// 2. Get extracted text
const textResponse = await fetch(`/api/books/${book.id}/text`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { full_text } = await textResponse.json();

// 3. Generate summary using AI
const summaryText = await generateSummary(full_text);

// 4. Save summary
const saveSummaryResponse = await fetch('/api/summaries', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    book_id: book.id,
    summary_text: summaryText,
    summary_type: 'short',
    key_insights: extractedInsights
  })
});
```

### Step 6: Update Frontend Authentication

Add login/register functionality:

```javascript
// Register
const registerUser = async (name, email, password) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email, password })
  });
  
  const { token, user } = await response.json();
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  return { token, user };
};

// Login
const loginUser = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const { token, user } = await response.json();
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  return { token, user };
};

// Get current user
const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const { user } = await response.json();
  return user;
};
```

### Step 7: Add Authorization to All API Calls

```javascript
const token = localStorage.getItem('token');

const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }
  
  return response.json();
};
```

## Breaking Changes

### 1. Authentication Required
- All endpoints now require authentication
- Must include JWT token in Authorization header
- Frontend must implement login/register

### 2. Summary Schema Changes
- `id` → `_id` (MongoDB default)
- `title` → Moved to `Book` model
- `content` → `summary_text`
- `metadata` → Moved to `Book` model
- `timestamp` → `generation_date`
- `keyInsights` → `key_insights`
- `wordCount` → `word_count` (auto-calculated)

### 3. New Required Fields
- `book_id` - Reference to the book
- `summary_type` - Must be 'short' or 'detailed'
- `uploaded_by` - Reference to the user (in Book model)

### 4. File Upload Changes
- Moved from `/api/summaries/upload` to `/api/books/upload`
- Requires book metadata (title, author)
- Returns book object instead of summary

### 5. API Response Structure
- More consistent error messages
- Pagination added to list endpoints
- Population of related documents

## Testing the Migration

### 1. Test Authentication
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### 2. Test Book Upload
```bash
# Upload book (replace TOKEN with your JWT)
curl -X POST http://localhost:5000/api/books/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@path/to/book.pdf" \
  -F "title=Test Book" \
  -F "author=Test Author"
```

### 3. Test Summary Creation
```bash
# Create summary (replace TOKEN and BOOK_ID)
curl -X POST http://localhost:5000/api/summaries \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": "BOOK_ID",
    "summary_text": "This is a test summary",
    "summary_type": "short",
    "key_insights": ["Insight 1", "Insight 2"]
  }'
```

## Rollback Plan

If you need to rollback:

1. Keep a backup of your old database
2. The old code is preserved in git history
3. Restore from backup and checkout old code:
   ```bash
   git checkout <old-commit-hash>
   mongorestore --db book-summarization backup/
   ```

## Benefits of New Schema

✅ **Better Data Organization**: Separation of concerns (users, books, text, summaries)
✅ **User Authentication**: Secure login and user management
✅ **User Attribution**: Track who uploaded which books
✅ **Multiple Summaries**: Support multiple summary types per book
✅ **Better Search**: Full-text search on books
✅ **Scalability**: Professional structure for future features
✅ **Security**: JWT-based authentication, password hashing
✅ **Access Control**: Role-based permissions (admin/user)

## Support

If you encounter issues during migration, refer to:
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for endpoint details
- Check server logs for detailed error messages
- Verify MongoDB connection and indexes
