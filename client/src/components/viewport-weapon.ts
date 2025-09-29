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
  
  constructor(mainCanvas: HTMLCanvasElement) {
    this.canvas = mainCanvas
    this.createWeaponCanvas()
    this.initWeaponRenderer()
    this.initWeaponScene()
    this.initWeaponCamera()
    this.createWeapon()
    
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
    
    const weaponMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x2c3e50,
      transparent: false
    })
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })

    // Create a large, visible pistol positioned in viewport
    // Main pistol body (positioned in bottom-right corner of viewport)
    const mainBodyGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.6)
    const mainBody = new THREE.Mesh(mainBodyGeometry, weaponMaterial)
    mainBody.position.set(1.2, -1.0, -2.0)
    mainBody.castShadow = true
    this.weaponGroup.add(mainBody)

    // Pistol barrel
    const barrelGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.4)
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
    barrel.position.set(1.2, -0.8, -2.5)
    barrel.castShadow = true
    this.weaponGroup.add(barrel)

    // Pistol grip
    const handleGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.2)
    const handle = new THREE.Mesh(handleGeometry, weaponMaterial)
    handle.position.set(1.2, -1.3, -1.8)
    handle.castShadow = true
    this.weaponGroup.add(handle)

    // Trigger guard
    const triggerGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.1)
    const trigger = new THREE.Mesh(triggerGeometry, barrelMaterial)
    trigger.position.set(1.2, -1.1, -1.9)
    trigger.castShadow = true
    this.weaponGroup.add(trigger)

    // Slide
    const slideGeometry = new THREE.BoxGeometry(0.25, 0.12, 0.5)
    const slide = new THREE.Mesh(slideGeometry, barrelMaterial)
    slide.position.set(1.2, -0.75, -2.0)
    slide.castShadow = true
    this.weaponGroup.add(slide)

    // Magazine
    const magazineGeometry = new THREE.BoxGeometry(0.12, 0.2, 0.15)
    const magazineMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial)
    magazine.position.set(1.2, -1.4, -1.8)
    magazine.castShadow = true
    this.weaponGroup.add(magazine)

    // Create muzzle flash
    this.createMuzzleFlash()
    
    // Add weapon to scene
    this.weaponScene.add(this.weaponGroup)
    
    console.log('✅ Viewport weapon created with', this.weaponGroup.children.length, 'components')
    console.log('📍 Weapon positioned for viewport overlay')
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
    
    if (!this.canFire || this.isReloading || this.currentAmmo <= 0 || 
        (now - this.lastShotTime) < this.fireRate) {
      return false
    }

    this.lastShotTime = now
    this.currentAmmo--
    
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
    console.log('🔄 Reloading viewport weapon...')
    
    setTimeout(() => {
      this.currentAmmo = this.maxAmmo
      this.isReloading = false
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
    
    // Recoil recovery
    this.recoilOffset.lerp(this.targetRecoil, deltaTime * 8)
    this.targetRecoil.multiplyScalar(0.85)
    
    // Apply weapon position offsets
    this.weaponGroup.position.x = this.weaponSway.x + this.recoilOffset.x
    this.weaponGroup.position.y = this.weaponSway.y + this.recoilOffset.y
    this.weaponGroup.position.z = this.weaponSway.z + this.recoilOffset.z
    
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
    
    this.weaponCamera.aspect = width / height
    this.weaponCamera.updateProjectionMatrix()
    this.weaponRenderer.setSize(width, height)
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
    
    this.weaponRenderer.dispose()
    this.weaponCanvas.parentElement?.removeChild(this.weaponCanvas)
    
    console.log('🧹 Viewport weapon system disposed')
  }
}
