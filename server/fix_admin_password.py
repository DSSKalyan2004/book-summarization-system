import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from dotenv import load_dotenv
from utils.auth import hash_password

load_dotenv()

async def fix_admin_password():
    """Fix admin password"""
    MONGODB_URI = os.getenv("MONGODB_URI")
    admin_email = "kalyan@gmail.com"
    admin_password = "123456"
    
    print(f"🔄 Connecting to MongoDB...")
    print(f"   Email: {admin_email}")
    print(f"   New Password: {admin_password}")
    
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client.get_database()
        
        # Test connection
        await db.command("ping")
        print("✅ MongoDB connected successfully!")
        
        # Find user
        user = await db.users.find_one({"email": admin_email})
        if not user:
            print(f"❌ User not found: {admin_email}")
            print("Creating new admin user...")
            
            # Create admin user
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
            print(f"   🆔 ID: {result.inserted_id}")
        else:
            print(f"✅ User found: {user.get('email')}")
            print(f"   Current Role: {user.get('role', 'N/A')}")
            
            # Update password and role
            hashed_password = hash_password(admin_password)
            await db.users.update_one(
                {"email": admin_email},
                {
                    "$set": {
                        "password": hashed_password,
                        "role": "admin",
                        "isActive": True,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            print(f"✅ Password updated and role set to admin!")
        
        print(f"\n✅ Admin account ready!")
        print(f"   📧 Email: {admin_email}")
        print(f"   🔑 Password: {admin_password}")
        print(f"   👤 Role: admin")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(fix_admin_password())
