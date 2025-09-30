import * as THREE from 'three'
import { PlayerModel } from '../components/player-model'
import { Vector3 } from '../types/shared'

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

    console.log(`👤 Adding networked player ${playerId} to scene`)
    console.log(`👥 Current players in manager:`, Array.from(this.players.keys()))
    console.log(`🎬 Scene children count before:`, this.scene.children.length)
    
    // Create player model
    const playerModel = new PlayerModel('red') // Enemy player
    playerModel.position.set(0, 1.8, 0) // Start at ground level, will be updated from server
    playerModel.visible = true // Ensure visibility
    playerModel.scale.set(2, 2, 2) // Make it bigger for testing visibility
    this.scene.add(playerModel)
    
    // Add a bright test cube to make sure we can see SOMETHING
    const testGeometry = new THREE.BoxGeometry(1, 1, 1)
    const testMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
    const testCube = new THREE.Mesh(testGeometry, testMaterial)
    testCube.position.set(0, 3, 0) // Above the player model
    playerModel.add(testCube) // Attach to player model so it moves with it
    console.log(`🔴 Added bright red test cube above player ${playerId}`)
    
    console.log(`🎬 Scene children count after:`, this.scene.children.length)
    console.log(`✅ Networked player ${playerId} model added to scene at position (0, 1.8, 0)`)
    console.log(`👁️ New player model visibility:`, playerModel.visible)
    console.log(`📏 New player model scale:`, playerModel.scale)
    console.log(`🎯 New player model world position:`, playerModel.getWorldPosition(new THREE.Vector3()))

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

    console.log(`📍 Updating player ${playerId} position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`)

    // Store the server position for interpolation
    player.lastPosition = { ...position }
    player.lastRotation = { ...rotation }
    player.lastUpdate = Date.now()

    // Immediately update position (we can add interpolation later)
    player.model.position.set(position.x, position.y, position.z)
    player.model.rotation.set(rotation.x, rotation.y, rotation.z)
    
    // Force the model to be visible and check if it's in the scene
    player.model.visible = true
    console.log(`👁️ Player ${playerId} model visibility:`, player.model.visible)
    console.log(`🎬 Player ${playerId} model in scene:`, this.scene.children.includes(player.model))
    console.log(`📏 Player ${playerId} model scale:`, player.model.scale)
    console.log(`🎯 Player ${playerId} model world position:`, player.model.getWorldPosition(new THREE.Vector3()))
    
    console.log(`✅ Player ${playerId} model updated in scene`)
    
    console.log(`🔄 Updated player ${playerId} position to (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`)
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
