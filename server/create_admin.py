import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from dotenv import load_dotenv
from utils.auth import hash_password

load_dotenv()

async def create_admin():
    """Create admin user manually"""
    MONGODB_URI = os.getenv("MONGODB_URI")
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_name = os.getenv("ADMIN_NAME", "Admin")
    
    print(f"🔄 Connecting to MongoDB...")
    print(f"   Email: {admin_email}")
    print(f"   Name: {admin_name}")
    
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client.get_database()
        
        # Test connection  
        await db.command("ping")
        print("✅ MongoDB connected successfully!")
        
        # Check if admin exists
        existing_admin = await db.users.find_one({"email": admin_email})
        if existing_admin:
            if existing_admin.get('role') == 'admin':
                print(f"⚠️  Admin user already exists: {admin_email}")
                print(f"   Role: {existing_admin.get('role', 'N/A')}")
                client.close()
                return
            else:
                # Update existing user to admin
                print(f"⚠️  User exists with role '{existing_admin.get('role')}', upgrading to admin...")
                await db.users.update_one(
                    {"email": admin_email},
                    {"$set": {"role": "admin", "updatedAt": datetime.utcnow()}}
                )
                print(f"✅ User upgraded to admin successfully!")
                print(f"   📧 Email: {admin_email}")
                print(f"   🔑 Password: {admin_password}")
                print(f"   👤 Role: admin")
                client.close()
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
        
        result = await db.users.insert_one(admin_user)
        print(f"✅ Admin user created successfully!")
        print(f"   📧 Email: {admin_email}")
        print(f"   🔑 Password: {admin_password}")
        print(f"   👤 Role: admin")
        print(f"   🆔 ID: {result.inserted_id}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(create_admin())
