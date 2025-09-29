# 🎮 Tactical Arena Shooter

A real-time multiplayer 1v1 tactical shooter built with Three.js and WebSocket networking.

## 🚀 Features

- **Real-time multiplayer** - 1v1 matchmaking with WebSocket networking
- **First-person shooter** - Full FPS controls (WASD, mouse look, jump, crouch)
- **Tactical gameplay** - Arena with cover, fatigue systems, reload mechanics
- **Professional UI** - Server browser, matchmaking, settings menu
- **Cross-platform** - Browser-based, works on any device

## 🎯 Controls

- **WASD** - Move
- **Mouse** - Look around  
- **Space** - Jump
- **Shift/C** - Crouch
- **Left Click** - Shoot
- **R** - Reload
- **M** - Menu

## 🌐 Play Online

**Live Demo**: [Your deployed URL will go here]

## 🛠️ Local Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Start game server
cd server && npm run dev

# Start game client (in new terminal)
cd client && npm run dev
```

### Local URLs
- **Game Client**: http://localhost:5173
- **Game Server**: ws://localhost:8080/game

## 🚀 Deployment

This game is configured for easy deployment on:
- **Railway** (recommended)
- **Render** (free tier)
- **Vercel + Railway**

See `DEPLOYMENT.md` for detailed deployment instructions.

## 🏗️ Architecture

```
├── client/          # Game client (Three.js + Vite)
│   ├── src/
│   │   ├── core/           # Game engine
│   │   ├── systems/        # Game systems (controls, collision)
│   │   ├── components/     # Game objects (arena, player, weapon)
│   │   ├── networking/     # Client networking
│   │   └── ui/            # User interface
│   └── package.json
├── server/          # Game server (Node.js + WebSocket)
│   ├── src/
│   │   └── server.ts      # WebSocket server with matchmaking
│   └── package.json
└── shared/          # Shared types and constants
    └── types.ts
```

## 🎮 Gameplay Features

- **Matchmaking**: Automatic 1v1 player pairing
- **Real-time sync**: 20Hz position updates
- **Weapon system**: Pistol with reload mechanics
- **Movement**: Counter-Strike style fatigue systems
- **Arena**: Tactical cover-based map design
- **Settings**: Customizable sensitivity, FOV, viewmodel

## 🔧 Technical Details

- **Client**: Three.js, TypeScript, Vite
- **Server**: Node.js, WebSocket (ws library)
- **Networking**: Custom protocol with message types
- **Rendering**: WebGL with Three.js
- **Physics**: Custom collision detection
- **Audio**: Web Audio API for sound effects

## 📝 License

This project is for educational and demonstration purposes.

## 🤝 Contributing

This is a learning project! Feel free to fork and experiment.

---

**Built with ❤️ using Three.js and WebSocket**