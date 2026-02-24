import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def debug_login():
    """Debug login issue"""
    MONGODB_URI = os.getenv("MONGODB_URI")
    email = "kalyan@gmail.com"
    password = "123456"
    
    print(f"🔍 Debugging login for: {email}")
    print(f"   Password attempting: {password}")
    
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client.get_database()
        
        await db.command("ping")
        print("✅ MongoDB connected")
        
        # Find user
        user = await db.users.find_one({"email": email})
        if not user:
            print(f"❌ User not found!")
            client.close()
            return
        
        print(f"\n✅ User found in database:")
        print(f"   Name: {user.get('name')}")
        print(f"   Email: {user['email']}")
        print(f"   Role: {user.get('role')}")
        print(f"   Active: {user.get('isActive')}")
        
        stored_hash = user.get('password')
        print(f"\n🔑 Password comparison:")
        print(f"   Stored hash: {stored_hash[:60]}...")
        print(f"   Hash length: {len(stored_hash)}")
        print(f"   Trying password: '{password}'")
        
        # Test with passlib
        is_valid = pwd_context.verify(password, stored_hash)
        print(f"\n✅ Password verification result: {is_valid}")
        
        if not is_valid:
            print("\n❌ Password does NOT match!")
            print("   Rehashing password...")
            new_hash = pwd_context.hash(password)
            print(f"   New hash: {new_hash[:60]}...")
            
            # Update
            await db.users.update_one(
                {"email": email},
                {"$set": {"password": new_hash}}
            )
            print("   ✅ Password rehashed and updated!")
            
            # Test again
            updated_user = await db.users.find_one({"email": email})
            is_valid_now = pwd_context.verify(password, updated_user['password'])
            print(f"   ✅ Verification after update: {is_valid_now}")
        else:
            print("\n✅ Password matches correctly!")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_login())
