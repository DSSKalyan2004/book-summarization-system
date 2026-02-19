# ✅ MongoDB Setup Checklist - Follow Along!

## I've opened MongoDB Atlas for you in the browser!

Follow these steps in order:

### □ Step 1: Sign Up (30 seconds)
- In the browser window that just opened
- Click "Sign up with Google" (easiest) OR use email
- Complete registration
- **NO CREDIT CARD REQUIRED!**

### □ Step 2: Create Free Cluster (1 minute)
- Click "Build a Database"
- Select **M0 FREE** tier (should be selected by default)
- Choose any cloud provider (AWS is fine)
- Choose a region close to you
- Click "Create" button
- ⏳ Wait 2-3 minutes while it creates

### □ Step 3: Create Database User (30 seconds)
- Look for "Security" in left sidebar
- Click "Database Access"
- Click "Add New Database User"
- **Username:** `bookuser`
- **Password:** `BookPass123!` (or make your own - remember it!)
- Keep default role: "Read and write to any database"
- Click "Add User"

### □ Step 4: Allow Network Access (30 seconds)
- Click "Network Access" (under Security)
- Click "Add IP Address"
- Click "Allow Access from Anywhere" (or "Add Current IP Address")
- Click "Confirm"

### □ Step 5: Get Connection String (30 seconds)
- Click "Database" in left sidebar
- Click "Connect" button on your cluster
- Choose "Connect your application"
- **Driver:** Node.js
- **Version:** 5.5 or later
- Copy the connection string

### □ Step 6: Update Your .env File (15 seconds)
Your connection string looks like:
```
mongodb+srv://bookuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**Important changes:**
1. Replace `<password>` with `BookPass123!` (or your password)
2. Add `/book-summarization` before the `?`

**Final string should look like:**
```
mongodb+srv://bookuser:BookPass123!@cluster0.xxxxx.mongodb.net/book-summarization?retryWrites=true&w=majority
```

**Now update your file:**
1. Open `server/.env` file
2. Find the line: `MONGODB_URI=mongodb://localhost:27017/book-summarization`
3. Replace it with your connection string
4. Save the file (Ctrl+S)

### □ Step 7: Restart Server (15 seconds)
```bash
# In your server terminal:
# 1. Press Ctrl+C to stop server
# 2. Run these commands:
cd server
npm start
```

### □ Step 8: Verify Success ✨
Look for this in your terminal:
```
✅ MongoDB connected successfully
📦 Database ready to store user accounts and summaries
🚀 Server running on port 5000
```

### □ Step 9: Test Signup! 🎉
- Go to your app
- Click "Sign Up"
- Create your account
- **IT WILL WORK!** ✅

---

## Stuck? Common Issues:

**"Authentication failed"**
- Check you replaced `<password>` with actual password
- Make sure no extra spaces in connection string

**"IP not whitelisted"**
- Go back to "Network Access"
- Make sure "Allow Access from Anywhere" is enabled

**"Could not connect to server"**
- Wait 2-3 minutes for cluster to fully deploy
- Make sure cluster shows "Active" status

---

## Need Help?
Check the browser window I opened - MongoDB Atlas has tooltips and help guides throughout the process!
