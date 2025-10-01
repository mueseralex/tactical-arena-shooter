# Gameplay Fixes - October 1, 2025

## Issues Fixed

### 1. Player Hitbox Floating ✅
**Problem**: Player models were floating in the air instead of being on the ground.

**Root Cause**: 
- Server was spawning players at y=1.8 (player height)
- Client was setting networked player models to y=0 (ground level)
- The mismatch caused visual floating

**Solution**: The player models correctly handle height internally via `PlayerModel` class, so networked players start at y=0 (ground level) and the models render properly.

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
**Problem**: Players were spawning vertically (along z-axis) instead of horizontally (along x-axis) behind cover boxes.

**Root Cause**: Spawn points were configured for vertical spawning:
```typescript
// Old spawn points (vertical)
player1: { x: -12, y: 1.8, z: 8 }
player2: { x: 12, y: 1.8, z: 8 }
```

**Solution**: Changed spawn positions to horizontal (opposite sides of arena) behind cover:
```typescript
// New spawn points (horizontal - behind cover)
player1: { x: -15, y: 1.8, z: 0 } // Left side
player2: { x: 15, y: 1.8, z: 0 }  // Right side
```

Now players spawn behind the left/right side cover boxes, giving them protection at round start.

---

## Files Modified

1. **server/src/server.ts**
   - Updated `SPAWN_POINTS` for horizontal spawning

2. **client/index.html**
   - Fixed countdown overlay HTML structure
   - Removed duplicate `#hit-indicator` div

3. **client/src/core/game-engine.ts**
   - Added `gameState` management in countdown functions
   - Modified `update()` to respect game state for controls

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

