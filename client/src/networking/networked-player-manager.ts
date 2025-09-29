import * as THREE from 'three'
import { PlayerModel } from '../components/player-model'
import { Vector3 } from '../../../shared/types'

export interface NetworkedPlayer {
  id: number
  model: PlayerModel
  lastPosition: Vector3
  lastRotation: Vector3
  lastUpdate: number
  isAlive: boolean
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
    
    // Create player model
    const playerModel = new PlayerModel()
    playerModel.position.set(0, 0, 0) // Will be updated from server
    this.scene.add(playerModel)

    // Create networked player data
    const networkedPlayer: NetworkedPlayer = {
      id: playerId,
      model: playerModel,
      lastPosition: { x: 0, y: 0, z: 0 },
      lastRotation: { x: 0, y: 0, z: 0 },
      lastUpdate: Date.now(),
      isAlive: true
    }

    this.players.set(playerId, networkedPlayer)
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
      console.warn(`⚠️ Player ${playerId} not found for position update`)
      return
    }

    // Store the server position for interpolation
    player.lastPosition = { ...position }
    player.lastRotation = { ...rotation }
    player.lastUpdate = Date.now()

    // Immediately update position (we can add interpolation later)
    player.model.position.set(position.x, position.y, position.z)
    player.model.rotation.set(rotation.x, rotation.y, rotation.z)
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
    
    this.players.forEach((player) => {
      // Add smooth interpolation here if needed
      // For now, we're doing immediate updates in updatePlayerPosition
      
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
