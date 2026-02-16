# Intelligent Book Summarization Platform

An AI-powered platform for generating professional book summaries using BERT model with MongoDB backend storage.

## Features

- 📚 AI-powered book summarization using BERT
- 📝 Support for PDF, DOCX, TXT files, and direct text input
- 🌐 URL content extraction and summarization
- 💾 MongoDB backend for persistent storage
- 📊 Summary history tracking
- 🔍 Key insights extraction
- 📥 Export summaries to text files

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- Transformers.js (BERT model)
- Lucide React Icons

### Backend
- Node.js + Express
- MongoDB + Mongoose
- CORS enabled

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
cd intelligent-book-summarization-platform
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

### 4. Configure Environment Variables

Create or update `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:5000/api
```

Create or update `.env` file in the `server` directory:
```env
MONGODB_URI=mongodb://localhost:27017/book-summarization
PORT=5000
NODE_ENV=development
```

## Running the Application

### Option 1: Run Frontend and Backend Separately

**Terminal 1 - Start MongoDB (if running locally):**
```bash
mongod
```

**Terminal 2 - Start Backend Server:**
```bash
cd server
npm run dev
```

**Terminal 3 - Start Frontend:**
```bash
npm run dev
```

### Option 2: Using MongoDB Atlas (Cloud)

If using MongoDB Atlas, update the `MONGODB_URI` in `server/.env`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/book-summarization
```

## API Endpoints

### Summaries
- `GET /api/summaries` - Get all summaries
- `GET /api/summaries/:id` - Get summary by ID
- `POST /api/summaries` - Create new summary
- `PUT /api/summaries/:id` - Update summary
- `DELETE /api/summaries/:id` - Delete summary

### Health Check
- `GET /api/health` - Server health check

## Usage

1. Open the application in your browser (default: `http://localhost:5173`)
2. Choose input method:
   - **Text**: Paste text directly
   - **File**: Upload PDF, DOCX, or TXT files
   - **URL**: Enter a webpage URL
3. Add optional metadata (title, author, etc.)
4. Click "Generate Summary"
5. View and export your summary
6. Access previous summaries in the History section

## Project Structure

```
intelligent-book-summarization-platform/
├── components/           # React components
│   ├── Sidebar.tsx
│   └── HistoryList.tsx
├── services/            # Service layer
│   ├── summarizer.ts   # AI summarization logic
│   └── api.ts          # API client for backend
├── server/             # Backend server
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   └── index.js        # Server entry point
├── App.tsx             # Main application component
├── types.ts            # TypeScript type definitions
├── constants.tsx       # App constants
└── package.json        # Dependencies
```

## Model Information

**BERT (Xenova/all-MiniLM-L6-v2)**
- BERT-based model for semantic understanding
- Optimized for sentence embeddings and feature extraction
- Extractive summarization approach (selects key sentences)
- Runs entirely in browser
- ~23MB model size (cached after first load)
- No API costs, privacy-focused
- Fast inference and low memory footprint

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check `MONGODB_URI` in `server/.env`
- Verify network connectivity for MongoDB Atlas

### CORS Errors
- Ensure backend is running on port 5000
- Check `VITE_API_URL` in frontend `.env`

### Model Loading Issues
- Clear browser cache
- Check internet connection (first load only)
- Ensure sufficient browser storage

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
