import * as THREE from 'three'

export class ViewportWeapon {
  private weaponRenderer: THREE.WebGLRenderer
  private weaponScene: THREE.Scene
  private weaponCamera: THREE.PerspectiveCamera
  private weaponGroup: THREE.Group
  private canvas: HTMLCanvasElement
  private weaponCanvas: HTMLCanvasElement
  
  // Weapon state
  private currentAmmo = 15
  private maxAmmo = 15
  private isReloading = false
  private canFire = true
  private lastShotTime = 0
  private fireRate = 150
  
  // Visual effects
  private muzzleFlash?: THREE.PointLight
  private muzzleFlashMesh?: THREE.Mesh
  
  // Weapon sway and recoil
  private weaponSway = new THREE.Vector3()
  private recoilOffset = new THREE.Vector3()
  private targetRecoil = new THREE.Vector3()
  
  // Audio properties
  private fireSound?: HTMLAudioElement
  private reloadSound?: HTMLAudioElement
  private emptyClickSound?: HTMLAudioElement
  
  // Animation properties
  private reloadAnimationProgress = 0
  private isReloadAnimating = false
  private originalWeaponPosition = new THREE.Vector3()
  
  // Viewmodel positioning
  private viewmodelOffset = new THREE.Vector3(0.3, -0.2, -0.5)
  
  // Arm mesh
  private armMesh?: THREE.Mesh
  
  constructor(mainCanvas: HTMLCanvasElement) {
    this.canvas = mainCanvas
    this.createWeaponCanvas()
    this.initWeaponRenderer()
    this.initWeaponScene()
    this.initWeaponCamera()
    this.createWeapon()
    this.createArm()
    this.setupAudio()
    
    console.log('✅ Viewport weapon system initialized')
  }

  private createWeaponCanvas(): void {
    // Create a separate canvas for the weapon overlay
    this.weaponCanvas = document.createElement('canvas')
    this.weaponCanvas.id = 'weaponCanvas'
    this.weaponCanvas.style.position = 'absolute'
    this.weaponCanvas.style.top = '0'
    this.weaponCanvas.style.left = '0'
    this.weaponCanvas.style.width = '100%'
    this.weaponCanvas.style.height = '100%'
    this.weaponCanvas.style.pointerEvents = 'none'
    this.weaponCanvas.style.zIndex = '10'
    
    // Set proper canvas dimensions
    this.weaponCanvas.width = window.innerWidth
    this.weaponCanvas.height = window.innerHeight
    
    // Add to the same container as the main canvas
    this.canvas.parentElement?.appendChild(this.weaponCanvas)
    
    console.log('✅ Weapon canvas created as overlay')
  }

  private initWeaponRenderer(): void {
    this.weaponRenderer = new THREE.WebGLRenderer({
      canvas: this.weaponCanvas,
      alpha: true, // Transparent background
      antialias: true
    })
    
    this.weaponRenderer.setSize(window.innerWidth, window.innerHeight)
    this.weaponRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.weaponRenderer.setClearColor(0x000000, 0) // Transparent
    this.weaponRenderer.shadowMap.enabled = true
    this.weaponRenderer.shadowMap.type = THREE.PCFSoftShadowMap
    
    console.log('✅ Weapon renderer initialized')
  }

  private initWeaponScene(): void {
    this.weaponScene = new THREE.Scene()
    
    // Add lighting for the weapon
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    this.weaponScene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1)
    directionalLight.castShadow = true
    this.weaponScene.add(directionalLight)
    
    console.log('✅ Weapon scene initialized')
  }

  private initWeaponCamera(): void {
    this.weaponCamera = new THREE.PerspectiveCamera(
      45, // Narrower FOV for weapon
      window.innerWidth / window.innerHeight,
      0.01, // Very close near plane
      10 // Short far plane
    )
    
    this.weaponCamera.position.set(0, 0, 0)
    console.log('✅ Weapon camera initialized')
  }

  private createWeapon(): void {
    this.weaponGroup = new THREE.Group()
    this.weaponGroup.name = 'viewport-weapon'
    
    // More refined materials
    const weaponMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x34495e,
      transparent: false
    })
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0f0f })
    const gripMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 })
    const accentMaterial = new THREE.MeshLambertMaterial({ color: 0x95a5a6 })

    // More refined pistol design
    // Main pistol frame (slide)
    const slideGeometry = new THREE.BoxGeometry(0.25, 0.3, 0.7)
    const slide = new THREE.Mesh(slideGeometry, weaponMaterial)
    slide.position.set(1.2, -0.9, -2.0)
    slide.castShadow = true
    this.weaponGroup.add(slide)

    // Barrel (extends from slide)
    const barrelGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.5)
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
    barrel.position.set(1.2, -0.9, -2.6)
    barrel.castShadow = true
    this.weaponGroup.add(barrel)

    // Pistol grip (more detailed)
    const gripGeometry = new THREE.BoxGeometry(0.18, 0.45, 0.25)
    const grip = new THREE.Mesh(gripGeometry, gripMaterial)
    grip.position.set(1.2, -1.35, -1.8)
    grip.castShadow = true
    this.weaponGroup.add(grip)

    // Trigger guard
    const triggerGuardGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.2)
    const triggerGuard = new THREE.Mesh(triggerGuardGeometry, weaponMaterial)
    triggerGuard.position.set(1.2, -1.15, -1.9)
    triggerGuard.castShadow = true
    this.weaponGroup.add(triggerGuard)

    // Sight (front)
    const frontSightGeometry = new THREE.BoxGeometry(0.04, 0.08, 0.04)
    const frontSight = new THREE.Mesh(frontSightGeometry, accentMaterial)
    frontSight.position.set(1.2, -0.75, -2.8)
    frontSight.castShadow = true
    this.weaponGroup.add(frontSight)

    // Sight (rear)
    const rearSightGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.04)
    const rearSight = new THREE.Mesh(rearSightGeometry, accentMaterial)
    rearSight.position.set(1.2, -0.75, -1.4)
    rearSight.castShadow = true
    this.weaponGroup.add(rearSight)

    // Trigger guard
    const triggerGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.1)
    const trigger = new THREE.Mesh(triggerGeometry, barrelMaterial)
    trigger.position.set(1.2, -1.1, -1.9)
    trigger.castShadow = true
    this.weaponGroup.add(trigger)

    // Magazine
    const magazineGeometry = new THREE.BoxGeometry(0.12, 0.2, 0.15)
    const magazineMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial)
    magazine.position.set(1.2, -1.4, -1.8)
    magazine.castShadow = true
    this.weaponGroup.add(magazine)

    // Create muzzle flash
    this.createMuzzleFlash()
    
    // Store original position for animations
    this.originalWeaponPosition.copy(this.weaponGroup.position)
    
    // Add weapon to scene
    this.weaponScene.add(this.weaponGroup)
    
    console.log('✅ Viewport weapon created with', this.weaponGroup.children.length, 'components')
    console.log('📍 Weapon positioned for viewport overlay')
  }

  private createArm(): void {
    // Create a simple block-format arm
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0xd4a574 }) // Skin tone
    const sleeveMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 }) // Dark sleeve
    
    // Forearm
    const forearmGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.8)
    const forearm = new THREE.Mesh(forearmGeometry, armMaterial)
    forearm.position.set(0.8, -1.2, -1.5)
    forearm.castShadow = true
    
    // Sleeve (covers part of forearm)
    const sleeveGeometry = new THREE.BoxGeometry(0.18, 0.18, 0.4)
    const sleeve = new THREE.Mesh(sleeveGeometry, sleeveMaterial)
    sleeve.position.set(0.8, -1.2, -1.1)
    sleeve.castShadow = true
    
    // Hand (holding the weapon)
    const handGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.2)
    const hand = new THREE.Mesh(handGeometry, armMaterial)
    hand.position.set(0.9, -1.3, -1.8)
    hand.castShadow = true
    
    // Create arm group
    this.armMesh = new THREE.Group()
    this.armMesh.add(forearm)
    this.armMesh.add(sleeve)
    this.armMesh.add(hand)
    
    // Add arm to weapon scene
    this.weaponScene.add(this.armMesh)
    
    console.log('✅ Block-format arm created and positioned')
  }

  private setupAudio(): void {
    // Create audio elements with better quality sounds
    
    // Gunshot sound - short, punchy bass
    this.fireSound = new Audio()
    this.fireSound.volume = 0.25
    this.fireSound.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
    
    // Reload sound - metallic click/clack
    this.reloadSound = new Audio()
    this.reloadSound.volume = 0.3
    this.reloadSound.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
    
    // Empty click - dry click sound
    this.emptyClickSound = new Audio()
    this.emptyClickSound.volume = 0.15
    this.emptyClickSound.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
    
    console.log('🔊 Weapon audio system initialized')
  }

  private createMuzzleFlash(): void {
    // Muzzle flash light
    this.muzzleFlash = new THREE.PointLight(0xffaa00, 3, 15)
    this.muzzleFlash.position.set(1.2, -0.8, -2.7)
    this.muzzleFlash.visible = false
    this.weaponGroup.add(this.muzzleFlash)

    // Muzzle flash visual effect
    const flashGeometry = new THREE.SphereGeometry(0.08, 6, 4)
    const flashMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8
    })
    this.muzzleFlashMesh = new THREE.Mesh(flashGeometry, flashMaterial)
    this.muzzleFlashMesh.position.set(1.2, -0.8, -2.7)
    this.muzzleFlashMesh.visible = false
    this.weaponGroup.add(this.muzzleFlashMesh)
  }

  // Shooting mechanics
  fire(): boolean {
    const now = Date.now()
    
    // Check if we can fire
    if (!this.canFire || this.isReloading || (now - this.lastShotTime) < this.fireRate) {
      return false
    }

    // Check for empty magazine
    if (this.currentAmmo <= 0) {
      // Play empty click sound
      if (this.emptyClickSound) {
        this.emptyClickSound.currentTime = 0
        this.emptyClickSound.play().catch(e => console.warn('Could not play empty click sound:', e))
      }
      console.log('🔫 *click* - Empty magazine!')
      return false
    }

    this.lastShotTime = now
    this.currentAmmo--
    
    // Audio effects
    if (this.fireSound) {
      this.fireSound.currentTime = 0
      this.fireSound.play().catch(e => console.warn('Could not play fire sound:', e))
    }
    
    // Visual effects
    this.showMuzzleFlash()
    this.applyRecoil()
    
    // Update UI
    this.updateAmmoDisplay()
    
    console.log(`🔫 Viewport weapon fired! Ammo: ${this.currentAmmo}/${this.maxAmmo}`)
    return true
  }

  private showMuzzleFlash(): void {
    if (this.muzzleFlash && this.muzzleFlashMesh) {
      this.muzzleFlash.visible = true
      this.muzzleFlashMesh.visible = true
      
      setTimeout(() => {
        if (this.muzzleFlash && this.muzzleFlashMesh) {
          this.muzzleFlash.visible = false
          this.muzzleFlashMesh.visible = false
        }
      }, 50)
    }
  }

  private applyRecoil(): void {
    this.targetRecoil.x += (Math.random() - 0.5) * 0.02
    this.targetRecoil.y += 0.03 + Math.random() * 0.02
    this.targetRecoil.z += 0.01
  }

  // Reload mechanics
  reload(): boolean {
    if (this.isReloading || this.currentAmmo === this.maxAmmo) {
      return false
    }

    this.isReloading = true
    this.isReloadAnimating = true
    this.reloadAnimationProgress = 0
    
    // Play reload sound
    if (this.reloadSound) {
      this.reloadSound.currentTime = 0
      this.reloadSound.play().catch(e => console.warn('Could not play reload sound:', e))
    }
    
    console.log('🔄 Reloading viewport weapon...')
    
    setTimeout(() => {
      this.currentAmmo = this.maxAmmo
      this.isReloading = false
      this.isReloadAnimating = false
      this.reloadAnimationProgress = 0
      this.updateAmmoDisplay()
      console.log('✅ Viewport weapon reload complete!')
    }, 2000)
    
    return true
  }

  private updateAmmoDisplay(): void {
    const ammoElement = document.getElementById('ammo-value')
    if (ammoElement) {
      ammoElement.textContent = `${this.currentAmmo}/${this.maxAmmo}`
      
      if (this.currentAmmo === 0) {
        ammoElement.style.color = '#ff4444'
      } else if (this.currentAmmo <= 5) {
        ammoElement.style.color = '#ffaa44'
      } else {
        ammoElement.style.color = '#60a5fa'
      }
    }
  }

  // Update and render
  update(deltaTime: number, isMoving: boolean): void {
    // Weapon sway while moving
    if (isMoving) {
      const time = Date.now() * 0.001
      this.weaponSway.x = Math.sin(time * 2) * 0.008
      this.weaponSway.y = Math.sin(time * 4) * 0.005
    } else {
      this.weaponSway.multiplyScalar(0.95)
    }
    
    // Reload animation
    let reloadOffset = new THREE.Vector3()
    if (this.isReloadAnimating) {
      this.reloadAnimationProgress += deltaTime * 0.5 // Animation speed
      const animProgress = Math.min(this.reloadAnimationProgress, 1)
      
      // Simple reload animation - weapon moves down and back up
      const animCurve = Math.sin(animProgress * Math.PI)
      reloadOffset.y = -animCurve * 0.3
      reloadOffset.z = animCurve * 0.2
    }
    
    // Recoil recovery
    this.recoilOffset.lerp(this.targetRecoil, deltaTime * 8)
    this.targetRecoil.multiplyScalar(0.85)
    
    // Apply weapon position offsets (including viewmodel offset)
    this.weaponGroup.position.x = this.originalWeaponPosition.x + this.viewmodelOffset.x + this.weaponSway.x + this.recoilOffset.x + reloadOffset.x
    this.weaponGroup.position.y = this.originalWeaponPosition.y + this.viewmodelOffset.y + this.weaponSway.y + this.recoilOffset.y + reloadOffset.y
    this.weaponGroup.position.z = this.originalWeaponPosition.z + this.viewmodelOffset.z + this.weaponSway.z + this.recoilOffset.z + reloadOffset.z
    
    // Apply weapon rotation
    this.weaponGroup.rotation.x = this.recoilOffset.y * 0.5
    this.weaponGroup.rotation.y = this.recoilOffset.x * 0.3
  }

  render(): void {
    this.weaponRenderer.render(this.weaponScene, this.weaponCamera)
  }

  // Handle window resize
  handleResize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    
    // Update canvas dimensions
    this.weaponCanvas.width = width
    this.weaponCanvas.height = height
    
    this.weaponCamera.aspect = width / height
    this.weaponCamera.updateProjectionMatrix()
    this.weaponRenderer.setSize(width, height)
    
    console.log(`🔫 Weapon canvas resized to ${width}x${height}`)
  }

  // Visibility control
  setVisible(visible: boolean): void {
    this.weaponCanvas.style.display = visible ? 'block' : 'none'
    console.log(`🔫 Viewmodel ${visible ? 'enabled' : 'disabled'}`)
  }

  // Getters
  getCurrentAmmo(): number { return this.currentAmmo }
  getMaxAmmo(): number { return this.maxAmmo }
  isWeaponReloading(): boolean { return this.isReloading }
  canWeaponFire(): boolean { return this.canFire && !this.isReloading && this.currentAmmo > 0 }

  // Viewmodel positioning controls
  setViewmodelPosition(x: number, y: number, z: number): void {
    this.viewmodelOffset.set(x, y, z)
    console.log(`🔫 Viewmodel position set to (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`)
  }

  getViewmodelPosition(): THREE.Vector3 {
    return this.viewmodelOffset.clone()
  }

  // Cleanup
  dispose(): void {
    this.weaponGroup.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (object.material instanceof THREE.Material) {
          object.material.dispose()
        }
      }
    })
    
    // Clean up audio
    if (this.fireSound) {
      this.fireSound.pause()
      this.fireSound.src = ''
    }
    if (this.reloadSound) {
      this.reloadSound.pause()
      this.reloadSound.src = ''
    }
    if (this.emptyClickSound) {
      this.emptyClickSound.pause()
      this.emptyClickSound.src = ''
    }
    
    this.weaponRenderer.dispose()
    this.weaponCanvas.parentElement?.removeChild(this.weaponCanvas)
    
    console.log('🧹 Viewport weapon system disposed')
  }
}
