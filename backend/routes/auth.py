from fastapi import APIRouter, HTTPException, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from bson import ObjectId
import base64
import traceback

from models.user import UserCreate, UserLogin, UserResponse, TokenResponse
from utils.auth import hash_password, verify_password, create_access_token, get_current_user, require_admin
from utils.local_store import load_users, save_users, add_user, update_user as persist_update_user, record_login_event, get_all_login_events

router = APIRouter()

# In-memory fallback — pre-loaded from disk so data survives restarts
users_memory = load_users()

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
                    role=user_data.role or "user",
                    isActive=True,
                    createdAt=user_dict["createdAt"],
                    lastLogin=None
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
            created_at = datetime.utcnow()
            user_dict = {
                "id": user_id,
                "_id": user_id,
                "name": user_data.name,
                "email": user_data.email,
                "password": hash_password(user_data.password),  # bcrypt — same as admin
                "role": user_data.role or "user",
                "isActive": True,
                "createdAt": str(created_at),
                "lastLogin": None
            }
            
            users_memory.append(user_dict)
            add_user(user_dict)  # persist to disk so it survives restarts
            print(f"✅ User registered in memory+disk: {user_data.email}")
            
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
                    createdAt=created_at,
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

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Login user"""
    print(f"\n🔐 LOGIN ATTEMPT:")
    print(f"   Email: {login_data.email}")
    print(f"   DB Status: {'Connected' if db is not None else 'NOT CONNECTED (None)'}")
    
    try:
        # Try MongoDB first
        if db is not None:
            print(f"   🔍 Searching for user in MongoDB...")
            user = await db.users.find_one({"email": login_data.email})
            if not user:
                print(f"   ❌ User not found in MongoDB")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            print(f"   ✅ User found: {user.get('name')}, Role: {user.get('role')}")
            print(f"   🔑 Verifying password...")
            
            if not user.get("isActive", True):
                print(f"   ❌ Account is inactive")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account is inactive"
                )
            
            password_valid = verify_password(login_data.password, user["password"])
            print(f"   Password valid: {password_valid}")
            
            if not password_valid:
                print(f"   ❌ Password verification failed")
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
            # Record login event in MongoDB permanently
            user_id = str(user["_id"])
            try:
                await db.login_events.insert_one({
                    "userId": user_id,
                    "email": user["email"],
                    "name": user.get("name", ""),
                    "role": user.get("role", "user"),
                    "timestamp": login_time
                })
            except Exception:
                pass  # non-fatal
            # Also record to disk fallback so it's never lost
            record_login_event({
                "userId": user_id,
                "email": user["email"],
                "name": user.get("name", ""),
                "role": user.get("role", "user"),
                "timestamp": str(login_time)
            })
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
                    role=user.get("role", "user"),
                    isActive=user.get("isActive", True),
                    createdAt=user.get("createdAt"),
                    lastLogin=user.get("lastLogin")
                ),
                token=token
            )
        else:
            # Fallback to local disk + in-memory (data survives restarts)
            from utils.local_store import load_users as _disk_users
            all_users = {u["email"]: u for u in _disk_users()}
            for u in users_memory:
                all_users[u["email"]] = u  # memory wins over disk on conflict

            user = all_users.get(login_data.email)
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

            # Password check (bcrypt for seeded/hashed users, base64 for legacy registered)
            try:
                password_valid = verify_password(login_data.password, user["password"])
            except Exception:
                try:
                    stored_password = base64.b64decode(user["password"]).decode()
                    password_valid = stored_password == login_data.password
                except Exception:
                    password_valid = False

            if not password_valid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )

            # Update last login in memory + disk
            login_time = str(datetime.utcnow())
            user["lastLogin"] = login_time
            persist_update_user(user["id"], {"lastLogin": login_time})
            # Record login event permanently to disk
            record_login_event({
                "userId": user.get("id", user.get("_id", "")),
                "email": user["email"],
                "name": user.get("name", ""),
                "role": user.get("role", "user"),
                "timestamp": login_time
            })

            token = create_access_token({
                "userId": user["id"],
                "email": user["email"],
                "role": user.get("role", "user")
            })

            print(f"✅ User logged in (disk/memory): {user['email']}")

            return TokenResponse(
                message="Login successful",
                user=UserResponse(
                    id=user["id"],
                    _id=user["_id"],
                    name=user["name"],
                    email=user["email"],
                    role=user.get("role", "user"),
                    isActive=user.get("isActive", True),
                    createdAt=user.get("createdAt"),
                    lastLogin=user.get("lastLogin")
                ),
                token=token
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"   ❌ LOGIN EXCEPTION: {type(e).__name__}: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {type(e).__name__}: {str(e)}"
        )

@router.get("/me")
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get current user information — also validates the token is still good"""
    user_id = current_user.get("userId")
    try:
        if db is not None and user_id:
            from bson import ObjectId as ObjId
            user = await db.users.find_one({"_id": ObjId(user_id)}, {"password": 0})
            if user:
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
        # Fallback — check local disk store then in-memory
        from utils.local_store import load_users as _disk_users
        disk_users = _disk_users()
        mem_user = next(
            (u for u in disk_users + users_memory
             if u.get("id") == user_id or u.get("email") == current_user.get("email")),
            None
        )
        if mem_user:
            return {
                "user": {
                    "id": mem_user.get("id"),
                    "_id": mem_user.get("_id"),
                    "name": mem_user.get("name"),
                    "email": mem_user.get("email"),
                    "role": mem_user.get("role", "user"),
                    "isActive": mem_user.get("isActive", True),
                    "createdAt": str(mem_user.get("createdAt", "")),
                    "lastLogin": None,
                }
            }
    except Exception:
        pass
    return {
        "user": {
            "id": user_id,
            "_id": user_id,
            "email": current_user.get("email"),
            "role": current_user.get("role", "user"),
            "isActive": True,
        }
    }


@router.post("/refresh")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """Issue a fresh token using the existing valid token (keeps user logged in)"""
    new_token = create_access_token({
        "userId": current_user.get("userId"),
        "email": current_user.get("email"),
        "role": current_user.get("role", "user")
    })
    return {"token": new_token, "message": "Token refreshed successfully"}

@router.get("/login-history")
async def get_login_history(
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get full login history across all users — admin only. Data is permanent."""
    events = []
    if db is not None:
        try:
            cursor = db.login_events.find({}).sort("timestamp", -1).limit(5000)
            mongo_events = await cursor.to_list(length=5000)
            for e in mongo_events:
                events.append({
                    "userId": str(e.get("userId", "")),
                    "email": e.get("email", ""),
                    "name": e.get("name", ""),
                    "role": e.get("role", "user"),
                    "timestamp": str(e["timestamp"]) if e.get("timestamp") else None,
                })
        except Exception as ex:
            print(f"⚠️  login_events MongoDB fetch failed: {ex}")

    # Always merge disk events — covers logins made when MongoDB was offline
    disk_events = get_all_login_events()
    seen = {(e["email"], e.get("timestamp")) for e in events}
    for e in disk_events:
        key = (e.get("email"), e.get("timestamp"))
        if key not in seen:
            events.append(e)
            seen.add(key)

    # Sort newest first
    def _ts(e):
        t = e.get("timestamp", "")
        return t if t else ""
    events.sort(key=_ts, reverse=True)
    return {"events": events, "count": len(events)}


@router.get("/users")
async def get_all_users(
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all users (admin only)"""
    if db is not None:
        users_cursor = db.users.find({}, {"password": 0})
        users = await users_cursor.to_list(length=1000)
        result = []
        for user in users:
            result.append({
                "id": str(user["_id"]),
                "_id": str(user["_id"]),
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "role": user.get("role", "user"),
                "isActive": user.get("isActive", True),
                "createdAt": str(user["createdAt"]) if user.get("createdAt") else None,
                "lastLogin": str(user["lastLogin"]) if user.get("lastLogin") else None,
            })
        return {"users": result, "count": len(result)}
    else:
        # Return disk-persisted + memory users without password
        from utils.local_store import load_users as _disk_users
        all_users = {u["id"]: u for u in _disk_users()}
        for u in users_memory:
            all_users[u.get("id", u.get("email"))] = u
        users = [{k: v for k, v in u.items() if k != "password"} for u in all_users.values()]
        return {"users": users, "count": len(users)}
