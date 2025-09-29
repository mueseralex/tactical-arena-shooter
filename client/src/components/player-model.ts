import * as THREE from 'three'

export class PlayerModel {
  private scene: THREE.Scene
  private playerGroup: THREE.Group
  private teamColor: 'blue' | 'red'
  
  // Player dimensions for cover mechanics
  private readonly PLAYER_HEIGHT = 1.8 // Raised height for better proportions
  private readonly CAPSULE_RADIUS = 0.25
  private readonly HEAD_RADIUS = 0.15

  constructor(scene: THREE.Scene, teamColor: 'blue' | 'red' = 'blue') {
    this.scene = scene
    this.teamColor = teamColor
    this.playerGroup = new THREE.Group()
    this.playerGroup.name = `player-model-${teamColor}`
    
    this.createPlayerModel()
    this.scene.add(this.playerGroup)
  }

  private createPlayerModel(): void {
    // Get team colors
    const colors = this.getTeamColors()
    
    // Create capsule body (like the reference image - capsule torso)
    const headSphereRadius = this.HEAD_RADIUS * 1.5 // Bigger head like in reference
    const bodyHeight = this.PLAYER_HEIGHT - (headSphereRadius * 2) - 0.1 // Leave space for sphere head
    const bodyGeometry = new THREE.CapsuleGeometry(this.CAPSULE_RADIUS, bodyHeight, 8, 16)
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: colors.body,
      transparent: false
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.set(0, bodyHeight / 2 + this.CAPSULE_RADIUS, 0)
    body.castShadow = true
    body.receiveShadow = true
    this.playerGroup.add(body)

    // Create sphere head sitting on top of capsule body (like reference)
    const headGeometry = new THREE.SphereGeometry(headSphereRadius, 16, 12)
    const headMaterial = new THREE.MeshLambertMaterial({ 
      color: colors.head,
      transparent: false
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.set(0, bodyHeight + this.CAPSULE_RADIUS + headSphereRadius, 0)
    head.castShadow = true
    head.receiveShadow = true
    this.playerGroup.add(head)

    // Add subtle glow effect for better visibility
    this.addGlowEffect(body, colors.glow)
    
    // Add simple face indicator (two dots for eyes on the sphere head)
    this.addFaceIndicator(head, colors.face)

    console.log(`✅ ${this.teamColor} player model created (height: ${this.PLAYER_HEIGHT}m)`)
  }

  private getTeamColors(): { body: number, head: number, glow: number, face: number } {
    if (this.teamColor === 'blue') {
      return {
        body: 0x4a90e2,    // Blue body
        head: 0x5ba3f5,    // Lighter blue head
        glow: 0x6bb6ff,    // Glow color
        face: 0x2c3e50     // Dark face features
      }
    } else {
      return {
        body: 0xe74c3c,    // Red body
        head: 0xf39c12,    // Orange-red head
        glow: 0xff6b6b,    // Red glow
        face: 0x2c3e50     // Dark face features
      }
    }
  }

  private addGlowEffect(body: THREE.Mesh, glowColor: number): void {
    // Create a slightly larger capsule for glow effect
    const glowGeometry = body.geometry.clone()
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.scale.setScalar(1.05) // Slightly larger
    body.add(glow)
  }

  private addFaceIndicator(head: THREE.Mesh, faceColor: number): void {
    // Simple eyes - two small spheres positioned on the sphere head
    const eyeGeometry = new THREE.SphereGeometry(0.03, 6, 4)
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: faceColor })
    
    // Position eyes on the front of the sphere head
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-0.08, 0.05, 0.15) // On the sphere surface
    head.add(leftEye)
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    rightEye.position.set(0.08, 0.05, 0.15) // On the sphere surface
    head.add(rightEye)
  }

  // Animation methods
  startWalkingAnimation(): void {
    // Simple bobbing animation for walking
    const walkAnimation = () => {
      const time = Date.now() * 0.005
      const bobAmount = 0.05
      this.playerGroup.position.y = Math.sin(time) * bobAmount
      
      // Slight rotation sway
      this.playerGroup.rotation.z = Math.sin(time * 1.2) * 0.02
    }
    
    // Store animation function for later cleanup
    (this.playerGroup as any).walkAnimation = walkAnimation
  }

  stopWalkingAnimation(): void {
    // Reset position and rotation
    this.playerGroup.position.y = 0
    this.playerGroup.rotation.z = 0
    
    // Remove animation function
    delete (this.playerGroup as any).walkAnimation
  }

  // Crouching animation
  setCrouching(isCrouching: boolean): void {
    const targetScale = isCrouching ? 0.7 : 1.0
    
    // Animate scale change
    const currentScale = this.playerGroup.scale.y
    const scaleStep = (targetScale - currentScale) * 0.1
    this.playerGroup.scale.y += scaleStep
    
    // Adjust position to keep feet on ground
    if (isCrouching) {
      this.playerGroup.position.y = -(this.PLAYER_HEIGHT * 0.15)
    } else {
      this.playerGroup.position.y = 0
    }
  }

  // Update method for animations
  update(deltaTime: number): void {
    // Run walking animation if active
    if ((this.playerGroup as any).walkAnimation) {
      (this.playerGroup as any).walkAnimation()
    }
  }

  // Position and rotation methods
  setPosition(x: number, y: number, z: number): void {
    this.playerGroup.position.set(x, y, z)
  }

  setRotation(x: number, y: number, z: number): void {
    this.playerGroup.rotation.set(x, y, z)
  }

  // Get player dimensions for game logic
  getPlayerHeight(): number {
    return this.PLAYER_HEIGHT
  }

  getPlayerRadius(): number {
    return this.CAPSULE_RADIUS
  }

  // Team color methods
  getTeamColor(): 'blue' | 'red' {
    return this.teamColor
  }

  setTeamColor(color: 'blue' | 'red'): void {
    this.teamColor = color
    // Recreate model with new colors
    this.playerGroup.clear()
    this.createPlayerModel()
  }

  // Visibility methods
  setVisible(visible: boolean): void {
    this.playerGroup.visible = visible
  }

  // Get the Three.js group for external manipulation
  getGroup(): THREE.Group {
    return this.playerGroup
  }

  // Cleanup method
  dispose(): void {
    this.playerGroup.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (object.material instanceof THREE.Material) {
          object.material.dispose()
        } else if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose())
        }
      }
    })
    
    this.scene.remove(this.playerGroup)
    console.log(`🧹 ${this.teamColor} player model disposed`)
  }
}
