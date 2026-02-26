from fastapi import APIRouter, HTTPException, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from bson import ObjectId
import traceback

from models.user import UserCreate, UserLogin, UserResponse, TokenResponse
from utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_admin
)

router = APIRouter()


# 🔹 Force MongoDB dependency
def get_database():
    from main import database
    if database is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB is not connected. Fallback disabled."
        )
    return database


# ================= REGISTER =================
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Register a new user — MongoDB only"""

    try:
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )

        # Create new user
        hashed_password = hash_password(user_data.password)

        user_dict = {
            "name": user_data.name,
            "email": user_data.email,
            "password": hashed_password,
            "role": user_data.role or "user",
            "isActive": True,
            "lastLogin": None,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }

        result = await db.users.insert_one(user_dict)
        user_id = str(result.inserted_id)

        print(f"✅ User registered in MongoDB: {user_data.email}")

        # Generate token
        token = create_access_token({
            "userId": user_id,
            "email": user_data.email,
            "role": user_data.role or "user"
        })

        return TokenResponse(
            message="User registered successfully",
            user=UserResponse(
                id=user_id,
                _id=user_id,
                name=user_data.name,
                email=user_data.email,
                role=user_data.role or "user",
                isActive=True,
                createdAt=user_dict["createdAt"],
                lastLogin=None
            ),
            token=token
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


# ================= LOGIN =================
@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Login user — MongoDB only"""

    print(f"\n🔐 LOGIN ATTEMPT: {login_data.email}")

    try:
        user = await db.users.find_one({"email": login_data.email})

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not user.get("isActive", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )

        password_valid = verify_password(login_data.password, user["password"])

        if not password_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Update last login
        login_time = datetime.utcnow()

        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"lastLogin": login_time}}
        )

        # Save login history
        await db.login_events.insert_one({
            "userId": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name", ""),
            "role": user.get("role", "user"),
            "timestamp": login_time
        })

        token = create_access_token({
            "userId": str(user["_id"]),
            "email": user["email"],
            "role": user.get("role", "user")
        })

        print(f"✅ User logged in: {user['email']}")

        return TokenResponse(
            message="Login successful",
            user=UserResponse(
                id=str(user["_id"]),
                _id=str(user["_id"]),
                name=user["name"],
                email=user["email"],
                role=user.get("role", "user"),
                isActive=user.get("isActive", True),
                createdAt=user.get("createdAt"),
                lastLogin=login_time
            ),
            token=token
        )

    except HTTPException:
        raise
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


# ================= ME =================
@router.get("/me")
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get current user info"""

    user_id = current_user.get("userId")

    user = await db.users.find_one(
        {"_id": ObjectId(user_id)},
        {"password": 0}
    )

    if not user:
        raise HTTPException(404, "User not found")

    return {
        "user": {
            "id": str(user["_id"]),
            "_id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user.get("role", "user"),
            "isActive": user.get("isActive", True),
            "createdAt": str(user.get("createdAt", "")),
            "lastLogin": str(user.get("lastLogin", "")) if user.get("lastLogin") else None,
        }
    }


# ================= REFRESH =================
@router.post("/refresh")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """Refresh JWT token"""

    new_token = create_access_token({
        "userId": current_user.get("userId"),
        "email": current_user.get("email"),
        "role": current_user.get("role", "user")
    })

    return {
        "token": new_token,
        "message": "Token refreshed successfully"
    }


# ================= LOGIN HISTORY =================
@router.get("/login-history")
async def get_login_history(
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Admin — Full login history"""

    cursor = db.login_events.find({}).sort("timestamp", -1).limit(5000)
    events_raw = await cursor.to_list(length=5000)

    events = []

    for e in events_raw:
        events.append({
            "userId": e.get("userId"),
            "email": e.get("email"),
            "name": e.get("name"),
            "role": e.get("role"),
            "timestamp": str(e.get("timestamp"))
        })

    return {"events": events, "count": len(events)}


# ================= USERS =================
@router.get("/users")
async def get_all_users(
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Admin — Get all users"""

    cursor = db.users.find({}, {"password": 0})
    users_raw = await cursor.to_list(length=1000)

    users = []

    for user in users_raw:
        users.append({
            "id": str(user["_id"]),
            "_id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user.get("role", "user"),
            "isActive": user.get("isActive", True),
            "createdAt": str(user.get("createdAt")),
            "lastLogin": str(user.get("lastLogin")) if user.get("lastLogin") else None,
        })

    return {"users": users, "count": len(users)}