import * as THREE from 'three'

export class DummyPlayer {
  private scene: THREE.Scene
  private dummyGroup: THREE.Group

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.dummyGroup = new THREE.Group()
    this.dummyGroup.name = 'dummy-player'
    
    this.createDummyPlayer()
    this.scene.add(this.dummyGroup)
  }

  private createDummyPlayer(): void {
    // Create a simple geometric player model similar to aim trainers
    
    // Body (main torso)
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.0, 0.3)
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x4a90e2, // Blue color for visibility
      transparent: false
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.set(0, 1.3, 0) // Position at chest level
    body.castShadow = true
    body.receiveShadow = true
    this.dummyGroup.add(body)

    // Head
    const headGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3)
    const headMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffb366, // Skin tone
      transparent: false
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.set(0, 1.95, 0) // On top of body
    head.castShadow = true
    head.receiveShadow = true
    this.dummyGroup.add(head)

    // Left Arm
    const leftArmGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2)
    const armMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x4a90e2, // Same as body
      transparent: false
    })
    const leftArm = new THREE.Mesh(leftArmGeometry, armMaterial)
    leftArm.position.set(-0.5, 1.3, 0)
    leftArm.castShadow = true
    leftArm.receiveShadow = true
    this.dummyGroup.add(leftArm)

    // Right Arm
    const rightArm = new THREE.Mesh(leftArmGeometry, armMaterial)
    rightArm.position.set(0.5, 1.3, 0)
    rightArm.castShadow = true
    rightArm.receiveShadow = true
    this.dummyGroup.add(rightArm)

    // Left Leg
    const legGeometry = new THREE.BoxGeometry(0.25, 0.9, 0.25)
    const legMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x2c3e50, // Dark color for pants
      transparent: false
    })
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
    leftLeg.position.set(-0.15, 0.45, 0)
    leftLeg.castShadow = true
    leftLeg.receiveShadow = true
    this.dummyGroup.add(leftLeg)

    // Right Leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
    rightLeg.position.set(0.15, 0.45, 0)
    rightLeg.castShadow = true
    rightLeg.receiveShadow = true
    this.dummyGroup.add(rightLeg)

    // Add outline edges for better visibility
    this.addOutlines([body, head, leftArm, rightArm, leftLeg, rightLeg])

    // Position the entire dummy in the center of the arena
    this.dummyGroup.position.set(0, 0, 0)

    console.log('✅ Dummy player model created in center of arena')
  }

  private addOutlines(meshes: THREE.Mesh[]): void {
    meshes.forEach(mesh => {
      const edges = new THREE.EdgesGeometry(mesh.geometry)
      const edgeMaterial = new THREE.LineBasicMaterial({ 
        color: 0x000000,
        transparent: true,
        opacity: 0.8
      })
      const edgeLines = new THREE.LineSegments(edges, edgeMaterial)
      mesh.add(edgeLines)
    })
  }

  // Method to get the dummy's height for reference
  getDummyHeight(): number {
    return 2.1 // Total height from feet to top of head
  }

  // Method to get the dummy's width for reference
  getDummyWidth(): number {
    return 0.6 // Body width
  }

  // Method to move the dummy to a different position
  setPosition(x: number, y: number, z: number): void {
    this.dummyGroup.position.set(x, y, z)
  }

  // Method to rotate the dummy
  setRotation(y: number): void {
    this.dummyGroup.rotation.y = y
  }

  // Add a simple animation (optional)
  update(deltaTime: number): void {
    // Simple breathing animation - slight scale change
    const breathScale = 1 + Math.sin(Date.now() * 0.002) * 0.02
    this.dummyGroup.scale.y = breathScale
  }

  // Cleanup method
  dispose(): void {
    this.dummyGroup.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (object.material instanceof THREE.Material) {
          object.material.dispose()
        }
      }
    })
    
    this.scene.remove(this.dummyGroup)
    console.log('🧹 Dummy player disposed')
  }
}


