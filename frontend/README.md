# 📚 Intelligent Book Summarization Platform

<div align="center">

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.68-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.7+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**An AI-powered full-stack web application that transforms books, documents, and web pages into professional summaries using a BERT-based deep learning model — running entirely in your browser.**

[Features](#-features) • [Tech Stack](#-technology-stack) • [BERT Model](#-bert-model--ai-engine) • [Getting Started](#-getting-started) • [API Docs](#-api-endpoints)

</div>

---

## Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Database](#database)
- [BERT Model & AI Engine](#-bert-model--ai-engine)
  - [Model Details](#model-details)
  - [What is BERT?](#what-is-bert)
  - [How Summarization Works](#how-summarization-works-in-this-app)
  - [Why Browser-Side AI?](#why-browser-side-ai-no-server-gpu)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Authentication](#-authentication)
- [User Roles](#-user-roles)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Summarization** | BERT-based DistilBART model generates concise, structured summaries with key bullet points |
| 📄 **Multi-format Upload** | Supports PDF, DOCX, and TXT file uploads with server-side text extraction |
| 🌐 **URL Extraction** | Fetches and parses web page content through CORS proxies |
| 💾 **Permanent History** | Every summary is saved to MongoDB — accessible from any device, forever |
| 🔐 **JWT Authentication** | Secure login/signup with bcrypt-hashed passwords |
| 👥 **Admin Dashboard** | Admins can view and manage all registered users |
| 📤 **Export** | Download summaries as `.txt` or copy to clipboard |
| 📱 **Responsive UI** | Clean dark theme, works on desktop and mobile |

---

## 🛠 Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18 | UI component library |
| **TypeScript** | 5 | Type-safe JavaScript |
| **Vite** | 5 | Build tool and dev server |
| **Tailwind CSS** | 3 | Utility-first styling framework |
| **Transformers.js** | 2 | Run BERT AI model directly in the browser |
| **Lucide React** | latest | Icon library |

**Key Frontend Details:**
- Built with React functional components and hooks (`useState`, `useEffect`)
- Vite provides fast HMR (Hot Module Replacement) during development
- Tailwind CSS with custom utility classes for the dark premium theme
- Transformers.js loads the BERT model (`Xenova/distilbart-cnn-6-6`) in a Web Worker — no server round-trip needed for summarization
- `localStorage` used as an offline cache; MongoDB is the source of truth for history

---

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.7+ | Backend language |
| **FastAPI** | 0.68 | High-performance async REST API framework |
| **Uvicorn** | 0.15 | ASGI server to run FastAPI |
| **Pydantic** | 1.10 | Data validation and serialization |
| **python-jose** | 3.3 | JWT token creation and verification |
| **passlib + bcrypt** | 1.7 | Secure password hashing |
| **python-multipart** | 0.0.5 | File upload handling |
| **PyPDF2** | 1.26 | PDF text extraction |
| **python-docx** | 0.8 | DOCX text extraction |
| **python-dotenv** | 0.19 | Environment variable management |

**Key Backend Details:**
- FastAPI auto-generates interactive API docs at `http://localhost:5000/docs`
- All routes are async using Python's `asyncio`
- JWT tokens expire after 7 days (configurable in `.env`)
- File uploads are processed in memory, saved temporarily, text is extracted, then the file is deleted
- CORS is fully open (`allow_origins=["*"]`) for development — restrict in production

---

### Database

| Technology | Purpose |
|---|---|
| **MongoDB Atlas** | Cloud-hosted NoSQL database (free M0 tier) |
| **Motor** | Async MongoDB driver for Python (used with FastAPI) |
| **PyMongo** | Synchronous MongoDB driver (used for admin utilities) |

**Collections:**

| Collection | Description |
|---|---|
| `users` | Stores user accounts (name, email, hashed password, role, timestamps) |
| `summaries` | General summaries collection (legacy/admin use) |
| `user_histories` | Per-user permanent summary history — each document linked to a `userId` |

**Why MongoDB?**
- Schema-flexible — summary documents can store arrays (bullet points, paragraphs) without migrations
- MongoDB Atlas provides free cloud hosting with automatic backups
- Motor's async driver integrates perfectly with FastAPI's async architecture

---

### AI / Machine Learning

| Technology | Purpose |
|---|---|
| **Transformers.js** | Runs Hugging Face BERT models directly in the browser via WebAssembly |
| **DistilBART CNN** | `Xenova/distilbart-cnn-6-6` — abstractive summarization model |

---

## 🧠 BERT Model & AI Engine

This platform uses **DistilBART** — a distilled version of the BART (Bidirectional and Auto-Regressive Transformer) model, which itself builds upon BERT's encoder architecture.

### Model Details

| Property | Value |
|---|---|
| **Model ID** | `Xenova/distilbart-cnn-6-6` |
| **Source** | [Hugging Face Model Hub](https://huggingface.co/Xenova/distilbart-cnn-6-6) |
| **Architecture** | DistilBART (6-layer encoder + 6-layer decoder) |
| **Original Training Data** | CNN / DailyMail news articles dataset |
| **Task** | Abstractive text summarization (seq2seq) |
| **Inference Runtime** | [Transformers.js](https://huggingface.co/docs/transformers.js) v2 via WebAssembly |
| **Runs In** | Browser — no server GPU required |
| **Model Size** | ~230 MB (auto-cached in IndexedDB after first load) |

### What is BERT?

**BERT** (Bidirectional Encoder Representations from Transformers) is a transformer-based language model developed by Google in 2018. Unlike earlier models that read text left-to-right only, BERT uses a **masked self-attention mechanism** to read text in **both directions simultaneously** — allowing it to understand the full context of every word based on all surrounding words.

**BART** (Lewis et al., 2019) extends BERT by pairing BERT's bidirectional encoder with an **autoregressive decoder**. This encoder-decoder (seq2seq) design is purpose-built for **text-generation tasks** like summarization, where the model reads a full document and generates a new, shorter version in its own words — not just selecting existing sentences.

**DistilBART** applies **knowledge distillation** to BART: a smaller student model is trained to mimic the outputs of the larger BART teacher, retaining ~97% of performance at roughly half the parameters. The `cnn-6-6` variant uses 6 encoder layers and 6 decoder layers (down from 12+12 in full BART-large).

### How Summarization Works in This App

```
User Input (Text / PDF / DOCX / URL)
         │
         ▼
  ┌─────────────────────────────┐
  │     Text Extraction         │
  │  PDF → PyPDF2 (server)      │
  │  DOCX → python-docx         │
  │  URL → fetch + DOM parse    │
  └────────────┬────────────────┘
               │
               ▼
  ┌─────────────────────────────┐
  │     Text Chunking           │
  │  Splits into ≤1024 token    │
  │  segments for model window  │
  └────────────┬────────────────┘
               │
               ▼
  ┌─────────────────────────────────────────────┐
  │    Transformers.js Web Worker (browser)      │
  │                                             │
  │  BERT Encoder: builds contextual embeddings │
  │       ↓                                     │
  │  BART Decoder: generates summary tokens     │
  │  (beam search, repetition penalty applied)  │
  └────────────────┬────────────────────────────┘
                   │
                   ▼
  ┌─────────────────────────────┐
  │     Post-processing         │
  │  Paragraph formatting       │
  │  Bullet point extraction    │
  │  Key insight highlighting   │
  └────────────┬────────────────┘
               │
               ▼
  Result displayed + saved to MongoDB
```

### Why Browser-Side AI (No Server GPU)?

| Benefit | Detail |
|---|---|
| **Zero API cost** | No OpenAI / Anthropic billing — runs 100% locally |
| **Privacy** | Your text never leaves your browser for processing |
| **Offline support** | Works after first load with no internet |
| **No latency** | No round-trip to a cloud GPU server |
| **No API keys** | Model downloaded once from Hugging Face CDN |

### Approximate Performance

| Input Length | Expected Summary | Inference Time |
|---|---|---|
| Short (< 500 words) | 2–4 sentences | ~2–5 sec |
| Medium (500–2000 words) | 4–8 sentences | ~5–15 sec |
| Long (2000+ words) | Batched chunks, merged | ~15–45 sec |

> **First load only:** The ~230 MB model is downloaded from the Hugging Face CDN and cached in the browser's IndexedDB. All subsequent runs are instant with no download.

---

## 📁 Project Structure

```
Intelligent-Book-Summarization-Platform/
├── App.tsx                  # Main React app, routing, state management
├── constants.tsx            # Nav items, app name constants
├── index.tsx                # React entry point
├── index.html               # HTML shell
├── index.css                # Global styles + Tailwind directives
├── types.ts                 # TypeScript interfaces and enums
├── vite.config.ts           # Vite build configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Frontend dependencies
│
├── components/
│   ├── Auth.tsx             # Login, Sign Up, Admin Login modal
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── HistoryList.tsx      # Summary history list UI
│   └── UsersList.tsx        # Admin users management page
│
├── services/
│   ├── api.ts               # All API calls (auth, summaries, history)
│   └── summarizer.ts        # BERT summarization logic (Transformers.js)
│
└── server/
    ├── main.py              # FastAPI app entry point, CORS, startup/shutdown
    ├── requirements.txt     # Python dependencies
    ├── .env                 # Environment variables (MongoDB URI, JWT secret)
    │
    ├── models/
    │   ├── user.py          # User Pydantic model
    │   ├── book.py          # Book Pydantic model
    │   ├── summary.py       # Summary Pydantic model
    │   └── raw_text.py      # Raw text Pydantic model
    │
    ├── routes/
    │   ├── auth.py          # /api/auth/* — login, register, users list
    │   ├── summaries.py     # /api/summaries/* — CRUD + user history endpoints
    │   └── books.py         # /api/books/* — book management
    │
    └── utils/
        ├── auth.py          # JWT creation/verification, password hashing
        └── file_extractor.py # PDF, DOCX, TXT text extraction logic
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16 or higher (for frontend)
- **Python** 3.7 or higher (for backend)
- **MongoDB Atlas** account (free) — or a local MongoDB instance

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/DSSKalyan2004/Intelligent-Book-Summarization-Platform-.git
cd Intelligent-Book-Summarization-Platform-
```

**2. Install frontend dependencies**
```bash
npm install
```

**3. Create Python virtual environment and install backend dependencies**
```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

pip install -r server/requirements.txt
```

**4. Configure environment variables**

Edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/book-summarization
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=yourpassword
ADMIN_NAME=Admin
```

### Running the App

**Start the backend (FastAPI):**
```bash
cd server
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

**Start the frontend (Vite):**
```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

FastAPI docs available at: `http://localhost:5000/docs`

---

## 🔑 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string | — |
| `JWT_SECRET` | Secret key for signing JWT tokens | — |
| `JWT_EXPIRES_IN` | Token expiry duration (`7d`, `24h`) | `7d` |
| `ADMIN_EMAIL` | Email for the default admin account | — |
| `ADMIN_PASSWORD` | Password for the default admin account | — |
| `ADMIN_NAME` | Display name for the admin | `Admin` |

---

## 📡 API Endpoints

### Authentication — `/api/auth`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and get JWT token | No |
| GET | `/api/auth/users` | Get all users (admin only) | Admin |

### User History — `/api/summaries`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/summaries/my/all` | Get all summaries for logged-in user | Yes |
| POST | `/api/summaries/my/save` | Save a summary to user's history | Yes |
| DELETE | `/api/summaries/my/{id}` | Delete a summary from user's history | Yes |

### File Upload

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/summaries/upload` | Upload PDF/DOCX/TXT and extract text | No |

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server and database status |

---

## 🔐 Authentication

- Passwords are hashed using **bcrypt** before storage — plain text passwords are never saved
- JWT tokens are signed with `HS256` algorithm and expire after the configured duration
- Tokens are stored in `localStorage` on the client
- All protected endpoints require `Authorization: Bearer <token>` header

---

## 👥 User Roles

| Role | Permissions |
|---|---|
| `user` | Summarize documents, view own history, delete own summaries |
| `admin` | All user permissions + view all registered users |

Admin accounts are created automatically on server startup using credentials from `.env`.

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

<div align="center">
Built with ❤️ using React, FastAPI, MongoDB Atlas, and BERT (DistilBART)
</div>
