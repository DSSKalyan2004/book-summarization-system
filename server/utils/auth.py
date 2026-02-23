from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from typing import Optional

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_IN = os.getenv("JWT_EXPIRES_IN", "7d")

# Security scheme
security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    # Parse expires_in (support formats like '7d', '24h', '60m')
    expires_in_str = JWT_EXPIRES_IN
    if expires_in_str.endswith('d'):
        days = int(expires_in_str[:-1])
        expire = datetime.utcnow() + timedelta(days=days)
    elif expires_in_str.endswith('h'):
        hours = int(expires_in_str[:-1])
        expire = datetime.utcnow() + timedelta(hours=hours)
    elif expires_in_str.endswith('m'):
        minutes = int(expires_in_str[:-1])
        expire = datetime.utcnow() + timedelta(minutes=minutes)
    else:
        expire = datetime.utcnow() + timedelta(days=7)  # default 7 days
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or expired token"
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Dependency to get the current authenticated user"""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload.get("email"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    return payload

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[dict]:
    """Optional authentication - returns None if no token provided"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = decode_token(token)
        return payload
    except HTTPException:
        return None

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency to ensure user is an admin"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
