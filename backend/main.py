from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
import os
import certifi
from dotenv import load_dotenv
from datetime import datetime

from routes import auth, books, summaries
from utils.auth import hash_password

load_dotenv()

# Database connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/book-summarization")
database = None
mongo_client = None

async def create_indexes():
    """Create permanent MongoDB indexes — NO TTL so data lives forever"""
    global database
    if database is None:
        return
    try:
        # ── users ──────────────────────────────────────────────────────────
        # Unique email — prevents duplicate accounts
        await database.users.create_index("email", unique=True, background=True)
        # Fast lookup by role
        await database.users.create_index("role", background=True)

        # ── user_histories ──────────────────────────────────────────────────
        # Fast per-user history fetch
        await database.user_histories.create_index("userId", background=True)
        # Sort by timestamp (most recent first)
        await database.user_histories.create_index([("userId", 1), ("timestamp", -1)], background=True)

        # ── login_events ────────────────────────────────────────────────
        # Every login ever — permanent append-only log
        await database.login_events.create_index([("timestamp", -1)], background=True)
        await database.login_events.create_index("userId", background=True)
        await database.login_events.create_index("email", background=True)

        # ── summaries ───────────────────────────────────────────────────────
        await database.summaries.create_index("generated_by", background=True)
        await database.summaries.create_index("generation_date", background=True)

        print("✅ MongoDB indexes created (permanent — no TTL)")
    except Exception as e:
        print(f"⚠️  Index creation warning (non-fatal): {e}")


async def connect_to_mongo():
    """Connect to MongoDB — retries 3 times so a brief network hiccup won't
    silently fall back to memory mode and lose user data."""
    global database, mongo_client
    
    last_error = None
    for attempt in range(1, 2):  # Only 1 attempt on Python 3.7 (TLS 1.3 not supported); upgrade Python to re-enable retries
        try:
            print("=" * 60)
            print(f"🚀 Connecting to MongoDB (attempt {attempt}/3)...")
            print(f"URI: {MONGODB_URI[:60]}...")
            print("=" * 60)
            
            mongo_client = AsyncIOMotorClient(
                MONGODB_URI,
                tlsInsecure=True,
                serverSelectionTimeoutMS=10000,
            )
            database = mongo_client.get_database()
            
            # Test connection
            await database.command("ping")
            print("✅ MongoDB connected successfully!")
            print("📦 Database is ready — all data stored permanently")

            # Create indexes (permanent, no TTL)
            await create_indexes()
            # Create admin user
            await create_admin_user()
            print("=" * 60)
            return  # success

        except Exception as e:
            last_error = e
            print(f"⚠️  Attempt {attempt} failed: {type(e).__name__}: {str(e)}")
            if attempt < 3:
                import asyncio
                await asyncio.sleep(3)  # wait 3 s before retry

    print("=" * 60)
    print(f"❌ MongoDB connection failed after 3 attempts!")
    print(f"Last error: {type(last_error).__name__}: {str(last_error)}")
    print("⚠️  Server will use local disk storage (data/users.json + data/history.json)")
    print("   Data will persist across server restarts even without MongoDB.")
    print("=" * 60)
    database = None
    await seed_memory_admin_user()

async def close_mongo_connection():
    """Close MongoDB connection"""
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("🔒 MongoDB connection closed")

async def seed_memory_admin_user():
    """Create default admin user in memory when MongoDB is unavailable.
    Checks local disk store first so existing accounts survive restarts."""
    from routes.auth import users_memory
    from utils.auth import hash_password as _hash
    from utils.local_store import load_users, add_user

    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_name = os.getenv("ADMIN_NAME", "Admin")

    if not admin_email or not admin_password:
        print("⚠️  No admin credentials in .env – skipping memory seed")
        return

    # Load persisted users from disk into memory
    disk_users = load_users()
    for u in disk_users:
        if not any(m["email"] == u["email"] for m in users_memory):
            users_memory.append(u)

    # Check if admin already exists (in memory or on disk)
    if any(u["email"] == admin_email for u in users_memory):
        print(f"✅ Admin already loaded from disk: {admin_email}")
        return

    hashed = _hash(admin_password)
    admin = {
        "id": "memory-admin-001",
        "_id": "memory-admin-001",
        "name": admin_name,
        "email": admin_email,
        "password": hashed,
        "role": "admin",
        "isActive": True,
        "createdAt": str(datetime.utcnow()),
        "lastLogin": None,
    }
    users_memory.append(admin)
    add_user(admin)  # persist to disk so admin exists after restart
    print(f"✅ Admin seeded to memory+disk: {admin_email}")


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
# FRONTEND_URL env var accepts one or more comma-separated URLs
# e.g. "https://myapp.vercel.app,https://myapp.onrender.com"
# Falls back to "*" for local dev (allows all origins)
_frontend_url = os.getenv("FRONTEND_URL", "")
if _frontend_url:
    # Split comma-separated URLs and strip whitespace
    _allowed_origins = [u.strip().rstrip("/") for u in _frontend_url.split(",") if u.strip()]
else:
    _allowed_origins = ["*"]

print(f"🌐 CORS allowed origins: {_allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
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
