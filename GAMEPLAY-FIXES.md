# Gameplay Fixes - October 1, 2025

## Issues Fixed

### 1. Player Hitbox Floating ✅
**Problem**: Player models were floating in the air instead of being on the ground. Hitboxes didn't match visual position.

**Root Cause**: 
- Server was sending camera height (y=1.8) instead of ground-level position (y=0)
- Client was hardcoding networked player models to y=0 regardless of server data
- Local player was sending camera height, but networked players were rendering at ground level
- This caused a mismatch between hitboxes and visual models

**Solution**: 
1. **Server**: Changed all positions to ground-level (y=0). Spawn points and player positions are now ground-based.
2. **Client Camera**: When receiving spawn position, add standing height (+1.8) to place camera correctly.
3. **Position Broadcasting**: Modified `sendPositionUpdate()` to send ground position (camera.y - currentHeight) instead of camera height.
4. **Networked Players**: Use server's y position directly instead of hardcoding to 0.

Now all positions are ground-level throughout the system, and the camera/model heights are added locally as needed.

---

### 2. Countdown Screen Positioning ✅
**Problem**: Countdown overlay was skewed to the right side of the screen.

**Root Cause**: HTML structure had incorrect div nesting - the countdown overlay was nested inside `#competitive-hud` div instead of being a sibling.

**Solution**: Moved `#countdown-overlay` outside of `#competitive-hud` to be a direct child of `#ui`, ensuring proper centering via flexbox.

**Changes**:
```html
<!-- Before: countdown was inside #competitive-hud -->
<div id="competitive-hud">
  ...
  <div id="countdown-overlay">...</div>
</div>

<!-- After: countdown is sibling to #competitive-hud -->
<div id="competitive-hud">
  ...
</div>
<div id="countdown-overlay">...</div>
```

---

### 3. Movement During Countdown ✅
**Problem**: Players could move around during the countdown timer before the round started.

**Root Cause**: Controls were always active when `isLocked` was true, regardless of game state.

**Solution**: 
1. Set `gameState = 'menu'` when countdown starts
2. Set `gameState = 'playing'` when countdown completes
3. Modified `update()` to only update controls when `gameState === 'playing'`

**Changes**:
```typescript
// In showMatchStartCountdown() and showRoundCountdown()
this.gameState = 'menu' // Disable movement

// After countdown completes
this.gameState = 'playing' // Re-enable movement

// In update()
if (this.controls && this.gameState === 'playing') {
  this.controls.update(deltaTime)
}
```

---

### 4. Spawn Positions ✅
**Problem**: Players were spawning vertically (along z-axis at positions z=8 and z=-8) instead of horizontally (along x-axis) behind side lane cover boxes.

**Root Cause**: Spawn points were configured for vertical spawning along the Z-axis instead of the X-axis where the side lane cover is located.

**Solution**: Changed spawn positions to horizontal (opposite sides of arena) behind the side lane cover:
```typescript
// Old spawn points (vertical along Z-axis)
player1: { x: -12, y: 1.8, z: 8 }
player2: { x: 12, y: 1.8, z: 8 }

// New spawn points (horizontal along X-axis behind side lanes)
player1: { x: -15, y: 0, z: 0 } // Left side (behind cover at x=-12)
player2: { x: 15, y: 0, z: 0 }  // Right side (behind cover at x=12)
```

Now players spawn behind the left/right side lane cover boxes at x=-12 and x=12, giving them protection at round start and creating a horizontal layout.

---

## Files Modified

1. **server/src/server.ts**
   - Updated `SPAWN_POINTS` for horizontal spawning behind side lane cover (x=-15, x=15, z=0)
   - Changed all position y-coordinates from 1.8 to 0 (ground-level)
   - Updated default player position to (0, 0, 0)

2. **client/index.html**
   - Fixed countdown overlay HTML structure
   - Removed duplicate `#hit-indicator` div

3. **client/src/core/game-engine.ts**
   - Added `gameState` management in countdown functions
   - Modified `update()` to respect game state for controls
   - Updated spawn position handling to add standing height (+1.8) to ground-level server positions

4. **client/src/systems/first-person-controls.ts**
   - Modified `sendPositionUpdate()` to send ground-level position (camera.y - currentHeight)
   - This ensures consistent ground-based positioning across all clients

5. **client/src/networking/networked-player-manager.ts**
   - Updated `updatePlayerPosition()` to use server's y position directly
   - Removed hardcoded y=0 override, now respects server position data

---

## Testing Instructions

1. **Test Spawn Positions**:
   - Start a match with two clients
   - Verify players spawn on opposite sides (left/right) behind cover boxes
   - Players should spawn at x = -15 and x = 15

2. **Test Countdown**:
   - Start a match
   - Verify countdown appears centered on screen
   - Try moving during countdown - movement should be disabled
   - After "GO!" appears, movement should re-enable

3. **Test Player Heights**:
   - Join a match and observe other players
   - Player models should be standing on ground, not floating
   - Verify hitboxes align with visual models

---

## Related Documentation

- See `MULTIPLAYER-FIX.md` for initial multiplayer synchronization fixes
- See `MULTIPLAYER-CLEANUP.md` for dummy model removal
- See `MULTIPLAYER-SYNC-FIX.md` for movement interpolation fixes

