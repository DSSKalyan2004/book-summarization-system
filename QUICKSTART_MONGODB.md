# 🚀 QUICK START - Get MongoDB Running in 3 Minutes!

## Create Your FREE MongoDB Database

MongoDB Atlas is **100% FREE** and takes just 3 minutes to set up!

### Step-by-Step Setup

**1. Sign Up (30 seconds)**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Click "Sign up with Google" (easiest) or use email
   - No credit card required!

**2. Create FREE Cluster (1 minute)**
   - Click "Build a Database"
   - Choose **M0 FREE** tier (always free)
   - Select any cloud provider (AWS is fine)
   - Click "Create" button
   - Wait 2-3 minutes while cluster is created ☕

**3. Create Database User (30 seconds)**
   - Click "Security" → "Database Access" in left menu
   - Click "Add New Database User"
   - Username: `bookuser`
   - Password: `BookPass123!` (or create your own secure password)
   - Keep "Built-in Role" as "Read and write to any database"
   - Click "Add User"

**4. Allow Network Access (30 seconds)**
   - Click "Security" → "Network Access" in left menu
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (or add your IP)
   - Click "Confirm"

**5. Get Connection String (30 seconds)**
   - Go to "Database" (left menu)
   - Click "Connect" button on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://...`)
   
   **Important:** 
   - Replace `<password>` with your actual password (`BookPass123!`)
   - Replace `<dbname>` or add `book-summarization` as database name
   
   Example final connection string:
   ```
   mongodb+srv://bookuser:BookPass123!@cluster0.xxxxx.mongodb.net/book-summarization?retryWrites=true&w=majority
   ```

**6. Update Server Configuration (15 seconds)**
   - Open `server/.env` file
   - Replace the `MONGODB_URI` line with your connection string:
   
   ```env
   MONGODB_URI=mongodb+srv://bookuser:BookPass123!@cluster0.xxxxx.mongodb.net/book-summarization?retryWrites=true&w=majority
   ```

**7. Restart Server**
   - Stop the current server (press `Ctrl+C` in the server terminal)
   - Start it again:
   ```bash
   cd server
   npm start
   ```

You should see:
```
✅ MongoDB connected successfully
📦 Database ready to store user accounts and summaries
🚀 Server running on port 5000
```

---

## Test Your Setup

1. Go to your app in the browser
2. Click "Sign Up"
3. Create an account with your name, email, and password
4. You should be logged in automatically!

Your user data is now safely stored in MongoDB Atlas ☁️

---

## Troubleshooting

**Error: "Authentication failed"**
- Check your username and password in the connection string

**Error: "IP not whitelisted"**
- Go to Network Access in MongoDB Atlas
- Click "Allow Access from Anywhere"

**Still not working?**
- Make sure you replaced `<password>` with your actual password
- Make sure there are no spaces in the connection string
- Make sure the database name is `book-summarization`
