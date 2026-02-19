# 🔗 Get Your MongoDB Atlas Connection String

## You're logged into MongoDB Atlas! Now follow these steps:

### Step 1: Create a Database
1. In your MongoDB Atlas dashboard, click **"Database"** in the left sidebar
2. Click **"Build a Database"** (or **"Create"** if you see it)
3. Choose **M0 FREE** tier (Perfect for your app - completely free!)
4. Select a cloud provider (AWS is recommended)
5. Choose a region close to you
6. Click **"Create Cluster"** (takes 3-5 minutes)

### Step 2: Create a Database User
1. While cluster is creating, click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Create credentials:
   - Username: `bookuser` (or your choice)
   - Password: Click **"Autogenerate Secure Password"** (SAVE THIS!)
5. Set **"Built-in Role"** to **"Read and write to any database"**
6. Click **"Add User"**

### Step 3: Allow Network Access
1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Confirm by clicking **"Confirm"**

### Step 4: Get Connection String
1. Click **"Database"** in left sidebar
2. Wait for cluster to finish creating (green "Active" status)
3. Click **"Connect"** button on your cluster
4. Choose **"Connect your application"**
5. Select **"Node.js"** driver
6. **COPY** the connection string - looks like:
```
mongodb+srv://bookuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Step 5: Prepare Connection String
Replace `<password>` with your actual database user password:
```
mongodb+srv://bookuser:YourActualPassword123@cluster0.xxxxx.mongodb.net/book-summarization?retryWrites=true&w=majority
```

**Important**: Add `/book-summarization` before the `?` to specify database name!

---

## ✅ Once you have the connection string, paste it here!

Just tell me: "Here's my connection string: mongodb+srv://..."

Or if you need help, share any error messages you see.
