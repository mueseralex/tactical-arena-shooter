import * as THREE from 'three'

export class Arena {
  private scene: THREE.Scene
  private arenaGroup: THREE.Group
  
  // Arena dimensions (from game design document)
  private readonly ARENA_WIDTH = 40
  private readonly ARENA_HEIGHT = 25
  
  // Cover object configurations
  private coverObjects: THREE.Mesh[] = []
  private wallObjects: THREE.Mesh[] = []
  
  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.arenaGroup = new THREE.Group()
    this.arenaGroup.name = 'arena'
    
    this.createArena()
    this.scene.add(this.arenaGroup)
  }

  private createArena(): void {
    this.createGround()
    this.createWalls()
    this.createCoverObjects()
    
    console.log('✅ Tactical arena created with cover objects')
  }

  private createGround(): void {
    // Main arena floor
    const groundGeometry = new THREE.PlaneGeometry(this.ARENA_WIDTH, this.ARENA_HEIGHT)
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x2a2a2a,
      transparent: false
    })
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    ground.position.y = 0
    ground.name = 'arena-ground'
    
    this.arenaGroup.add(ground)
    
    // Arena boundary lines for visual clarity
    const lineGeometry = new THREE.EdgesGeometry(groundGeometry)
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x666666,
      transparent: true,
      opacity: 0.5
    })
    
    const wireframe = new THREE.LineSegments(lineGeometry, lineMaterial)
    wireframe.rotation.x = -Math.PI / 2
    wireframe.position.y = 0.01 // Slightly above ground to prevent z-fighting
    
    this.arenaGroup.add(wireframe)
  }

  private createWalls(): void {
    const wallHeight = 3
    const wallThickness = 0.5
    const wallMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x404040,
      transparent: true,
      opacity: 0.8
    })

    // North wall
    const northWall = this.createWall(this.ARENA_WIDTH, wallHeight, wallThickness)
    northWall.position.set(0, wallHeight / 2, -this.ARENA_HEIGHT / 2)
    
    // South wall
    const southWall = this.createWall(this.ARENA_WIDTH, wallHeight, wallThickness)
    southWall.position.set(0, wallHeight / 2, this.ARENA_HEIGHT / 2)
    
    // East wall
    const eastWall = this.createWall(wallThickness, wallHeight, this.ARENA_HEIGHT)
    eastWall.position.set(this.ARENA_WIDTH / 2, wallHeight / 2, 0)
    
    // West wall
    const westWall = this.createWall(wallThickness, wallHeight, this.ARENA_HEIGHT)
    westWall.position.set(-this.ARENA_WIDTH / 2, wallHeight / 2, 0)

    // Apply material and add to scene
    ;[northWall, southWall, eastWall, westWall].forEach((wall, index) => {
      wall.material = wallMaterial
      wall.castShadow = true
      wall.receiveShadow = true
      wall.name = `wall-${index}`
      this.wallObjects.push(wall)
      this.arenaGroup.add(wall)
    })
  }

  private createWall(width: number, height: number, depth: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth)
    const material = new THREE.MeshLambertMaterial({ color: 0x404040 })
    return new THREE.Mesh(geometry, material)
  }

  private createCoverObjects(): void {
    // Linear spawn-to-spawn layout with player-height cover boxes
    const coverConfigs = [
      // PLAYER 1 SPAWN AREA (back of map - positive Z) - No center spawn box
      { size: [2, 2.0, 1.5], position: [-5, 1.0, 9], color: 0x654321 }, // Left spawn box (TALL)
      { size: [2, 2.0, 1.5], position: [5, 1.0, 9], color: 0x654321 }, // Right spawn box (TALL)
      { size: [1.5, 1.5, 1.5], position: [-8, 0.75, 8], color: 0x696969 }, // Far left spawn (medium)
      { size: [1.5, 1.5, 1.5], position: [8, 0.75, 8], color: 0x696969 }, // Far right spawn (medium)
      
      // PLAYER 1 FORWARD POSITIONS - Moved closer to spawn
      { size: [2.5, 2.0, 1.5], position: [-4, 1.0, 8], color: 0x8B4513 }, // Left forward (TALL)
      { size: [2.5, 2.0, 1.5], position: [4, 1.0, 8], color: 0x8B4513 }, // Right forward (TALL)
      { size: [2, 2.2, 2], position: [0, 1.1, 7], color: 0x8B4513 }, // Center forward (TALL BROWN) - closer to spawn
      
      // SMALL COVER next to center forward box
      { size: [1, 1.5, 1], position: [-2.5, 0.75, 7], color: 0x696969 }, // Left small cover
      { size: [1, 1.5, 1], position: [2.5, 0.75, 7], color: 0x696969 }, // Right small cover
      
      // CROUCHABLE AREAS (half-height cover)
      { size: [1.5, 0.9, 1.5], position: [-6, 0.45, 8], color: 0x654321 }, // Crouch cover left of left forward
      { size: [1.5, 0.9, 1.5], position: [6, 0.45, 8], color: 0x654321 }, // Crouch cover right of right forward
      
      // SIDE LANES - Flanking routes
      { size: [1.5, 2.0, 2], position: [-12, 1.0, 3], color: 0x696969 }, // Left lane cover (TALL)
      { size: [1.5, 2.0, 2], position: [12, 1.0, 3], color: 0x696969 }, // Right lane cover (TALL)
      { size: [1.5, 2.0, 2], position: [-12, 1.0, -3], color: 0x696969 }, // Left lane cover other side (TALL)
      { size: [1.5, 2.0, 2], position: [12, 1.0, -3], color: 0x696969 }, // Right lane cover other side (TALL)
      
      // MID-MAP SIDE COVER - Reduced and with crouchable areas
      { size: [2, 2.0, 1.5], position: [-10, 1.0, 3], color: 0x654321 }, // Left side mid (TALL)
      { size: [2, 2.0, 1.5], position: [10, 1.0, 3], color: 0x654321 }, // Right side mid (TALL)
      { size: [2, 2.0, 1.5], position: [-10, 1.0, -3], color: 0x654321 }, // Left side mid other (TALL)
      { size: [2, 2.0, 1.5], position: [10, 1.0, -3], color: 0x654321 }, // Right side mid other (TALL)
      
      // CROUCHABLE AREAS next to mid-map cover
      { size: [1.2, 0.9, 1.2], position: [-8.5, 0.45, 3], color: 0x696969 }, // Crouch cover left mid
      { size: [1.2, 0.9, 1.2], position: [8.5, 0.45, 3], color: 0x696969 }, // Crouch cover right mid
      { size: [1.2, 0.9, 1.2], position: [-8.5, 0.45, -3], color: 0x696969 }, // Crouch cover left mid other
      { size: [1.2, 0.9, 1.2], position: [8.5, 0.45, -3], color: 0x696969 }, // Crouch cover right mid other
      
      // REMOVED CENTER TRANSITION COVER - Opening up the middle more
      
      // PLAYER 2 FORWARD POSITIONS (mirror of player 1) - Moved closer to spawn
      { size: [2.5, 2.0, 1.5], position: [-4, 1.0, -8], color: 0x8B4513 }, // Left forward (TALL)
      { size: [2.5, 2.0, 1.5], position: [4, 1.0, -8], color: 0x8B4513 }, // Right forward (TALL)
      { size: [2, 2.2, 2], position: [0, 1.1, -7], color: 0x8B4513 }, // Center forward (TALL BROWN) - closer to spawn
      
      // SMALL COVER next to center forward box (mirror)
      { size: [1, 1.5, 1], position: [-2.5, 0.75, -7], color: 0x696969 }, // Left small cover
      { size: [1, 1.5, 1], position: [2.5, 0.75, -7], color: 0x696969 }, // Right small cover
      
      // CROUCHABLE AREAS (half-height cover) - mirror
      { size: [1.5, 0.9, 1.5], position: [-6, 0.45, -8], color: 0x654321 }, // Crouch cover left of left forward
      { size: [1.5, 0.9, 1.5], position: [6, 0.45, -8], color: 0x654321 }, // Crouch cover right of right forward
      
      // PLAYER 2 SPAWN AREA (front of map - negative Z) - Mirror layout, no center spawn box
      { size: [2, 2.0, 1.5], position: [-5, 1.0, -9], color: 0x654321 }, // Left spawn box (TALL)
      { size: [2, 2.0, 1.5], position: [5, 1.0, -9], color: 0x654321 }, // Right spawn box (TALL)
      { size: [1.5, 1.5, 1.5], position: [-8, 0.75, -8], color: 0x696969 }, // Far left spawn (medium)
      { size: [1.5, 1.5, 1.5], position: [8, 0.75, -8], color: 0x696969 }, // Far right spawn (medium)
      
      // REDUCED CENTER COVER - Only minimal crouchable cover in center
      { size: [1, 0.9, 1], position: [-4, 0.45, 1], color: 0x696969 }, // Small crouch left
      { size: [1, 0.9, 1], position: [4, 0.45, 1], color: 0x696969 }, // Small crouch right
      { size: [1, 0.9, 1], position: [-4, 0.45, -1], color: 0x696969 }, // Small crouch left other
      { size: [1, 0.9, 1], position: [4, 0.45, -1], color: 0x696969 }, // Small crouch right other
    ]

    coverConfigs.forEach((config, index) => {
      const coverBox = this.createCoverBox(
        config.size as [number, number, number],
        config.position as [number, number, number],
        config.color
      )
      coverBox.name = `cover-${index}`
      this.coverObjects.push(coverBox)
      this.arenaGroup.add(coverBox)
    })
  }

  private createCoverBox(
    size: [number, number, number], 
    position: [number, number, number], 
    color: number
  ): THREE.Mesh {
    const [width, height, depth] = size
    const [x, y, z] = position
    
    const geometry = new THREE.BoxGeometry(width, height, depth)
    const material = new THREE.MeshLambertMaterial({ 
      color: color,
      transparent: false
    })
    
    const coverBox = new THREE.Mesh(geometry, material)
    coverBox.position.set(x, y, z)
    coverBox.castShadow = true
    coverBox.receiveShadow = true
    
    return coverBox
  }

  // Method to get all collision objects for physics system
  getCoverObjects(): THREE.Mesh[] {
    return [...this.coverObjects, ...this.wallObjects]
  }

  // Method to get arena boundaries for collision detection
  getArenaBounds(): { width: number, height: number } {
    return {
      width: this.ARENA_WIDTH,
      height: this.ARENA_HEIGHT
    }
  }

  // Cleanup method
  dispose(): void {
    this.arenaGroup.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (object.material instanceof THREE.Material) {
          object.material.dispose()
        }
      }
    })
    
    // Clear collision object arrays
    this.coverObjects = []
    this.wallObjects = []
    
    this.scene.remove(this.arenaGroup)
    console.log('🧹 Arena disposed')
  }
}
