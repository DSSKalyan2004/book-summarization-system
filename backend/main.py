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

# ================= DATABASE CONFIG =================
MONGODB_URI = os.getenv("MONGODB_URI")

database = None
mongo_client = None


async def create_indexes():
    global database
    if database is None:
        return

    try:
        await database.users.create_index("email", unique=True)
        await database.users.create_index("role")

        await database.login_events.create_index([("timestamp", -1)])
        await database.login_events.create_index("userId")
        await database.login_events.create_index("email")

        print("✅ MongoDB indexes created")
    except Exception as e:
        print(f"⚠️ Index creation warning: {e}")


async def create_admin_user():
    global database

    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_name = os.getenv("ADMIN_NAME", "Admin")

    if not admin_email or not admin_password:
        print("⚠️ ADMIN_EMAIL or ADMIN_PASSWORD missing in .env")
        return

    existing_admin = await database.users.find_one({"email": admin_email})
    if existing_admin:
        # Ensure the user has admin role and the latest password from env
        updates = {}
        if existing_admin.get("role") != "admin":
            updates["role"] = "admin"
        # Always sync password with current ADMIN_PASSWORD so you can log in
        updates["password"] = hash_password(admin_password)
        if updates:
            updates["updatedAt"] = datetime.utcnow()
            await database.users.update_one(
                {"_id": existing_admin["_id"]},
                {"$set": updates}
            )
        print(f"✅ Admin already exists and is updated: {admin_email}")
        return

    admin_user = {
        "name": admin_name,
        "email": admin_email,
        "password": hash_password(admin_password),
        "role": "admin",
        "isActive": True,
        "lastLogin": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }

    await database.users.insert_one(admin_user)

    print("✅ Admin user created")
    print(f"📧 Email: {admin_email}")
    print(f"👤 Role: admin")


# ================= MONGO CONNECT =================
async def connect_to_mongo():
    global database, mongo_client

    try:
        print("=" * 60)
        print("🚀 Connecting to MongoDB...")
        print("=" * 60)

        mongo_client = AsyncIOMotorClient(
            MONGODB_URI,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=10000
        )

        database = mongo_client.get_default_database()

        await database.command("ping")

        print("✅ MongoDB connected successfully!")
        print(f"📦 Using database: {database.name}")

        await create_indexes()
        await create_admin_user()

        print("=" * 60)

    except Exception as e:
        print("=" * 60)
        print("❌ MongoDB connection failed!")
        print(f"Error: {type(e).__name__}: {str(e)}")
        print("🛑 Server shutting down — MongoDB REQUIRED")
        print("=" * 60)

        raise RuntimeError("MongoDB connection required. Server stopped.")


async def close_mongo_connection():
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("🔒 MongoDB connection closed")


# ================= FASTAPI APP =================
app = FastAPI(
    title="Book Summarization API",
    version="2.0.0"
)


@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()


# ================= CORS =================
frontend_url = os.getenv("FRONTEND_URL", "")
allowed_origins = [u.strip() for u in frontend_url.split(",") if u.strip()] if frontend_url else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================= ROUTES =================
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(books.router, prefix="/api/books", tags=["Books"])
app.include_router(summaries.router, prefix="/api/summaries", tags=["Summaries"])


# ================= HEALTH =================
@app.get("/api/health")
async def health_check():
    return {
        "status": "OK",
        "database": "connected"
    }


# ================= ROOT =================
@app.get("/")
async def root():
    return {
        "message": "Book Summarization Platform API",
        "docs": "/docs"
    }


# ================= GLOBAL ERROR =================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": str(exc)}
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)