import * as THREE from 'three'

export class CollisionSystem {
  private collisionObjects: THREE.Mesh[] = []
  
  // Collision detection parameters
  private readonly COLLISION_DISTANCE = 0.2 // Distance to maintain from objects
  private readonly RAY_DIRECTIONS = [
    new THREE.Vector3(1, 0, 0),     // Right
    new THREE.Vector3(-1, 0, 0),    // Left  
    new THREE.Vector3(0, 0, 1),     // Forward
    new THREE.Vector3(0, 0, -1),    // Backward
    new THREE.Vector3(0.707, 0, 0.707),   // Forward-right diagonal
    new THREE.Vector3(-0.707, 0, 0.707),  // Forward-left diagonal
    new THREE.Vector3(0.707, 0, -0.707),  // Backward-right diagonal
    new THREE.Vector3(-0.707, 0, -0.707), // Backward-left diagonal
  ]

  constructor() {
    console.log('✅ Collision system initialized')
  }

  // Add collision objects (cover boxes, walls, etc.)
  addCollisionObjects(objects: THREE.Mesh[]): void {
    this.collisionObjects.push(...objects)
    console.log(`📦 Added ${objects.length} collision objects`)
    console.log(`📦 Total collision objects: ${this.collisionObjects.length}`)
    
    // Log object names for debugging
    objects.forEach((obj, index) => {
      console.log(`   - ${obj.name || `Object ${index}`} at position (${obj.position.x.toFixed(1)}, ${obj.position.y.toFixed(1)}, ${obj.position.z.toFixed(1)})`)
    })
  }

  // Check if a position would collide with any objects using bounding box method
  checkCollision(position: THREE.Vector3, radius: number = this.COLLISION_DISTANCE): boolean {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      position,
      new THREE.Vector3(0.6 + radius * 2, 1.8, 0.6 + radius * 2) // Player bounding box (0.6m wide player + collision margin)
    )

    for (const object of this.collisionObjects) {
      // Get the object's bounding box
      const objectBox = new THREE.Box3().setFromObject(object)
      
      // Check if bounding boxes intersect
      if (playerBox.intersectsBox(objectBox)) {
        return true // Collision detected
      }
    }
    
    return false // No collision
  }

  // Get the corrected position that avoids collision
  getValidPosition(currentPosition: THREE.Vector3, newPosition: THREE.Vector3): THREE.Vector3 {
    const radius = this.COLLISION_DISTANCE
    
    // If new position is valid, return it
    if (!this.checkCollision(newPosition, radius)) {
      return newPosition.clone()
    }

    // Try to slide along walls by testing individual axis movements
    const validPosition = currentPosition.clone()
    
    // ALWAYS allow Y movement first (jumping/falling) - this prevents getting stuck
    const testY = new THREE.Vector3(currentPosition.x, newPosition.y, currentPosition.z)
    if (!this.checkCollision(testY, radius)) {
      validPosition.y = newPosition.y
    }
    
    // Test X movement with the new Y position
    const testX = new THREE.Vector3(newPosition.x, validPosition.y, currentPosition.z)
    if (!this.checkCollision(testX, radius)) {
      validPosition.x = newPosition.x
    }
    
    // Test Z movement with the current valid X,Y position
    const testZ = new THREE.Vector3(validPosition.x, validPosition.y, newPosition.z)
    if (!this.checkCollision(testZ, radius)) {
      validPosition.z = newPosition.z
    }
    
    // If player is moving upward and there's horizontal collision, 
    // allow them to "climb over" low obstacles
    if (newPosition.y > currentPosition.y && validPosition.y > currentPosition.y) {
      const climbTestHeight = validPosition.y + 0.5 // Try climbing a bit higher
      const climbTest = new THREE.Vector3(newPosition.x, climbTestHeight, newPosition.z)
      if (!this.checkCollision(climbTest, radius)) {
        return new THREE.Vector3(newPosition.x, climbTestHeight, newPosition.z)
      }
    }
    
    return validPosition
  }

  // Check collision in a specific direction (for more precise movement)
  checkDirectionalCollision(
    position: THREE.Vector3, 
    direction: THREE.Vector3, 
    distance: number = this.COLLISION_DISTANCE
  ): boolean {
    const testPosition = position.clone().add(direction.clone().normalize().multiplyScalar(distance))
    return this.checkCollision(testPosition, this.COLLISION_DISTANCE * 0.5)
  }

  // Get collision info for debugging
  getCollisionInfo(position: THREE.Vector3): { 
    hasCollision: boolean, 
    nearestDistance: number,
    nearestObject?: THREE.Mesh 
  } {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      position,
      new THREE.Vector3(0.6 + this.COLLISION_DISTANCE * 2, 1.8, 0.6 + this.COLLISION_DISTANCE * 2)
    )

    let nearestDistance = Infinity
    let nearestObject: THREE.Mesh | undefined
    let hasCollision = false

    for (const object of this.collisionObjects) {
      const objectBox = new THREE.Box3().setFromObject(object)
      
      if (playerBox.intersectsBox(objectBox)) {
        hasCollision = true
        const distance = position.distanceTo(object.position)
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestObject = object
        }
      }
    }

    return {
      hasCollision,
      nearestDistance: nearestDistance === Infinity ? -1 : nearestDistance,
      nearestObject
    }
  }

  // Update collision objects (if they move or change)
  updateCollisionObjects(objects: THREE.Mesh[]): void {
    this.collisionObjects = [...objects]
  }

  // Remove specific collision objects
  removeCollisionObjects(objects: THREE.Mesh[]): void {
    objects.forEach(obj => {
      const index = this.collisionObjects.indexOf(obj)
      if (index > -1) {
        this.collisionObjects.splice(index, 1)
      }
    })
  }

  // Clear all collision objects
  clearCollisionObjects(): void {
    this.collisionObjects = []
  }

  // Get collision distance setting
  get collisionDistance(): number {
    return this.COLLISION_DISTANCE
  }
}
