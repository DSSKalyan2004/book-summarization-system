from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from routes import auth, books, summaries

load_dotenv()

# Database connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/book-summarization")
database = None
mongo_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global database, mongo_client
    try:
        if "mongodb+srv" in MONGODB_URI or ("mongodb://" in MONGODB_URI and "localhost" not in MONGODB_URI):
            print("🔄 Connecting to MongoDB...")
            mongo_client = AsyncIOMotorClient(MONGODB_URI)
            database = mongo_client.get_database()
            # Test connection
            await database.command("ping")
            print("✅ MongoDB connected successfully")
            print("📦 Database ready to store user accounts and summaries")
        else:
            print("📝 Running in LOCAL MODE (no MongoDB required)")
            print("💡 User data stored in memory (will reset on server restart)")
            print("   To enable MongoDB: Update MONGODB_URI in .env file")
    except Exception as e:
        print(f"⚠️  MongoDB not connected - using local storage")
        print(f"   (This is OK for testing. Error: {e})")
        database = None
    
    yield
    
    # Shutdown
    if mongo_client:
        mongo_client.close()
        print("🔒 MongoDB connection closed")

app = FastAPI(
    title="Book Summarization API",
    description="Backend API for Book Summarization Platform with MongoDB",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
try:
    app.mount("/static", StaticFiles(directory="public"), name="static")
except Exception:
    pass  # Public directory might not exist

# Dependency to get database
def get_database():
    return database

# Register routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(books.router, prefix="/api/books", tags=["Books"])
app.include_router(summaries.router, prefix="/api/summaries", tags=["Summaries"])

# Health check
@app.get("/api/health")
async def health_check():
    return {
        "status": "OK",
        "message": "FastAPI Book Summarization Server Running",
        "database": "connected" if database else "memory-mode"
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Book Summarization Platform API",
        "version": "2.0.0",
        "framework": "FastAPI",
        "docs": "/docs",
        "health": "/api/health"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": str(exc)}
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
