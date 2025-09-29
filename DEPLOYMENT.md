# 🚀 Cloud Deployment Guide

Deploy your Tactical Arena Shooter for internet multiplayer testing!

## 🚂 Railway Deployment (Recommended)

### Server Deployment:
1. **Sign up**: Go to [railway.app](https://railway.app) and sign up with GitHub
2. **New Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select repo**: Choose your cursorgame repository
4. **Configure**:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Environment Variables**: None needed for basic setup
6. **Deploy**: Railway will auto-deploy and give you a URL like `https://your-app.railway.app`

### Client Deployment:
1. **New Service**: In same Railway project, add another service
2. **Configure**:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run preview`
3. **Environment Variables**:
   - `VITE_SERVER_URL` = `wss://your-server.railway.app/game` (use your server URL)
4. **Deploy**: Client will be available at another Railway URL

## 🎨 Render Deployment (Free Tier)

### Server (Web Service):
1. **Sign up**: Go to [render.com](https://render.com)
2. **New Web Service**: Connect your GitHub repo
3. **Configure**:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. **Deploy**: Get URL like `https://your-app.onrender.com`

### Client (Static Site):
1. **New Static Site**: Same repo, different service
2. **Configure**:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. **Environment Variables**:
   - `VITE_SERVER_URL` = `wss://your-server.onrender.com/game`

## 🌐 Vercel + Railway (Alternative)

### Server on Railway:
- Follow Railway server steps above

### Client on Vercel:
1. **Sign up**: Go to [vercel.com](https://vercel.com)
2. **Import Project**: Connect GitHub repo
3. **Configure**:
   - **Root Directory**: `client`
   - **Framework**: Vite
4. **Environment Variables**:
   - `VITE_SERVER_URL` = `wss://your-server.railway.app/game`

## 🔧 Local Environment Setup

Create `.env` file in client directory:
```env
VITE_SERVER_URL=ws://localhost:8080/game
```

For production, change to your deployed server URL:
```env
VITE_SERVER_URL=wss://your-server.railway.app/game
```

## 🧪 Testing Your Deployment

1. **Deploy server first** and note the WebSocket URL
2. **Update client** with server URL in environment variables
3. **Deploy client** 
4. **Share client URL** with friends for multiplayer testing!

## 💡 Pro Tips

- **Railway**: Easiest setup, great for prototypes
- **Render**: Free tier available, good for demos  
- **Vercel**: Best for client, pair with Railway for server
- **WebSocket URLs**: Use `wss://` (secure) for HTTPS sites
- **CORS**: No issues with WebSockets, but check if needed

## 🎮 What Players Will See

Once deployed, anyone can:
1. Visit your client URL
2. Click "⚔️ Matchmake 1v1"  
3. Get paired with other online players
4. Play real-time multiplayer!

## 🔒 Security Note

This is a **developer/testing deployment**. For production:
- Add authentication
- Rate limiting
- Input validation
- Anti-cheat measures
- Proper error handling
