# MongoDB Setup Guide

## Quick Start - Get Your FREE MongoDB Database in 5 Minutes!

### Option 1: MongoDB Atlas (Recommended - FREE Cloud Database)

1. **Create Account**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up with your email (it's FREE!)

2. **Create a Cluster**
   - Click "Build a Database"
   - Select **FREE** tier (M0)
   - Choose a cloud provider (AWS recommended)
   - Select a region close to you
   - Click "Create Cluster" (takes 3-5 minutes)

3. **Create Database User**
   - Go to "Database Access" in left menu
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `bookuser`
   - Password: `bookpass123` (or create your own)
   - User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Allow Network Access**
   - Go to "Network Access" in left menu
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get Connection String**
   - Go back to "Database" in left menu
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://...`)
   - Replace `<password>` with your password from step 3

6. **Update .env File**
   - Open `server/.env` file
   - Replace the MONGODB_URI with your connection string
   - Make sure database name is `book-summarization`
   
   Example:
   ```
   MONGODB_URI=mongodb+srv://bookuser:bookpass123@cluster0.xxxxx.mongodb.net/book-summarization?retryWrites=true&w=majority
   ```

7. **Start the Server**
   ```bash
   cd server
   npm start
   ```

### Option 2: Local MongoDB (Advanced Users)

1. **Install MongoDB**
   - Download from: https://www.mongodb.com/try/download/community
   - Install with default settings
   - Make sure MongoDB service is running

2. **Update .env**
   ```
   MONGODB_URI=mongodb://localhost:27017/book-summarization
   ```

3. **Start the Server**
   ```bash
   cd server
   npm start
   ```

## Verify It's Working

When you start the server, you should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

If you see any errors, check:
1. Your MongoDB connection string is correct
2. Your IP address is whitelisted in MongoDB Atlas
3. Your database user credentials are correct

## Need Help?

Common Issues:
- **"MongooseServerSelectionError"**: Your IP is not whitelisted or connection string is wrong
- **"Authentication failed"**: Wrong username/password in connection string
- **"Failed to fetch"**: Server is not running - make sure to run `npm start` in server folder
