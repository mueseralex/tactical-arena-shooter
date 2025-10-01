# 📤 GitHub Setup Guide for Railway Deployment

Follow these steps to upload your Tactical Arena Shooter to GitHub so Railway can deploy it.

## 🔧 Step 1: Install Git (if not already installed)

1. **Download Git**: Go to https://git-scm.com/download/win
2. **Install**: Run the installer with default settings
3. **Restart**: Close and reopen your terminal/PowerShell
4. **Verify**: Run `git --version` to confirm installation

## 🌐 Step 2: Create GitHub Repository

1. **Go to GitHub**: Visit https://github.com and sign in (or create account)
2. **New Repository**: Click the "+" icon → "New repository"
3. **Repository Settings**:
   - **Name**: `tactical-arena-shooter` (or your preferred name)
   - **Description**: "Real-time multiplayer 1v1 tactical shooter"
   - **Visibility**: Public (so Railway can access it)
   - **Initialize**: ❌ Don't check any boxes (we have files already)
4. **Create Repository**: Click "Create repository"

## 📁 Step 3: Upload Your Code

### Option A: Using Git Command Line

Open PowerShell in your game directory and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Tactical Arena Shooter with multiplayer"

# Add your GitHub repository as origin
git remote add origin https://github.com/YOUR_USERNAME/tactical-arena-shooter.git

# Push to GitHub
git push -u origin main
```

### Option B: Using GitHub Desktop (Easier)

1. **Download**: Get GitHub Desktop from https://desktop.github.com
2. **Install and Sign In**: Use your GitHub account
3. **Add Repository**: File → Add Local Repository → Choose your game folder
4. **Commit**: Write "Initial commit" and click "Commit to main"
5. **Publish**: Click "Publish repository" → Choose your repository name → Publish

### Option C: Using VS Code (If you have it)

1. **Open Folder**: Open your game folder in VS Code
2. **Source Control**: Click the Source Control icon (branch symbol)
3. **Initialize**: Click "Initialize Repository"
4. **Stage All**: Click "+" next to "Changes"
5. **Commit**: Write "Initial commit" and click "✓"
6. **Publish**: Click "Publish to GitHub" → Choose repository name

## 🚀 Step 4: Deploy on Railway

Once your code is on GitHub:

1. **Go to Railway**: Visit https://railway.app
2. **Sign Up**: Use your GitHub account
3. **New Project**: Click "New Project" → "Deploy from GitHub repo"
4. **Select Repository**: Choose your `tactical-arena-shooter` repo
5. **Deploy Server**:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. **Deploy Client** (Add another service):
   - **Root Directory**: `client`  
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run preview`
   - **Environment Variable**: `VITE_SERVER_URL` = `wss://your-server.railway.app/game`

## 🔍 Troubleshooting

### Git Not Found
- Make sure Git is installed and restart your terminal
- Try running `git --version` to verify

### Permission Denied
- Make sure your GitHub repository is public
- Check that you're signed into the correct GitHub account

### Files Not Uploading
- Check `.gitignore` file isn't excluding important files
- Make sure you're in the correct directory

### Railway Can't Find Files
- Verify your repository structure matches:
  ```
  your-repo/
  ├── client/
  ├── server/
  ├── shared/
  └── README.md
  ```

## ✅ Verification

After uploading, your GitHub repository should show:
- ✅ `client/` folder with game code
- ✅ `server/` folder with server code  
- ✅ `shared/` folder with types
- ✅ `README.md` with project description
- ✅ `.gitignore` to exclude node_modules
- ✅ `DEPLOYMENT.md` with deployment guide

## 🎮 Next Steps

1. **Upload to GitHub** (using one of the methods above)
2. **Deploy on Railway** (server first, then client)
3. **Test multiplayer** with friends!
4. **Share your game URL** with the world

---

**Need help?** Check the troubleshooting section or create a GitHub issue!


