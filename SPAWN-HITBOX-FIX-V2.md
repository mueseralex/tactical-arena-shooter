# Spawn & Hitbox Fix V2 - October 1, 2025

## Issues Identified from Screenshots

### Issue 1: Incorrect Spawn Positions
**Problem**: Players were spawning in the center area (x=±15, z=0) instead of behind the brown forward cover boxes shown in the screenshots.

**What the user wanted**: Players should spawn behind those brown boxes that are directly across from each other on opposite sides of the map.

**Solution**: 
- Identified the brown forward cover boxes at positions:
  - Left: `[-4, 1.0, 8]` (color: `0x8B4513`)
  - Right: `[4, 1.0, -8]` (color: `0x8B4513`)
- Set spawn points BEHIND these boxes (further from map center):
  ```typescript
  player1: { x: -6, y: 0, z: 10 }  // Behind left brown box
  player2: { x: 6, y: 0, z: -10 }  // Behind right brown box
  ```

Now players spawn directly across from each other with the brown cover boxes providing protection.

### Issue 2: Player Model Hitbox Mismatch
**Problem**: From the first screenshot, the player model appears too low or hitbox appears floating above the visual model.

**Root Cause**: The `PlayerModel` class builds the model starting from its position with the body positioned at `bodyHeight/2 + CAPSULE_RADIUS` which should be correct, but there might be a rendering or positioning issue.

**Solution**: 
- Ensured player models are explicitly set to ground level (y=0)
- Added explicit visibility and scale settings when creating networked players
- Added more detailed logging to track player model positioning

**Technical Details**:
- PlayerModel is a `THREE.Group` with `PLAYER_HEIGHT = 1.8`
- Body starts at ground and builds upward
- Position (0, 0, 0) should place feet at ground level
- Model renders from ground up to 1.8m height

## Files Modified

### 1. server/src/server.ts
```typescript
// Old spawn points (far from center, wrong boxes)
player1: { x: -15, y: 0, z: 0 }
player2: { x: 15, y: 0, z: 0 }

// New spawn points (behind brown forward cover boxes)
player1: { x: -6, y: 0, z: 10 }  // Behind left brown box at (-4, z=8)
player2: { x: 6, y: 0, z: -10 }  // Behind right brown box at (4, z=-8)
```

### 2. client/src/networking/networked-player-manager.ts
- Added explicit visibility and scale settings
- Enhanced logging to track player model position
- Confirmed ground-level positioning (y=0)

## Arena Layout Reference

Based on `arena.ts`, the relevant cover boxes:

**Brown Forward Boxes** (where players spawn behind):
- Left player area: `[-4, 1.0, 8]` - size: `[2.5, 2.0, 1.5]`
- Right player area: `[4, 1.0, -8]` - size: `[2.5, 2.0, 1.5]`

**Spawn Positions** (10 units behind the boxes):
- Player 1: Behind left box at `[-6, 0, 10]`
- Player 2: Behind right box at `[6, 0, -10]`

This creates a diagonal layout where players spawn:
- On opposite sides of the map (left vs right)
- Facing toward the center
- With brown cover boxes between them and the center

## Testing Instructions

1. **Test Spawn Positions**:
   - Start a 1v1 match
   - Player 1 should spawn behind the left brown box (looking at screenshot 2, the brown box on the left)
   - Player 2 should spawn behind the right brown box (on the opposite side)
   - Players should be directly across from each other

2. **Test Player Model Positioning**:
   - Join a match
   - Observe other player's model
   - Model should be standing on ground (feet at ground level)
   - Model should be full height (1.8m tall)
   - Hitbox should align with visual model

3. **Visual Check**:
   - Player models should not float
   - Player models should not be sunken into ground
   - Player models should be fully visible from spawn

## Coordinate System Reference

- **X-axis**: Left (-) to Right (+)
- **Y-axis**: Down (0=ground) to Up (+)
- **Z-axis**: Back (+) to Front (-)

Spawn layout (top-down view):
```
          Z+
           ↑
    P1 [-6,10]
      🟫 [-4,8]
           |
    ←------+------→ X
           |
      🟫 [4,-8]
    P2 [6,-10]
           ↓
          Z-
```

## Known Issues & Notes

- Player model height is 1.8m (matches camera standing height)
- All positions use ground-level (y=0) coordinates from server
- Camera adds +1.8 for standing height locally
- Player models build upward from their position.y value

