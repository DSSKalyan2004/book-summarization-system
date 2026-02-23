from fastapi import APIRouter, HTTPException, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from bson import ObjectId
import base64

from models.user import UserCreate, UserLogin, UserResponse, TokenResponse
from utils.auth import hash_password, verify_password, create_access_token, get_current_user, require_admin

router = APIRouter()

# In-memory fallback if MongoDB not connected
users_memory = []

def get_database():
    from main import database
    return database

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Register a new user"""
    try:
        # Try MongoDB first
        if db is not None:
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
                    role=user_data.role or "user"
                ),
                token=token
            )
        else:
            # Fallback to in-memory storage
            print("⚠️  MongoDB not available, using memory storage")
            
            existing_user = next((u for u in users_memory if u["email"] == user_data.email), None)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="User with this email already exists"
                )
            
            user_id = str(int(datetime.utcnow().timestamp() * 1000))
            user_dict = {
                "id": user_id,
                "_id": user_id,
                "name": user_data.name,
                "email": user_data.email,
                "password": base64.b64encode(user_data.password.encode()).decode(),
                "role": user_data.role or "user",
                "isActive": True,
                "createdAt": datetime.utcnow().isoformat()
            }
            
            users_memory.append(user_dict)
            print(f"✅ User registered in memory: {user_data.email}")
            
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
                    role=user_data.role or "user"
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

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Login user"""
    try:
        # Try MongoDB first
        if db is not None:
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
            
            if not verify_password(login_data.password, user["password"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            # Update last login
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"lastLogin": datetime.utcnow()}}
            )
            
            user_id = str(user["_id"])
            token = create_access_token({
                "userId": user_id,
                "email": user["email"],
                "role": user.get("role", "user")
            })
            
            print(f"✅ User logged in (MongoDB): {user['email']}")
            
            return TokenResponse(
                message="Login successful",
                user=UserResponse(
                    id=user_id,
                    _id=user_id,
                    name=user["name"],
                    email=user["email"],
                    role=user.get("role", "user")
                ),
                token=token
            )
        else:
            # Fallback to in-memory
            user = next((u for u in users_memory if u["email"] == login_data.email), None)
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
            
            # Simple password check for memory storage
            stored_password = base64.b64decode(user["password"]).decode()
            if stored_password != login_data.password:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            token = create_access_token({
                "userId": user["id"],
                "email": user["email"],
                "role": user.get("role", "user")
            })
            
            print(f"✅ User logged in (Memory): {user['email']}")
            
            return TokenResponse(
                message="Login successful",
                user=UserResponse(
                    id=user["id"],
                    _id=user["_id"],
                    name=user["name"],
                    email=user["email"],
                    role=user.get("role", "user")
                ),
                token=token
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "user": {
            "email": current_user.get("email"),
            "role": current_user.get("role"),
            "userId": current_user.get("userId")
        }
    }

@router.get("/users")
async def get_all_users(
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all users (admin only)"""
    if db is not None:
        users_cursor = db.users.find({}, {"password": 0})
        users = await users_cursor.to_list(length=1000)
        for user in users:
            user["id"] = str(user["_id"])
        return {"users": users, "count": len(users)}
    else:
        # Return memory users without password
        users = [{k: v for k, v in u.items() if k != "password"} for u in users_memory]
        return {"users": users, "count": len(users)}
