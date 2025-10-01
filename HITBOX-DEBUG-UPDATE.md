# Hitbox Debugging & Damage Update - October 1, 2025

## Changes Made

### 1. Visual Hitbox Debugging ✅

Added wireframe boxes around all player models to visualize the hitboxes:

**Body Hitbox** (Green wireframe):
- Height: 0 to 1.6m (ground to shoulders)
- Size: 0.6m × 1.6m × 0.6m
- Color: Green (#00ff00)
- Opacity: 50%

**Head Hitbox** (Red wireframe):
- Height: 1.6m to 1.8m (shoulders to top of head)
- Size: 0.4m × 0.2m × 0.4m
- Color: Red (#ff0000)
- Opacity: 70%

### 2. Damage Values Updated ✅

**Body Shots**: 34 damage
- 3 shots to kill (34 × 3 = 102 HP)
- No distance falloff
- Consistent damage at all ranges

**Headshots**: 100 damage
- 1-shot kill
- Instant elimination
- Rewards accuracy

### 3. Hitbox Detection

The server now correctly detects hits based on:
- **Body**: Any hit between 0m and 1.6m height
- **Head**: Any hit between 1.6m and 1.8m height
- Both hitboxes are visualized on all player models for testing

## Files Modified

### 1. client/src/components/player-model.ts
- Added `bodyHitbox` and `headHitbox` properties
- Created `createHitboxVisualization()` method
- Body hitbox: green wireframe (0-1.6m)
- Head hitbox: red wireframe (1.6-1.8m)
- Both hitboxes are added to the player model on creation

### 2. server/src/server.ts
- Updated damage values:
  - Body: 34 damage (3-shot kill)
  - Head: 100 damage (1-shot kill)
- Removed distance-based damage falloff for consistency
- Headshot detection threshold: 1.6m and above

## Visual Guide

```
      1.8m ┌─────┐ ← Top of head
           │ RED │ ← Head hitbox (1.6-1.8m)
      1.6m ├─────┤ ← Shoulders
           │     │
           │GREEN│ ← Body hitbox (0-1.6m)
           │     │
           │     │
       0m  └─────┘ ← Ground level
```

## Testing Instructions

### Visual Hitbox Test
1. Join a match
2. Look at other players
3. You should see:
   - **Green wireframe box** covering the body (large box from ground to shoulders)
   - **Red wireframe box** covering the head (small box on top)
4. Verify hitboxes align with the player model

### Body Shot Test
1. Aim at the **green hitbox** (body)
2. Shoot 3 times
3. Enemy should die after the 3rd shot
4. Each shot should deal 34 damage

### Headshot Test
1. Aim at the **red hitbox** (head)
2. Shoot once
3. Enemy should die instantly
4. Should deal 100 damage (one-shot kill)

### Hitbox Alignment Test
1. Shoot at the visible player model's body
2. Hit should register (green hitbox)
3. Shoot at the visible player model's head
4. Hit should register as headshot (red hitbox)
5. Shooting above or below the hitboxes should miss

## Damage Summary

| Hit Location | Damage | Shots to Kill |
|--------------|--------|---------------|
| Body (Green) | 34     | 3 shots       |
| Head (Red)   | 100    | 1 shot        |
| Miss         | 0      | N/A           |

## Notes

- Hitbox visualization is always visible for debugging
- To remove hitboxes later, simply comment out the `createHitboxVisualization()` call
- Body hitbox (0-1.6m) covers 88.9% of player height
- Head hitbox (1.6-1.8m) covers 11.1% of player height
- This creates a skill-based mechanic rewarding headshots

