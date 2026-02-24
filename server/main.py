from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime

from routes import auth, books, summaries
from utils.auth import hash_password

load_dotenv()

# Database connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/book-summarization")
database = None
mongo_client = None

async def connect_to_mongo():
    """Connect to MongoDB"""
    global database, mongo_client
    
    try:
        print("=" * 60)
        print("🚀 Connecting to MongoDB...")
        print(f"URI: {MONGODB_URI[:60]}...")
        print("=" * 60)
        
        mongo_client = AsyncIOMotorClient(MONGODB_URI)
        database = mongo_client.get_database()
        
        # Test connection
        await database.command("ping")
        print("✅ MongoDB connected successfully!")
        print("📦 Database is ready")
        
        #Create admin user
        await create_admin_user()
        print("=" * 60)
        
    except Exception as e:
        print("=" * 60)
        print(f"❌ MongoDB connection failed!")
        print(f"Error: {type(e).__name__}: {str(e)}")
        print("⚠️ Server will use memory storage")
        print("=" * 60)
        database = None

async def close_mongo_connection():
    """Close MongoDB connection"""
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("🔒 MongoDB connection closed")

async def create_admin_user():
    """Create default admin user if not exists"""
    global database
    
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_name = os.getenv("ADMIN_NAME", "Admin")
    
    if not admin_email or not admin_password:
        print("⚠️  No admin credentials in .env file")
        return
    
    try:
        if database is not None:
            # Check if admin exists
            existing_admin = await database.users.find_one({"email": admin_email})
            if existing_admin:
                print(f"✅ Admin user already exists: {admin_email}")
                return
            
            # Create admin user
            hashed_password = hash_password(admin_password)
            admin_user = {
                "name": admin_name,
                "email": admin_email,
                "password": hashed_password,
                "role": "admin",
                "isActive": True,
                "lastLogin": None,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            await database.users.insert_one(admin_user)
            print(f"✅ Admin user created successfully!")
            print(f"   📧 Email: {admin_email}")
            print(f"   🔑 Password: {admin_password}")
            print(f"   👤 Role: admin")
        else:
            print("⚠️  Cannot create admin user - MongoDB not connected")
    except Exception as e:
        print(f"⚠️  Error creating admin user: {e}")

app = FastAPI(
    title="Book Summarization API",
    description="Backend API for Book Summarization Platform with MongoDB",
    version="2.0.0"
)

@app.on_event("startup")
async def startup_event():
    """Runs when FastAPI starts"""
    print("=" * 60)
    print("🚀 STARTING FASTAPI SERVER")
    print("=" * 60)
    print(f"MongoDB URI: {MONGODB_URI[:60]}...")
    await connect_to_mongo()
    print("=" * 60)

@app.on_event("shutdown")
async def shutdown_event():
    """Runs when FastAPI stops"""
    print("🛑 Shutting down FastAPI server...")
    await close_mongo_connection()
    print("✅ Cleanup complete")

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
