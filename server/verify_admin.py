import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def verify_and_fix_admin():
    """Verify and fix admin password"""
    MONGODB_URI = os.getenv("MONGODB_URI")
    admin_email = "kalyan@gmail.com"
    admin_password = "123456"
    
    print(f"🔄 Connecting to MongoDB...")
    print(f"   Email: {admin_email}")
    print(f"   Password: {admin_password}")
    
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client.get_database()
        
        # Test connection
        await db.command("ping")
        print("✅ MongoDB connected successfully!")
        
        # Find user
        user = await db.users.find_one({"email": admin_email})
        if user:
            print(f"\n✅ User found!")
            print(f"   Name: {user.get('name', 'N/A')}")
            print(f"   Email: {user.get('email', 'N/A')}")
            print(f"   Role: {user.get('role', 'N/A')}")
            print(f"   Current Password Hash: {user.get('password', 'N/A')[:50]}...")
            
            # Hash the password using bcrypt (same as auth.py)
            new_hashed_password = hash_password(admin_password)
            print(f"\n🔑 New Password Hash: {new_hashed_password[:50]}...")
            
            # Update the user with new password hash
            result = await db.users.update_one(
                {"email": admin_email},
                {
                    "$set": {
                        "password": new_hashed_password,
                        "role": "admin",
                        "isActive": True,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            print(f"\n✅ Password updated successfully!")
            print(f"   Modified Count: {result.modified_count}")
            
            # Verify the update
            updated_user = await db.users.find_one({"email": admin_email})
            print(f"\n✅ Verification:")
            print(f"   Role: {updated_user.get('role')}")
            print(f"   Active: {updated_user.get('isActive')}")
            print(f"   Password Hash Updated: {updated_user.get('password')[:50]}...")
            
            # Test password verification
            from passlib.context import CryptContext
            pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
            is_valid = pwd_ctx.verify(admin_password, updated_user.get('password'))
            print(f"\n🧪 Password Verification Test:")
            print(f"   Password '{admin_password}' matches: {is_valid}")
            
        else:
            print(f"\n❌ User not found. Creating new admin user...")
            
            hashed_password = hash_password(admin_password)
            admin_user = {
                "name": "Kalyan Admin",
                "email": admin_email,
                "password": hashed_password,
                "role": "admin",
                "isActive": True,
                "lastLogin": None,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            result = await db.users.insert_one(admin_user)
            print(f"✅ Admin user created!")
            print(f"   ID: {result.inserted_id}")
        
        print(f"\n✅ Admin account is ready!")
        print(f"   📧 Email: {admin_email}")
        print(f"   🔑 Password: {admin_password}")
        print(f"   👤 Role: admin")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_and_fix_admin())

