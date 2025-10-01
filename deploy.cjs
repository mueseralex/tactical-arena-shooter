#!/usr/bin/env node

/**
 * Quick deployment helper for Tactical Arena Shooter
 * This script helps set up environment variables for different deployment platforms
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 Tactical Arena Shooter - Deployment Helper')
console.log('============================================')

// Check if we're in the right directory
if (!fs.existsSync('client') || !fs.existsSync('server')) {
  console.error('❌ Please run this script from the project root directory')
  process.exit(1)
}

console.log('\n📋 Deployment Checklist:')
console.log('1. ✅ Server code ready (WebSocket on port 8080)')
console.log('2. ✅ Client code ready (Vite build)')
console.log('3. ✅ Environment variable support added')

console.log('\n🌐 Deployment Options:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

console.log('\n🚂 RAILWAY (Recommended):')
console.log('   1. Go to: https://railway.app')
console.log('   2. New Project → Deploy from GitHub')
console.log('   3. Deploy server first (root: server/)')
console.log('   4. Deploy client second (root: client/)')
console.log('   5. Set VITE_SERVER_URL to your server WebSocket URL')

console.log('\n🎨 RENDER (Free Tier):')
console.log('   1. Go to: https://render.com')
console.log('   2. Web Service for server (root: server/)')
console.log('   3. Static Site for client (root: client/)')
console.log('   4. Set VITE_SERVER_URL environment variable')

console.log('\n⚡ VERCEL + RAILWAY:')
console.log('   1. Server on Railway (as above)')
console.log('   2. Client on Vercel (vercel.com)')
console.log('   3. Set VITE_SERVER_URL in Vercel dashboard')

console.log('\n🔧 Environment Variables:')
console.log('   Client needs: VITE_SERVER_URL')
console.log('   Example: wss://your-server.railway.app/game')
console.log('   (Use wss:// for secure WebSocket over HTTPS)')

console.log('\n🧪 Testing:')
console.log('   1. Deploy server → get WebSocket URL')
console.log('   2. Update client env var → deploy client')
console.log('   3. Share client URL with friends!')
console.log('   4. Both click "Matchmake 1v1" to test')

console.log('\n📁 File Structure:')
console.log('   ├── server/          (Deploy as Web Service)')
console.log('   │   ├── src/server.ts')
console.log('   │   ├── package.json')
console.log('   │   └── railway.json')
console.log('   ├── client/          (Deploy as Static Site)')
console.log('   │   ├── src/')
console.log('   │   ├── package.json')
console.log('   │   └── vite.config.ts')
console.log('   └── shared/types.ts')

console.log('\n✨ Ready to deploy! Check DEPLOYMENT.md for detailed steps.')
console.log('🎮 Happy multiplayer gaming!')


