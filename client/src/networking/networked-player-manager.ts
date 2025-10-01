import * as THREE from 'three'
import { PlayerModel } from '../components/player-model'
import { Vector3 } from '../types/shared'

export interface NetworkedPlayer {
  id: number
  model: PlayerModel
  lastPosition: Vector3
  lastRotation: Vector3
  targetPosition: Vector3  // Target position for interpolation
  targetRotation: Vector3  // Target rotation for interpolation
  lastUpdate: number
  isAlive: boolean
  updateCount?: number
}

export class NetworkedPlayerManager {
  private players = new Map<number, NetworkedPlayer>()
  private scene: THREE.Scene
  private interpolationDelay = 100 // ms behind for smooth interpolation

  constructor(scene: THREE.Scene) {
    this.scene = scene
    console.log('👥 NetworkedPlayerManager initialized')
  }

  addPlayer(playerId: number): void {
    if (this.players.has(playerId)) {
      console.warn(`⚠️ Player ${playerId} already exists`)
      return
    }

    console.log(`👤 Adding networked player ${playerId}`)
    console.log(`📊 Scene has ${this.scene.children.length} children before adding player`)
    
    // Create enemy player model (red)
    const playerModel = new PlayerModel('red')
    // Set initial position at ground level - model builds upward from this point
    playerModel.position.set(0, 0, 0)
    playerModel.name = `player-${playerId}` // Name for debugging
    
    // Make sure the model is visible and at correct scale
    playerModel.visible = true
    playerModel.scale.set(1, 1, 1)
    
    this.scene.add(playerModel)
    
    console.log(`✅ Player ${playerId} model added to scene`)

    // Create networked player data
    const networkedPlayer: NetworkedPlayer = {
      id: playerId,
      model: playerModel,
      lastPosition: { x: 0, y: 0, z: 0 },
      lastRotation: { x: 0, y: 0, z: 0 },
      targetPosition: { x: 0, y: 0, z: 0 },
      targetRotation: { x: 0, y: 0, z: 0 },
      lastUpdate: Date.now(),
      isAlive: true
    }

    this.players.set(playerId, networkedPlayer)
    console.log(`📝 Player ${playerId} stored in players map. Total players: ${this.players.size}`)
  }

  removePlayer(playerId: number): void {
    const player = this.players.get(playerId)
    if (!player) {
      console.warn(`⚠️ Player ${playerId} not found for removal`)
      return
    }

    console.log(`👋 Removing networked player ${playerId}`)
    
    // Remove from scene
    this.scene.remove(player.model)
    player.model.dispose()
    
    // Remove from tracking
    this.players.delete(playerId)
  }

  updatePlayerPosition(playerId: number, position: Vector3, rotation: Vector3): void {
    const player = this.players.get(playerId)
    if (!player) {
      console.warn(`⚠️ Player ${playerId} not found. Available players:`, Array.from(this.players.keys()))
      return
    }
    
    // Track update count for this player
    if (!player.updateCount) {
      player.updateCount = 0
    }
    player.updateCount++
    
    // Removed spammy position update logging
    
    // Set target position for smooth interpolation
    // Server sends ground-level position, so we use it directly
    player.targetPosition = { x: position.x, y: position.y, z: position.z }
    player.targetRotation = { ...rotation }
    
    // Update last known position
    player.lastUpdate = Date.now()
  }

  showPlayerShot(playerId: number): void {
    const player = this.players.get(playerId)
    if (!player) {
      console.warn(`⚠️ Player ${playerId} not found for shot effect`)
      return
    }

    console.log(`💥 Player ${playerId} fired weapon`)
    
    // Create muzzle flash effect at player position
    this.createMuzzleFlash(player.model.position)
    
    // TODO: Add weapon firing animation/sound
  }

  private createMuzzleFlash(position: THREE.Vector3): void {
    // Create a simple muzzle flash effect
    const flashGeometry = new THREE.SphereGeometry(0.1, 8, 8)
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    })
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial)
    flash.position.copy(position)
    flash.position.y += 1.5 // Approximate weapon height
    this.scene.add(flash)

    // Animate and remove flash
    let opacity = 0.8
    const fadeOut = () => {
      opacity -= 0.1
      flashMaterial.opacity = opacity
      
      if (opacity <= 0) {
        this.scene.remove(flash)
        flashGeometry.dispose()
        flashMaterial.dispose()
      } else {
        requestAnimationFrame(fadeOut)
      }
    }
    
    requestAnimationFrame(fadeOut)
  }

  // Update method called each frame for interpolation
  update(deltaTime: number): void {
    const currentTime = Date.now()
    const lerpFactor = Math.min(deltaTime * 10, 1) // Smooth interpolation (10x speed for responsiveness)
    
    this.players.forEach((player) => {
      // Smooth interpolation towards target position
      player.model.position.x = THREE.MathUtils.lerp(player.model.position.x, player.targetPosition.x, lerpFactor)
      player.model.position.y = THREE.MathUtils.lerp(player.model.position.y, player.targetPosition.y, lerpFactor)
      player.model.position.z = THREE.MathUtils.lerp(player.model.position.z, player.targetPosition.z, lerpFactor)
      
      // Smooth rotation interpolation
      player.model.rotation.y = THREE.MathUtils.lerp(player.model.rotation.y, player.targetRotation.y, lerpFactor)
      
      // Store current position for next frame
      player.lastPosition = {
        x: player.model.position.x,
        y: player.model.position.y,
        z: player.model.position.z
      }
      player.lastRotation = {
        x: player.model.rotation.x,
        y: player.model.rotation.y,
        z: player.model.rotation.z
      }
      
      // Check if player hasn't been updated recently (connection issues)
      const timeSinceUpdate = currentTime - player.lastUpdate
      if (timeSinceUpdate > 5000) { // 5 seconds
        console.warn(`⚠️ Player ${player.id} hasn't updated in ${timeSinceUpdate}ms`)
        // Could add visual indicator for disconnected players
      }
    })
  }

  // Get all networked players
  getPlayers(): Map<number, NetworkedPlayer> {
    return this.players
  }

  // Check if player exists
  hasPlayer(playerId: number): boolean {
    return this.players.has(playerId)
  }

  // Get player count
  getPlayerCount(): number {
    return this.players.size
  }

  // Cleanup
  dispose(): void {
    console.log('🧹 Disposing NetworkedPlayerManager')
    
    this.players.forEach((player) => {
      this.scene.remove(player.model)
      player.model.dispose()
    })
    
    this.players.clear()
  }
}
