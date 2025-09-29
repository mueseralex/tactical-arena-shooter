# Architecture Documentation - Tactical Arena Shooter

## Project Structure
*This file will document the purpose and relationships of all project files as they are created*

---

## Current Architecture
**Status:** Step 1 Complete - Basic Three.js Foundation  
**Last Updated:** September 29, 2025

## File Organization

### Root Level
- `package.json` - Project dependencies and scripts
- `vite.config.ts` - Vite build configuration for client
- `tsconfig.json` - TypeScript configuration for entire project
- `README.md` - Project setup and usage instructions
- `.cursor/rules` - Development guidelines and best practices

### Client Structure (`client/`)
- `index.html` - Main HTML with canvas and UI elements
- `src/main.ts` - Application entry point and initialization
- `src/core/game-engine.ts` - Main game engine class with Three.js setup
- `src/core/` - Core game systems (engine, renderer, etc.)
- `src/components/` - Game objects and entities (future)
- `src/systems/` - Game logic systems (future)
- `src/networking/` - Client-side network communication (future)
- `src/ui/` - User interface components (future)
- `public/` - Static assets (future)

### Server Structure (`server/`)
- `src/server.ts` - WebSocket server with player connection handling
- `src/game/` - Server-side game logic (future)
- `src/networking/` - Server networking utilities (future)
- `src/utils/` - Server utility functions (future)

### Shared Code (`shared/`)
- `types.ts` - TypeScript interfaces for client-server communication

### Documentation (`memory-bank/`)
- `game-design-document.md` - Complete game design specification
- `tech-stack.md` - Technical architecture decisions
- `implementation-plan.md` - Step-by-step development roadmap
- `progress.md` - Development progress tracking
- `architecture.md` - This file - system architecture documentation

## Key Systems

### GameEngine (`client/src/core/game-engine.ts`)
**Purpose:** Central game engine managing Three.js rendering and game loop
**Responsibilities:**
- Three.js renderer, scene, camera initialization
- Lighting system with directional and ambient lights
- Basic environment setup (ground plane, test objects)
- Game loop with delta time calculation
- Performance monitoring and FPS tracking
- Window resize and visibility change handling
- Resource cleanup and disposal

**Key Methods:**
- `initialize()` - Async setup of all game components
- `start()` - Begin the game loop
- `gameLoop()` - Main update/render cycle
- `handleResize()` - Responsive canvas resizing

### WebSocket Server (`server/src/server.ts`)
**Purpose:** Real-time multiplayer communication hub
**Responsibilities:**
- Player connection and disconnection handling
- Message broadcasting between players
- Basic player state tracking (position, health)
- Ping/pong latency measurement
- Error handling and graceful shutdown

**Message Types Handled:**
- `ping` - Latency measurement
- `player_position` - Position synchronization
- `player_shoot` - Weapon firing events

## Data Flow

### Client Initialization
1. `main.ts` creates GameEngine instance
2. GameEngine initializes Three.js components
3. Scene, camera, lighting, and environment setup
4. Game loop starts with continuous render cycle
5. UI elements (FPS counter, crosshair) activated

### Server Communication (Ready for Step 7)
1. Client connects to WebSocket server
2. Server assigns unique player ID
3. Player state synchronized via message passing
4. Server broadcasts events to all connected players
5. Client interpolates remote player movements

### Performance Pipeline
1. Three.js renders at 60 FPS target
2. FPS counter updates every second
3. Color-coded performance feedback (Green/Yellow/Red)
4. Delta time used for frame-rate independent updates
5. Resource disposal prevents memory leaks

## Performance Considerations

### Rendering Optimizations
- **Shadow Mapping:** 2048x2048 resolution for quality/performance balance
- **Fog System:** Reduces distant object rendering load
- **Grid Helper:** Low-opacity reference grid for development
- **Pixel Ratio:** Capped at 2x for high-DPI displays

### Memory Management
- **Resource Disposal:** Proper cleanup of geometries and materials
- **Object Pooling:** Planned for bullets and particles (future)
- **Texture Management:** WebP format planned for assets

### Network Efficiency
- **Binary Protocols:** Planned for game state synchronization
- **Client Prediction:** Ready for implementation in controls
- **Interpolation:** Smooth remote player movement (future)

### Development Performance
- **Vite HMR:** Fast development with hot module replacement
- **TypeScript:** Compile-time error catching
- **Modular Architecture:** Separate systems for maintainability

## Technical Debt and Future Improvements

### Current Limitations
- No input handling system yet
- Static test cube instead of dynamic objects
- Basic lighting setup needs enhancement for tactical gameplay
- No collision detection system

### Planned Enhancements (Next Steps)
- First-person camera controls (Step 2)
- Arena environment with cover objects (Step 3)
- Player models and animations (Step 4)
- Weapon system implementation (Step 5)
- Multiplayer synchronization (Step 7)
