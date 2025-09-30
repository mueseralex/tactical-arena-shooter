import * as THREE from 'three'
import { CollisionSystem } from './collision-system'
import { PlayerModel } from '../components/player-model'
import { ViewportWeapon } from '../components/viewport-weapon'

export class FirstPersonControls {
  private camera: THREE.PerspectiveCamera
  private domElement: HTMLElement
  
  // Movement state
  private moveForward = false
  private moveBackward = false
  private moveLeft = false
  private moveRight = false
  private canJump = false
  private isCrouching = false
  
  // Movement properties
  private velocity = new THREE.Vector3()
  private direction = new THREE.Vector3()
  private moveSpeed = 4.2 // Base movement speed
  private crouchMoveSpeed = 2.5 // Movement speed while crouched (60% of base)
  private baseJumpHeight = 5.0 // Base jump height
  private currentJumpHeight = 5.0 // Current jump height (affected by fatigue)
  private gravity = -25.0 // Increased from -20.0 for faster fall
  
  // Mouse look properties
  private euler = new THREE.Euler(0, 0, 0, 'YXZ')
  private PI_2 = Math.PI / 2
  private mouseSensitivity = 0.002
  
  // Pointer lock state
  private isLocked = false
  
  // Collision system
  private collisionSystem: CollisionSystem
  
  // Player model (visible when looking down)
  private playerModel: PlayerModel
  
  // Viewport weapon system
  private viewportWeapon!: ViewportWeapon
  
  // Settings
  private baseSensitivity = 0.002
  
  // Shooting callback
  private onShoot?: (shootData: { origin: THREE.Vector3, direction: THREE.Vector3, maxRange: number }) => void
  
  // Ground collision and crouching
  private standingHeight = 1.8 // Player height when standing
  private crouchingHeight = 1.2 // Player height when crouching
  private currentHeight = 1.8 // Current interpolated height
  private targetHeight = 1.8 // Target height for smooth transition
  private baseCrouchSpeed = 8.0 // Base speed of crouch animation
  private currentCrouchSpeed = 8.0 // Current crouch speed (affected by fatigue)
  
  // Crouch fatigue system (Counter-Strike style)
  private crouchCount = 0 // Number of recent crouch actions
  private lastCrouchTime = 0 // Time of last crouch action
  private crouchFatigueDecay = 2000 // Time in ms for fatigue to decay
  private maxCrouchFatigue = 5 // Maximum crouch actions before severe slowdown
  private minCrouchSpeed = 1.5 // Minimum crouch speed when fatigued
  
  // Jump fatigue system (Counter-Strike style)
  private jumpCount = 0 // Number of recent jump actions
  private lastJumpTime = 0 // Time of last jump action
  private jumpFatigueDecay = 3000 // Time in ms for jump fatigue to decay (longer than crouch)
  private maxJumpFatigue = 4 // Maximum jumps before severe penalty
  private minJumpHeight = 2.0 // Minimum jump height when fatigued
  
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    console.log('🎮 Initializing FirstPersonControls...')
    this.camera = camera
    this.domElement = domElement
    this.collisionSystem = new CollisionSystem()
    
    // Create player model attached to camera
    console.log('👤 Creating player model...')
    this.playerModel = new PlayerModel('blue')
    this.setupPlayerModel()
    
    // Create viewport weapon system
    console.log('🔫 Creating viewport weapon system...')
    try {
      this.viewportWeapon = new ViewportWeapon(domElement as HTMLCanvasElement)
      console.log('✅ Viewport weapon system created successfully')
    } catch (error) {
      console.error('❌ Failed to create viewport weapon system:', error)
    }
    
    this.initEventListeners()
    this.setupPointerLock()
  }

  private initEventListeners(): void {
    // Keyboard event listeners
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))
    
    // Mouse event listeners
    document.addEventListener('mousemove', this.onMouseMove.bind(this))
    document.addEventListener('mousedown', this.onMouseDown.bind(this))
    document.addEventListener('mouseup', this.onMouseUp.bind(this))
    
    // No longer need browser shortcut prevention since we use Shift/C for crouch
    
    console.log('✅ First-person controls initialized')
  }

  private setupPlayerModel(): void {
    // Position the player model relative to the camera
    // The camera is at the player's eye level, so position model below
    this.playerModel.position.set(0, -this.currentHeight, 0)
    
    // Make the model follow the camera
    this.camera.add(this.playerModel)
    
    console.log('✅ Player model attached to first-person camera')
  }

  private setupPointerLock(): void {
    const canvas = this.domElement
    
    // Request pointer lock on canvas click
    canvas.addEventListener('click', () => {
      if (!this.isLocked) {
        canvas.requestPointerLock()
      }
    })
    
    // Handle pointer lock changes
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === canvas
      
      if (this.isLocked) {
        console.log('🔒 Pointer lock activated - Mouse look enabled')
        // Hide loading screen when pointer lock is active
        const loadingElement = document.getElementById('loading')
        if (loadingElement) {
          loadingElement.style.display = 'none'
        }
      } else {
        console.log('🔓 Pointer lock deactivated')
      }
    })
    
    // Handle pointer lock errors
    document.addEventListener('pointerlockerror', () => {
      console.error('❌ Pointer lock error')
    })
    
    console.log('✅ Pointer lock system initialized')
  }

  // Removed old showInstructions method - replaced by new ESC game menu

  private onKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true
        break
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true
        break
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true
        break
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true
        break
      case 'Space':
        if (this.canJump && !this.isCrouching) {
          this.handleJump()
        }
        event.preventDefault() // Prevent page scroll
        break
      case 'ShiftLeft':
      case 'ShiftRight':
      case 'KeyC':
        if (!this.isCrouching) { // Only trigger on initial press, not while held
          this.handleCrouchStart()
        }
        event.preventDefault() // Prevent browser shortcuts
        break
      case 'KeyR':
        this.viewportWeapon.reload()
        break
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false
        break
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false
        break
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false
        break
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false
        break
      case 'ShiftLeft':
      case 'ShiftRight':
      case 'KeyC':
        this.handleCrouchEnd()
        event.preventDefault() // Prevent browser shortcuts on release too
        break
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isLocked) return
    
    const movementX = event.movementX || 0
    const movementY = event.movementY || 0
    
    // Update euler angles
    this.euler.setFromQuaternion(this.camera.quaternion)
    this.euler.y -= movementX * this.mouseSensitivity
    this.euler.x -= movementY * this.mouseSensitivity
    
    // Clamp vertical rotation to prevent flipping
    this.euler.x = Math.max(-this.PI_2, Math.min(this.PI_2, this.euler.x))
    
    // Apply rotation to camera
    this.camera.quaternion.setFromEuler(this.euler)
  }

  private onMouseDown(event: MouseEvent): void {
    if (!this.isLocked) return
    
    if (event.button === 0) { // Left click
      if (this.viewportWeapon.fire()) {
        // Weapon fired successfully, perform hit detection
        this.performHitDetection()
      }
    }
  }

  private performHitDetection(): void {
    // Get camera position and direction for shooting
    const origin = this.camera.position.clone()
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(this.camera.quaternion)
    
    // Check for collision with objects first (bullets can't go through walls)
    const maxRange = 100
    const wallHit = this.collisionSystem.raycastHit(origin, direction, maxRange)
    
    if (wallHit.hit) {
      console.log(`🧱 Bullet hit wall at distance ${wallHit.distance.toFixed(2)}`)
      // Bullet hit a wall/object, no player damage
      return
    }
    
    // Send shooting data to server for player hit detection
    if (this.onShoot) {
      this.onShoot({
        origin: origin,
        direction: direction,
        maxRange: maxRange
      })
    }
  }

  private onMouseUp(event: MouseEvent): void {
    // Handle mouse button releases if needed
  }

  // Crouch fatigue system methods
  private handleCrouchStart(): void {
    const currentTime = Date.now()
    
    // Update crouch fatigue
    this.updateCrouchFatigue(currentTime)
    
    // Increment crouch count
    this.crouchCount++
    this.lastCrouchTime = currentTime
    
    // Calculate current crouch speed based on fatigue
    this.calculateCrouchSpeed()
    
    // Start crouching
    this.isCrouching = true
    this.targetHeight = this.crouchingHeight
    
    console.log(`🔧 Crouch start - Count: ${this.crouchCount}, Speed: ${this.currentCrouchSpeed.toFixed(1)}`)
  }

  private handleCrouchEnd(): void {
    this.isCrouching = false
    this.targetHeight = this.standingHeight
    console.log('🔧 Crouch end')
  }

  private updateCrouchFatigue(currentTime: number): void {
    // Decay crouch count over time
    const timeSinceLastCrouch = currentTime - this.lastCrouchTime
    
    if (timeSinceLastCrouch > this.crouchFatigueDecay) {
      // Reset crouch count if enough time has passed
      this.crouchCount = 0
      this.currentCrouchSpeed = this.baseCrouchSpeed
    } else {
      // Gradually reduce crouch count based on time passed
      const decayRatio = timeSinceLastCrouch / this.crouchFatigueDecay
      const decayAmount = Math.floor(decayRatio * this.crouchCount)
      this.crouchCount = Math.max(0, this.crouchCount - decayAmount)
    }
  }

  private calculateCrouchSpeed(): void {
    if (this.crouchCount <= 1) {
      // First crouch - full speed
      this.currentCrouchSpeed = this.baseCrouchSpeed
    } else {
      // Progressive slowdown based on crouch count
      const fatigueRatio = Math.min(this.crouchCount / this.maxCrouchFatigue, 1.0)
      
      // Exponential slowdown curve (more dramatic like CS)
      const slowdownCurve = Math.pow(fatigueRatio, 2.5)
      
      // Calculate speed between min and base speed
      this.currentCrouchSpeed = THREE.MathUtils.lerp(
        this.baseCrouchSpeed,
        this.minCrouchSpeed,
        slowdownCurve
      )
    }
    
    // Log fatigue level for debugging
    if (this.crouchCount > 2) {
      console.log(`⚠️ Crouch fatigue - Count: ${this.crouchCount}, Speed: ${this.currentCrouchSpeed.toFixed(1)}x`)
    }
  }

  // Jump fatigue system methods
  private handleJump(): void {
    const currentTime = Date.now()
    
    // Update jump fatigue
    this.updateJumpFatigue(currentTime)
    
    // Increment jump count
    this.jumpCount++
    this.lastJumpTime = currentTime
    
    // Calculate current jump height based on fatigue
    this.calculateJumpHeight()
    
    // Perform jump with current height
    this.velocity.y += this.currentJumpHeight
    this.canJump = false
    
    console.log(`🦘 Jump - Count: ${this.jumpCount}, Height: ${this.currentJumpHeight.toFixed(1)}`)
  }

  private updateJumpFatigue(currentTime: number): void {
    // Decay jump count over time
    const timeSinceLastJump = currentTime - this.lastJumpTime
    
    if (timeSinceLastJump > this.jumpFatigueDecay) {
      // Reset jump count if enough time has passed
      this.jumpCount = 0
      this.currentJumpHeight = this.baseJumpHeight
    } else {
      // Gradually reduce jump count based on time passed
      const decayRatio = timeSinceLastJump / this.jumpFatigueDecay
      const decayAmount = Math.floor(decayRatio * this.jumpCount)
      this.jumpCount = Math.max(0, this.jumpCount - decayAmount)
    }
  }

  private calculateJumpHeight(): void {
    if (this.jumpCount <= 1) {
      // First jump - full height
      this.currentJumpHeight = this.baseJumpHeight
    } else {
      // Progressive reduction based on jump count
      const fatigueRatio = Math.min(this.jumpCount / this.maxJumpFatigue, 1.0)
      
      // Exponential reduction curve (more dramatic like CS)
      const reductionCurve = Math.pow(fatigueRatio, 2.0)
      
      // Calculate height between min and base height
      this.currentJumpHeight = THREE.MathUtils.lerp(
        this.baseJumpHeight,
        this.minJumpHeight,
        reductionCurve
      )
    }
    
    // Log fatigue level for debugging
    if (this.jumpCount > 2) {
      console.log(`⚠️ Jump fatigue - Count: ${this.jumpCount}, Height: ${this.currentJumpHeight.toFixed(1)}`)
    }
  }

  update(deltaTime: number): void {
    if (!this.isLocked) return
    
    // Smooth crouch animation with fatigue-affected speed
    this.currentHeight = THREE.MathUtils.lerp(
      this.currentHeight, 
      this.targetHeight, 
      this.currentCrouchSpeed * deltaTime
    )
    
    // Update player model position and crouching state
    this.playerModel.position.set(0, -this.currentHeight, 0)
    this.playerModel.setCrouching(this.isCrouching)
    
    // Check if player is moving for weapon sway
    const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight
    
    // Update viewport weapon system
    this.viewportWeapon.update(deltaTime, isMoving)
    this.viewportWeapon.render()
    
    // Apply gravity
    this.velocity.y += this.gravity * deltaTime
    
    // Reset movement direction
    this.direction.set(0, 0, 0)
    
    // Calculate movement direction based on input
    if (this.moveForward) this.direction.z -= 1
    if (this.moveBackward) this.direction.z += 1
    if (this.moveLeft) this.direction.x -= 1
    if (this.moveRight) this.direction.x += 1
    
    // Normalize diagonal movement
    if (this.direction.length() > 0) {
      this.direction.normalize()
    }
    
    // Transform direction using only horizontal rotation (Y-axis only)
    // This prevents speed reduction when looking up/down
    const horizontalMatrix = new THREE.Matrix4()
    horizontalMatrix.makeRotationY(this.euler.y)
    this.direction.transformDirection(horizontalMatrix)
    
    // Apply horizontal movement with speed based on crouch state
    const currentMoveSpeed = this.isCrouching ? this.crouchMoveSpeed : this.moveSpeed
    this.velocity.x = this.direction.x * currentMoveSpeed
    this.velocity.z = this.direction.z * currentMoveSpeed
    
    // Calculate new position with velocity
    const newPosition = this.camera.position.clone()
    newPosition.addScaledVector(this.velocity, deltaTime)
    
    // Only apply collision detection if there's actual movement or velocity
    const hasMovement = this.velocity.length() > 0.001 || 
                       this.camera.position.distanceTo(newPosition) > 0.001
    
    if (hasMovement) {
      // Apply collision detection
      const validPosition = this.collisionSystem.getValidPosition(this.camera.position, newPosition)
      this.camera.position.copy(validPosition)
    }
    
    // Ground collision (use current height for crouching)
    if (this.camera.position.y <= this.currentHeight) {
      this.camera.position.y = this.currentHeight
      this.velocity.y = 0
      this.canJump = true
    }
    
    // Arena boundary collision (40x25 arena)
    const arenaWidth = 40
    const arenaHeight = 25
    const wallOffset = 1.5 // Keep player away from walls
    
    this.camera.position.x = Math.max(
      -arenaWidth / 2 + wallOffset, 
      Math.min(arenaWidth / 2 - wallOffset, this.camera.position.x)
    )
    this.camera.position.z = Math.max(
      -arenaHeight / 2 + wallOffset, 
      Math.min(arenaHeight / 2 - wallOffset, this.camera.position.z)
    )
  }

  // Getters for other systems to access camera state
  get position(): THREE.Vector3 {
    return this.camera.position.clone()
  }

  get rotation(): THREE.Euler {
    return this.euler.clone()
  }

  get isPointerLocked(): boolean {
    return this.isLocked
  }

  // Method to set spawn position
  setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z)
    this.velocity.set(0, 0, 0)
  }

  // Method to set look direction
  setRotation(x: number, y: number): void {
    this.euler.set(x, y, 0, 'YXZ')
    this.camera.quaternion.setFromEuler(this.euler)
  }

  // Method to add collision objects
  addCollisionObjects(objects: THREE.Mesh[]): void {
    this.collisionSystem.addCollisionObjects(objects)
  }

  // Settings methods
  setMouseSensitivity(sensitivity: number): void {
    this.mouseSensitivity = this.baseSensitivity * sensitivity
    console.log(`🖱️ Mouse sensitivity set to ${sensitivity}`)
  }

  setFieldOfView(fov: number): void {
    this.camera.fov = fov
    this.camera.updateProjectionMatrix()
    console.log(`🔍 Field of view set to ${fov}°`)
  }

  // Set shooting callback for networking
  setShootCallback(callback: (shootData: { origin: THREE.Vector3, direction: THREE.Vector3, maxRange: number }) => void): void {
    this.onShoot = callback
  }

  // Cleanup method
  dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown.bind(this))
    document.removeEventListener('keyup', this.onKeyUp.bind(this))
    document.removeEventListener('mousemove', this.onMouseMove.bind(this))
    document.removeEventListener('mousedown', this.onMouseDown.bind(this))
    document.removeEventListener('mouseup', this.onMouseUp.bind(this))
    // No longer need to remove preventBrowserShortcuts listener
    
    // Dispose of player model
    if (this.playerModel) {
      this.camera.remove(this.playerModel)
      this.playerModel.dispose()
    }
    
    // Dispose of viewport weapon system
    if (this.viewportWeapon) {
      this.viewportWeapon.dispose()
    }
    
    console.log('🧹 First-person controls disposed')
  }
}
