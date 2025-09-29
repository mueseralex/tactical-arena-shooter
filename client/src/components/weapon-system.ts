import * as THREE from 'three'

export class WeaponSystem {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private weaponGroup: THREE.Group
  
  // Weapon state
  private currentAmmo = 15
  private maxAmmo = 15
  private isReloading = false
  private canFire = true
  private lastShotTime = 0
  private fireRate = 150 // milliseconds between shots
  
  // Visual effects
  private muzzleFlash?: THREE.PointLight
  private muzzleFlashMesh?: THREE.Mesh
  
  // Weapon sway and recoil
  private weaponSway = new THREE.Vector3()
  private recoilOffset = new THREE.Vector3()
  private targetRecoil = new THREE.Vector3()
  
  // Audio context for sound effects
  private audioContext?: AudioContext
  
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene
    this.camera = camera
    this.weaponGroup = new THREE.Group()
    this.weaponGroup.name = 'weapon-system'
    
    this.createWeapon()
    this.setupAudio()
    this.camera.add(this.weaponGroup)
    
    console.log('✅ Weapon system initialized')
  }

  private createWeapon(): void {
    // Pistol design - crude box pistol
    const weaponMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x2c3e50,
      transparent: false
    })
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })

    // Main pistol body (positioned in bottom-right of screen, much closer and bigger)
    const mainBodyGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.5)
    const mainBody = new THREE.Mesh(mainBodyGeometry, weaponMaterial)
    mainBody.position.set(0.8, -0.8, -1.5)
    mainBody.castShadow = true
    this.weaponGroup.add(mainBody)

    // Pistol barrel (extending forward, bigger and more visible)
    const barrelGeometry = new THREE.BoxGeometry(0.1, 0.12, 0.3)
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
    barrel.position.set(0.8, -0.7, -1.8)
    barrel.castShadow = true
    this.weaponGroup.add(barrel)

    // Pistol grip (angled downward, visible in first-person, bigger)
    const handleGeometry = new THREE.BoxGeometry(0.12, 0.3, 0.15)
    const handle = new THREE.Mesh(handleGeometry, weaponMaterial)
    handle.position.set(0.8, -1.0, -1.2)
    handle.castShadow = true
    this.weaponGroup.add(handle)

    // Trigger guard (visible from first-person angle, bigger)
    const triggerGeometry = new THREE.BoxGeometry(0.12, 0.05, 0.08)
    const trigger = new THREE.Mesh(triggerGeometry, barrelMaterial)
    trigger.position.set(0.8, -0.85, -1.25)
    trigger.castShadow = true
    this.weaponGroup.add(trigger)

    // Slide (top part of pistol, clearly visible, bigger)
    const slideGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.45)
    const slide = new THREE.Mesh(slideGeometry, barrelMaterial)
    slide.position.set(0.8, -0.65, -1.5)
    slide.castShadow = true
    this.weaponGroup.add(slide)

    // Magazine (visible from grip area, bigger)
    const magazineGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.12)
    const magazineMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial)
    magazine.position.set(0.8, -1.05, -1.2)
    magazine.castShadow = true
    this.weaponGroup.add(magazine)

    // Create muzzle flash effect (initially hidden)
    this.createMuzzleFlash()
    
    console.log('✅ Pistol created with', this.weaponGroup.children.length, 'components')
    console.log('📍 Weapon group position:', this.weaponGroup.position)
    console.log('📷 Camera near/far planes:', this.camera.near, this.camera.far)
    console.log('🎯 Camera has weapon group:', this.camera.children.includes(this.weaponGroup))
    
    // List all weapon components and their positions
    this.weaponGroup.children.forEach((child, index) => {
      if (child instanceof THREE.Mesh) {
        console.log(`🔧 Component ${index}: ${child.geometry.type} at`, child.position)
      }
    })
  }

  // Removed addWeaponEdges method - no longer needed

  private createMuzzleFlash(): void {
    // Muzzle flash light (positioned at pistol barrel end)
    this.muzzleFlash = new THREE.PointLight(0xffaa00, 2, 10)
    this.muzzleFlash.position.set(0.8, -0.7, -1.95)
    this.muzzleFlash.visible = false
    this.weaponGroup.add(this.muzzleFlash)

    // Muzzle flash visual effect
    const flashGeometry = new THREE.SphereGeometry(0.05, 6, 4)
    const flashMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8
    })
    this.muzzleFlashMesh = new THREE.Mesh(flashGeometry, flashMaterial)
    this.muzzleFlashMesh.position.set(0.8, -0.7, -1.95)
    this.muzzleFlashMesh.visible = false
    this.weaponGroup.add(this.muzzleFlashMesh)
  }

  private setupAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn('Audio context not available:', error)
    }
  }

  // Shooting mechanics
  fire(): boolean {
    const now = Date.now()
    
    if (!this.canFire || this.isReloading || this.currentAmmo <= 0 || 
        (now - this.lastShotTime) < this.fireRate) {
      return false
    }

    this.lastShotTime = now
    this.currentAmmo--
    
    // Visual effects
    this.showMuzzleFlash()
    this.applyRecoil()
    
    // Audio effect
    this.playFireSound()
    
    // Update UI
    this.updateAmmoDisplay()
    
    console.log(`🔫 Weapon fired! Ammo: ${this.currentAmmo}/${this.maxAmmo}`)
    return true
  }

  private showMuzzleFlash(): void {
    if (this.muzzleFlash && this.muzzleFlashMesh) {
      this.muzzleFlash.visible = true
      this.muzzleFlashMesh.visible = true
      
      // Hide after short duration
      setTimeout(() => {
        if (this.muzzleFlash && this.muzzleFlashMesh) {
          this.muzzleFlash.visible = false
          this.muzzleFlashMesh.visible = false
        }
      }, 50)
    }
  }

  private applyRecoil(): void {
    // Add upward recoil
    this.targetRecoil.x += (Math.random() - 0.5) * 0.02 // Horizontal spread
    this.targetRecoil.y += 0.03 + Math.random() * 0.02 // Vertical recoil
    this.targetRecoil.z += 0.01 // Slight backward push
  }

  private playFireSound(): void {
    if (!this.audioContext) return
    
    // Create simple gunshot sound using Web Audio API
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    // Gunshot-like sound profile
    oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1)
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.2)
  }

  // Reload mechanics
  reload(): boolean {
    if (this.isReloading || this.currentAmmo === this.maxAmmo) {
      return false
    }

    this.isReloading = true
    console.log('🔄 Reloading weapon...')
    
    // Play reload animation
    this.playReloadAnimation()
    
    // Reload after delay (faster for pistol)
    setTimeout(() => {
      this.currentAmmo = this.maxAmmo
      this.isReloading = false
      this.updateAmmoDisplay()
      console.log('✅ Pistol reload complete!')
    }, 2000) // 2.0 second reload time for pistol
    
    return true
  }

  private playReloadAnimation(): void {
    // Simple reload animation - weapon moves down and back up
    const originalPosition = this.weaponGroup.position.clone()
    
    // Move weapon down
    const downTween = () => {
      const startY = originalPosition.y
      const targetY = startY - 0.1
      let progress = 0
      
      const animate = () => {
        progress += 0.05
        if (progress <= 1) {
          this.weaponGroup.position.y = THREE.MathUtils.lerp(startY, targetY, progress)
          requestAnimationFrame(animate)
        } else {
          // Move back up
          upTween()
        }
      }
      animate()
    }
    
    const upTween = () => {
      const startY = this.weaponGroup.position.y
      const targetY = originalPosition.y
      let progress = 0
      
      const animate = () => {
        progress += 0.03
        if (progress <= 1) {
          this.weaponGroup.position.y = THREE.MathUtils.lerp(startY, targetY, progress)
          requestAnimationFrame(animate)
        }
      }
      animate()
    }
    
    downTween()
  }

  // Update weapon position and effects
  update(deltaTime: number, isMoving: boolean): void {
    // Weapon sway while moving
    if (isMoving) {
      const time = Date.now() * 0.001
      this.weaponSway.x = Math.sin(time * 2) * 0.005
      this.weaponSway.y = Math.sin(time * 4) * 0.003
    } else {
      this.weaponSway.multiplyScalar(0.95) // Dampen sway when still
    }
    
    // Recoil recovery
    this.recoilOffset.lerp(this.targetRecoil, deltaTime * 8)
    this.targetRecoil.multiplyScalar(0.85) // Recoil decay
    
    // Apply weapon position offsets (positioned for first-person visibility)
    this.weaponGroup.position.x = 0.0 + this.weaponSway.x + this.recoilOffset.x
    this.weaponGroup.position.y = 0.0 + this.weaponSway.y + this.recoilOffset.y
    this.weaponGroup.position.z = 0.0 + this.weaponSway.z + this.recoilOffset.z
    
    // Apply weapon rotation (recoil affects camera rotation in real implementation)
    this.weaponGroup.rotation.x = this.recoilOffset.y * 0.5
    this.weaponGroup.rotation.y = this.recoilOffset.x * 0.3
  }

  private updateAmmoDisplay(): void {
    const ammoElement = document.getElementById('ammo-value')
    if (ammoElement) {
      ammoElement.textContent = `${this.currentAmmo}/${this.maxAmmo}`
      
      // Change color based on ammo level
      if (this.currentAmmo === 0) {
        ammoElement.style.color = '#ff4444' // Red when empty
      } else if (this.currentAmmo <= 10) {
        ammoElement.style.color = '#ffaa44' // Orange when low
      } else {
        ammoElement.style.color = '#60a5fa' // Blue when normal
      }
    }
  }

  // Getters
  getCurrentAmmo(): number {
    return this.currentAmmo
  }

  getMaxAmmo(): number {
    return this.maxAmmo
  }

  isWeaponReloading(): boolean {
    return this.isReloading
  }

  canWeaponFire(): boolean {
    return this.canFire && !this.isReloading && this.currentAmmo > 0
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
    
    this.camera.remove(this.weaponGroup)
    
    if (this.audioContext) {
      this.audioContext.close()
    }
    
    console.log('🧹 Weapon system disposed')
  }
}
