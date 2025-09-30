import * as THREE from 'three'
import { FirstPersonControls } from '../systems/first-person-controls'
import { Arena } from '../components/arena'
import { PlayerModel } from '../components/player-model'
import { SettingsMenu } from '../ui/settings-menu'
import { GameClient } from '../networking/game-client'
import { NetworkedPlayerManager } from '../networking/networked-player-manager'

export class GameEngine {
  private canvas: HTMLCanvasElement
  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private clock!: THREE.Clock
  private controls!: FirstPersonControls
  private arena!: Arena
  private demoPlayerModel!: PlayerModel
  private settingsMenu!: SettingsMenu
  private gameClient!: GameClient
  private networkedPlayerManager!: NetworkedPlayerManager
  
  // Game state
  private gameState: 'menu' | 'playing' = 'menu'
  private gameMode: 'multiplayer' | 'practice' = 'multiplayer'
  private isGameInitialized = false
  private isRunning = false
  private isPaused = false
  
  // Match state
  private currentHealth = 100
  private maxHealth = 100
  private currentRound = 0
  private roundTimeLeft = 0
  private roundTimer: number | null = null
  private scores: Record<number, number> = {}
  private isAlive = true
  
  // Performance tracking
  private frameCount = 0
  private lastFpsUpdate = 0
  private fpsElement!: HTMLElement
  private positionUpdateInterval?: NodeJS.Timeout
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async initialize(): Promise<void> {
    console.log('🚀 Starting game engine initialization...')
    
    try {
      // Initialize Three.js components
      console.log('📦 Initializing renderer...')
      this.initRenderer()
      
      console.log('🌍 Initializing scene...')
      this.initScene()
      
      console.log('📷 Initializing camera...')
      this.initCamera()
      
      console.log('💡 Initializing lighting...')
      this.initLighting()
      
      console.log('🏟️ Initializing arena...')
      this.initArena()
      
      console.log('🎮 Basic engine initialized - ready for gameplay')
      
      console.log('⚙️ Initializing settings menu...')
      this.initSettingsMenu()
      
      console.log('🌐 Initializing networking...')
      this.initNetworking()
      
      // Initialize UI references
      console.log('🖥️ Setting up UI references...')
      this.fpsElement = document.getElementById('fpsValue') as HTMLElement
      
      // Initialize clock for timing
      console.log('⏰ Initializing clock...')
      this.clock = new THREE.Clock()
      
      // Start the render loop immediately so we can see the arena
      console.log('🎬 Starting render loop...')
      this.start()
      
      console.log('✅ Game engine initialization completed successfully')
    } catch (error) {
      console.error('❌ Error during game engine initialization:', error)
      throw error
    }
  }

  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false
    })
    
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x87CEEB, 1) // Sky blue background
    this.renderer.shadowMap.enabled = true
    
    // Add click handler to canvas for pointer lock
    this.canvas.addEventListener('click', () => {
      if (this.gameState === 'playing' && this.controls) {
        console.log('🖱️ Canvas clicked - requesting pointer lock')
        this.canvas.requestPointerLock()
      }
    })
    
    // Add emergency key handler to force controls activation
    document.addEventListener('keydown', (event) => {
      if (event.key === 'F1' && this.gameState === 'playing') {
        console.log('🆘 F1 pressed - forcing controls activation')
        if (!this.controls) {
          console.log('🔧 Controls missing - initializing now')
          this.initControls()
          this.settingsMenu.applyInitialSettings()
          this.connectControlsToNetworking()
        }
        this.canvas.requestPointerLock()
        console.log('🔒 Emergency pointer lock requested')
      }
      
      // Skip countdown with F2
      if (event.key === 'F2' && this.gameState === 'playing') {
        console.log('⏭️ F2 pressed - skipping countdown')
        const countdownOverlay = document.getElementById('countdown-overlay')
        if (countdownOverlay) {
          countdownOverlay.style.display = 'none'
        }
        this.canvas.requestPointerLock()
      }
    })
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    
    console.log('✅ Renderer initialized')
  }

  private initScene(): void {
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 100)
    console.log('✅ Scene initialized')
  }

  private initCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near plane
      1000 // Far plane
    )
    
    // Position camera at spawn point (open spawn area)
    this.camera.position.set(0, 1.8, 11)
    this.camera.lookAt(0, 1.8, 0)
    
    console.log('✅ Camera initialized')
  }

  private initArena(): void {
    this.arena = new Arena(this.scene)
    console.log('✅ Tactical arena initialized')
  }

  private initDemoPlayer(): void {
    // Demo player model removed - no longer needed for competitive play
    console.log('✅ Demo player model skipped - arena is now clean')
  }

  private initControls(): void {
    console.log('🎮 Initializing game controls...')
    this.controls = new FirstPersonControls(this.camera, this.canvas)
    
    // Add collision objects from the arena
    const coverObjects = this.arena.getCoverObjects()
    this.controls.addCollisionObjects(coverObjects)
    
    // Set scene for bullet hole system
    if (this.controls && (this.controls as any).collisionSystem) {
      (this.controls as any).collisionSystem.setScene(this.scene)
    }
    
    console.log('✅ First-person controls initialized with collision detection and bullet holes')
  }

  private initSettingsMenu(): void {
    this.settingsMenu = new SettingsMenu()
    
    // Connect settings callbacks
    this.settingsMenu.onSensitivityChanged((sensitivity) => {
      if (this.controls) {
        this.controls.setMouseSensitivity(sensitivity)
      }
    })
    
    this.settingsMenu.onFOVChanged((fov) => {
      if (this.controls) {
        this.controls.setFieldOfView(fov)
      }
    })
    
    this.settingsMenu.onViewmodelChanged((enabled) => {
      if (this.controls && (this.controls as any).viewportWeapon) {
        (this.controls as any).viewportWeapon.setVisible(enabled)
      }
    })

    this.settingsMenu.onCrosshairChanged((settings) => {
      // Crosshair is updated via CSS variables in the settings menu
      console.log('🎯 Crosshair settings applied:', settings)
    })

    this.settingsMenu.onViewmodelPositionChanged((x, y, z) => {
      if (this.controls && (this.controls as any).viewportWeapon) {
        (this.controls as any).viewportWeapon.setViewmodelPosition(x, y, z)
      }
    })
    
    this.settingsMenu.onStartGameRequested(() => {
      this.requestMatchmaking()
    })

    this.settingsMenu.onStartPracticeRequested(() => {
      this.startPracticeMode()
    })
    
    this.settingsMenu.onExitPracticeRequested(() => {
      this.exitPracticeMode()
    })
    
    this.settingsMenu.onShouldCloseCheck(() => {
      // Only allow closing if we're in playing state
      return this.gameState === 'playing'
    })

    this.settingsMenu.onServerInfoRequested(() => {
      if (this.gameClient && this.gameClient.connected) {
        this.gameClient.requestServerInfo()
      }
    })
    
    // Don't apply initial settings until controls are ready
    // They will be applied when the game starts
    
    // Add M key handler to toggle menu
    document.addEventListener('keydown', (event) => {
      if (event.code === 'KeyM') {
        console.log(`🔧 M key pressed - Game state: ${this.gameState}, Mode: ${this.gameMode}, Menu visible: ${this.settingsMenu.visible}, Round: ${this.currentRound}`)
        
        // If we're in menu state and menu is visible, don't close it
        if (this.gameState === 'menu' && this.settingsMenu.visible) {
          console.log('🔧 In main menu state - menu stays open')
          return
        }
        
        // If we're in menu state and menu is hidden, show it
        if (this.gameState === 'menu') {
          this.settingsMenu.show()
        } else {
          // We're in game - check for stuck menu during active multiplayer
          if (this.settingsMenu.visible && this.gameMode === 'multiplayer' && this.currentRound > 0) {
            console.log('🔧 FORCE CLOSING stuck menu during active multiplayer round')
            this.settingsMenu.hide()
            // Request pointer lock to get back into game
            const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
            if (canvas) {
              canvas.requestPointerLock()
            }
          } else {
            // Normal toggle
            this.settingsMenu.toggle()
          }
        }
        
        event.preventDefault()
        event.stopPropagation()
      }
    })
    
    console.log('✅ Settings menu initialized')
  }

  private initNetworking(): void {
    // Initialize game client
    this.gameClient = new GameClient()
    
    // Initialize networked player manager
    this.networkedPlayerManager = new NetworkedPlayerManager(this.scene)
    
    // Set up networking callbacks
    this.gameClient.onPlayerJoinedCallback((playerId) => {
      console.log('👤 Player joined match:', playerId)
      this.networkedPlayerManager.addPlayer(playerId)
    })
    
    this.gameClient.onPlayerLeftCallback((playerId) => {
      console.log('👋 Player left match:', playerId)
      this.networkedPlayerManager.removePlayer(playerId)
    })
    
    this.gameClient.onPlayerPositionUpdateCallback((playerId, position, rotation) => {
      console.log(`📍 Received position update for player ${playerId}:`, position, rotation)
      this.networkedPlayerManager.updatePlayerPosition(playerId, position, rotation)
    })
    
    this.gameClient.onPlayerShotCallback((playerId) => {
      this.networkedPlayerManager.showPlayerShot(playerId)
    })
    
    this.gameClient.onConnectionStatusChangeCallback((connected) => {
      console.log(`🌐 Connection status: ${connected ? 'Connected' : 'Disconnected'}`)
      // Update UI to show connection status
      this.updateConnectionStatus(connected)
    })
    
    this.gameClient.onMatchFoundCallback((matchData) => {
      console.log('⚔️ Match found! Starting game...', matchData)
      
      // IMMEDIATELY set game state to playing
      this.gameState = 'playing'
      this.gameMode = 'multiplayer'
      
      // Hide the menu immediately and force it
      console.log('🔧 Force hiding menu for match start')
      this.settingsMenu.hide()
      
      // Initialize game elements if not already done
      if (!this.isGameInitialized) {
        console.log('🎮 Initializing controls for multiplayer...')
        this.initControls()
        
        // Apply settings now that controls are ready
        console.log('⚙️ Applying initial settings to controls...')
        this.settingsMenu.applyInitialSettings()
        
        // Connect controls to networking
        this.connectControlsToNetworking()
        
        this.isGameInitialized = true
        console.log('✅ Game initialization complete - controls should be ready')
      } else {
        console.log('🎮 Game already initialized, controls should exist:', !!this.controls)
      }
      
      // Update menu state
      this.settingsMenu.updateGameState(true, 'multiplayer')
      
      // Show match start countdown
      this.showMatchStartCountdown(() => {
        console.log('🎯 Match countdown complete - ready for round start')
        // Don't call startGame() here - wait for round start from server
      })
    })

    // Handle competitive game events
    this.gameClient.onRoundStartCallback((roundData) => {
      this.handleRoundStart(roundData)
    })

    this.gameClient.onRoundEndCallback((roundData) => {
      this.handleRoundEnd(roundData)
    })

    this.gameClient.onMatchEndCallback((matchData) => {
      this.handleMatchEnd(matchData)
    })

    this.gameClient.onPlayerHitCallback((hitData) => {
      this.handlePlayerHit(hitData)
    })

    this.gameClient.onPlayerDeathCallback((deathData) => {
      this.handlePlayerDeath(deathData)
    })

    this.gameClient.onServerInfoCallback((serverData) => {
      this.handleServerInfo(serverData)
    })
    
    console.log('✅ Networking initialized')
  }

  private initLighting(): void {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    this.scene.add(ambientLight)
    
    // Main directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9)
    directionalLight.position.set(15, 25, 10)
    directionalLight.castShadow = true
    
    // Configure shadow mapping for the arena
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 100
    directionalLight.shadow.camera.left = -25
    directionalLight.shadow.camera.right = 25
    directionalLight.shadow.camera.top = 25
    directionalLight.shadow.camera.bottom = -25
    
    this.scene.add(directionalLight)
    
    // Add secondary light for better coverage
    const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.3)
    fillLight.position.set(-10, 15, -5)
    this.scene.add(fillLight)
    
    console.log('✅ Arena lighting initialized')
  }

  start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.isPaused = false
    
    console.log('🚀 Starting game loop')
    this.gameLoop()
  }

  pause(): void {
    this.isPaused = true
    console.log('⏸️ Game paused')
  }

  resume(): void {
    if (!this.isRunning) return
    
    this.isPaused = false
    this.clock.start()
    console.log('▶️ Game resumed')
  }

  stop(): void {
    this.isRunning = false
    console.log('⏹️ Game stopped')
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return

    // Request next frame
    requestAnimationFrame(this.gameLoop)

    if (this.isPaused) return

    // Get delta time
    const deltaTime = this.clock.getDelta()
    
    // Update game systems
    this.update(deltaTime)
    
    // Render the scene
    this.render()
    
    // Update performance metrics
    this.updatePerformanceMetrics()
  }

  private update(deltaTime: number): void {
    // Update first-person controls (only if initialized)
    if (this.controls) {
      this.controls.update(deltaTime)
    }
    
    // Update networked players
    if (this.networkedPlayerManager) {
      this.networkedPlayerManager.update(deltaTime)
    }
    
    // Update demo player model (only if it exists)
    if (this.demoPlayerModel) {
      this.demoPlayerModel.update(deltaTime)
    }
    
    // Game logic updates will go here
    // Arena and cover objects are now static - no updates needed
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  private updatePerformanceMetrics(): void {
    this.frameCount++
    
    const now = performance.now()
    if (now - this.lastFpsUpdate >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate))
      
      if (this.fpsElement) {
        this.fpsElement.textContent = fps.toString()
        
        // Color code FPS: Green > 55, Yellow > 30, Red <= 30
        if (fps > 55) {
          this.fpsElement.style.color = '#0f0'
        } else if (fps > 30) {
          this.fpsElement.style.color = '#ff0'
        } else {
          this.fpsElement.style.color = '#f00'
        }
      }
      
      this.frameCount = 0
      this.lastFpsUpdate = now
    }
  }

  showMainMenu(): void {
    console.log('🎮 Showing main menu')
    this.gameState = 'menu'
    
    // Hide the old loading screen
    const loadingElement = document.getElementById('loading')
    if (loadingElement) {
      loadingElement.style.display = 'none'
    }
    
    // Show the actual game menu
    this.settingsMenu.show()
  }

  startGame(): void {
    console.log('🚀 Starting multiplayer game...')
    this.gameState = 'playing'
    this.gameMode = 'multiplayer'
    
    // Initialize game elements if not already done
    if (!this.isGameInitialized) {
      console.log('🎮 Initializing controls...')
      this.initControls()
      
      // Apply settings now that controls are ready
      console.log('⚙️ Applying initial settings to controls...')
      this.settingsMenu.applyInitialSettings()
      
      // Connect controls to networking
      this.connectControlsToNetworking()
      
      this.isGameInitialized = true
    }
    
    // Update menu state to show resume/restart buttons
    this.settingsMenu.updateGameState(true, 'multiplayer')
    
    // Hide menu and start game loop
    this.settingsMenu.hide()
    
    // Start the actual game
    if (!this.isRunning) {
      this.start()
    }
    
    console.log('✅ Multiplayer game started successfully')
  }

  startPracticeMode(): void {
    console.log('🎯 Starting solo practice mode...')
    
    this.gameState = 'playing'
    this.gameMode = 'practice'
    
    // Hide the menu immediately
    this.settingsMenu.hide()
    
    // Start practice immediately (no countdown)
    if (!this.isGameInitialized) {
      console.log('🚀 Initializing practice components...')
      
      console.log('🎮 Initializing controls...')
      this.initControls()
      
      // Apply settings now that controls are ready
      console.log('⚙️ Applying initial settings to controls...')
      this.settingsMenu.applyInitialSettings()
      
      // Don't connect to networking in practice mode
      
      this.isGameInitialized = true
      console.log('✅ Practice initialization complete')
    }
    
    // Update menu state
    this.settingsMenu.updateGameState(true, 'practice') // Show exit practice button
    
    if (!this.isRunning) {
      this.start()
    }
    
    // Set player to spawn position (original safe spawn behind cover)
    this.camera.position.set(0, 1.8, 11)
    
    console.log('🎯 Solo practice started!')
  }

  exitPracticeMode(): void {
    console.log('🚪 Exiting practice mode...')
    
    // Stop the game
    this.stop()
    
    // Reset game state to menu
    this.gameState = 'menu'
    this.gameMode = 'multiplayer'
    this.isGameInitialized = false
    
    // Reset camera to menu position
    this.camera.position.set(0, 1.8, 11)
    
    // Dispose of controls if they exist
    if (this.controls) {
      this.controls.dispose()
    }
    
    // Clear any networking
    if (this.gameClient) {
      this.gameClient.disconnect()
    }
    
    // Reset match state
    this.currentHealth = 100
    this.currentRound = 0
    this.roundTimeLeft = 0
    this.isAlive = true
    this.scores = {}
    
    // Clear round timer
    if (this.roundTimer) {
      clearInterval(this.roundTimer)
      this.roundTimer = null
    }
    
    // Update menu state to show main menu buttons
    this.settingsMenu.updateGameState(false)
    
    // Show the main menu
    this.showMainMenu()
    
    console.log('✅ Returned to main menu')
  }

  private async requestMatchmaking(): Promise<void> {
    console.log('🔍 Requesting matchmaking...')
    
    try {
      // Connect to server if not already connected
      if (!this.gameClient.connected) {
        console.log('🔌 Connecting to game server...')
        const serverUrl = import.meta.env.VITE_SERVER_URL || 'ws://localhost:8080/game'
        await this.gameClient.connect(serverUrl)
      }
      
      // Request 1v1 matchmaking
      this.gameClient.requestMatchmaking('1v1')
      
      // Update UI to show matchmaking status and disable practice
      this.updateMatchmakingStatus('Searching for opponent...')
      this.settingsMenu.updateGameState(false, undefined, true) // isMatchmaking = true
      
    } catch (error) {
      console.error('❌ Failed to connect to server:', error)
      this.updateMatchmakingStatus('Connection failed - playing offline')
      
      // Fall back to single player mode
      setTimeout(() => {
        this.startGame()
      }, 1000)
    }
  }

  private updateConnectionStatus(connected: boolean): void {
    // Update connection indicator in the UI
    const connectionIndicator = document.createElement('div')
    connectionIndicator.id = 'connection-status'
    connectionIndicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      font-weight: bold;
      z-index: 1001;
      ${connected ? 
        'background: rgba(76, 175, 80, 0.9); color: white;' : 
        'background: rgba(244, 67, 54, 0.9); color: white;'
      }
    `
    connectionIndicator.textContent = connected ? '🟢 Online' : '🔴 Offline'
    
    // Remove existing indicator
    const existing = document.getElementById('connection-status')
    if (existing) {
      existing.remove()
    }
    
    // Add new indicator
    document.body.appendChild(connectionIndicator)
    
    // Auto-hide after 3 seconds if connected
    if (connected) {
      setTimeout(() => {
        connectionIndicator.remove()
      }, 3000)
    }
  }

  private updateMatchmakingStatus(status: string): void {
    console.log('🔍 Matchmaking status:', status)
    
    // Update the game menu to show matchmaking status
    const matchInfo = document.querySelector('.info-grid')
    if (matchInfo) {
      let statusItem = matchInfo.querySelector('.matchmaking-status-item')
      if (!statusItem) {
        statusItem = document.createElement('div')
        statusItem.className = 'info-item matchmaking-status-item'
        matchInfo.appendChild(statusItem)
      }
      
      statusItem.innerHTML = `
        <span class="info-label">Status</span>
        <span class="info-value">${status}</span>
      `
    }
  }

  private connectControlsToNetworking(): void {
    if (!this.controls || !this.gameClient) {
      console.warn('⚠️ Cannot connect controls to networking - missing components')
      return
    }

    console.log('🔗 Connecting controls to networking...')
    
    // Send position updates to server periodically
    // Position updates now handled in real-time by controls (Python script style)
    
    // Set up shooting callback for proper hit detection
    this.controls.setShootCallback((shootData) => {
      // Send shot to server if connected
      if (this.gameClient.connected && this.gameState === 'playing') {
        console.log('🎯 Sending shot data to server for hit detection')
        
        // Send shot with collision-checked data
        this.gameClient.sendPlayerShot(
          { x: shootData.direction.x, y: shootData.direction.y, z: shootData.direction.z },
          { x: shootData.origin.x, y: shootData.origin.y, z: shootData.origin.z }
        )
      }
    })
    
    // Set up position update callback (Python script style - simple and direct)
    let lastPositionSent = 0
    const positionSendRate = 100 // 10 times per second like Python script
    
    this.controls.setPositionCallback((position, rotation) => {
      if (this.gameClient.connected && this.gameState === 'playing') {
        const now = Date.now()
        if (now - lastPositionSent >= positionSendRate) {
          lastPositionSent = now
          this.gameClient.sendPlayerPosition(
            { x: position.x, y: position.y, z: position.z },
            { x: rotation.x, y: rotation.y, z: rotation.z }
          )
        }
      }
    })
    
    console.log('✅ Controls connected to networking')
  }

  handleResize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    
    // Update camera aspect ratio
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    
    // Update renderer size
    this.renderer.setSize(width, height)
    
    // Update viewport weapon renderer if controls exist
    if (this.controls && (this.controls as any).viewportWeapon) {
      (this.controls as any).viewportWeapon.handleResize()
    }
    
    console.log(`📐 Resized to ${width}x${height}`)
  }

  // Competitive game event handlers
  private handleRoundStart(roundData: any): void {
    console.log(`🎯 Round ${roundData.round} starting!`, roundData)
    
    // CRITICAL: Ensure controls are initialized before doing anything
    if (!this.controls) {
      console.error('❌ CRITICAL: Controls not initialized when round started!')
      console.log('🔧 Emergency controls initialization...')
      this.initControls()
      this.settingsMenu.applyInitialSettings()
      this.connectControlsToNetworking()
    }
    
    // FORCE CLOSE THE MENU - this is critical for multiplayer
    if (this.settingsMenu.visible) {
      console.log('🔧 Force closing menu for round start')
      this.settingsMenu.hide()
    }
    
    // Update match state
    this.currentRound = roundData.round
    this.currentHealth = roundData.health
    this.roundTimeLeft = roundData.timeLimit
    this.scores = roundData.scores
    this.isAlive = true
    
    // Show competitive HUD
    const competitiveHud = document.getElementById('competitive-hud')
    if (competitiveHud) {
      competitiveHud.style.display = 'block'
    }
    
    // Update UI
    this.updateCompetitiveUI()
    
    // Teleport player to spawn position
    if (roundData.spawnPosition && this.camera) {
      console.log(`📍 Setting spawn position: ${JSON.stringify(roundData.spawnPosition)}`)
      this.camera.position.set(
        roundData.spawnPosition.x,
        roundData.spawnPosition.y,
        roundData.spawnPosition.z
      )
      console.log(`📍 Camera position set to: ${this.camera.position.x}, ${this.camera.position.y}, ${this.camera.position.z}`)
    } else {
      console.error('❌ No spawn position provided or camera missing!', {
        spawnPosition: roundData.spawnPosition,
        camera: !!this.camera
      })
    }
    
    // Show round countdown before starting
    this.showRoundCountdown(roundData.round, () => {
      // Start round timer after countdown
      this.startRoundTimer()
      
      // Ensure controls are enabled and pointer lock is active
      if (this.controls) {
        console.log('🎮 Enabling controls for round start')
        console.log('🎮 Controls object exists:', !!this.controls)
        console.log('🎮 Canvas element:', !!this.canvas)
        
        // Force enable controls immediately
        this.canvas.requestPointerLock()
        console.log('🔒 Requested pointer lock (immediate)')
        
        // Show click-to-play message
        const clickToPlayElement = document.getElementById('click-to-play')
        if (clickToPlayElement) {
          clickToPlayElement.style.display = 'block'
        }
        
        // Add click listener to canvas for manual activation
        const activateControls = () => {
          this.canvas.requestPointerLock()
          console.log('🔒 Pointer lock requested via click')
          
          // Hide click-to-play message
          if (clickToPlayElement) {
            clickToPlayElement.style.display = 'none'
          }
        }
        
        this.canvas.addEventListener('click', activateControls)
        document.addEventListener('click', activateControls)
        
        // Also try multiple delayed attempts
        setTimeout(() => {
          this.canvas.requestPointerLock()
          console.log('🔒 Requested pointer lock (500ms delay)')
        }, 500)
        
        setTimeout(() => {
          this.canvas.requestPointerLock()
          console.log('🔒 Requested pointer lock (1000ms delay)')
        }, 1000)
        
      } else {
        console.error('❌ Controls not initialized when round started!')
      }
      
      console.log(`🎯 Round ${roundData.round} started!`)
    })
  }

  private handleRoundEnd(roundData: any): void {
    console.log(`🏁 Round ${roundData.round} ended - Winner: ${roundData.winner}`)
    
    // Update scores
    this.scores = roundData.scores
    this.updateCompetitiveUI()
    
    // Stop round timer
    if (this.roundTimer) {
      clearInterval(this.roundTimer)
      this.roundTimer = null
    }
    
    // Determine if we won this round
    const isWinner = roundData.winner === this.gameClient.playerID
    const isTie = roundData.winner === null
    
    // Show round result overlay
    if (!isTie) {
      this.showRoundResult(isWinner, roundData.round)
    } else {
      // Show tie message in match status
      this.showMatchStatus('Round Tied!', 3000)
    }
  }

  private handleMatchEnd(matchData: any): void {
    console.log(`🏆 Match ended - Winner: ${matchData.winner}`)
    
    // Stop round timer
    if (this.roundTimer) {
      clearInterval(this.roundTimer)
      this.roundTimer = null
    }
    
    // Show final result
    const isWinner = matchData.winner === this.gameClient.playerID
    const message = matchData.winner === null ? 
      'Match Tied!' : 
      (isWinner ? '🏆 YOU WON THE MATCH!' : '💀 YOU LOST THE MATCH!')
    
    this.showMatchStatus(message, 10000)
    
    // Hide competitive HUD after delay
    setTimeout(() => {
      const competitiveHud = document.getElementById('competitive-hud')
      if (competitiveHud) {
        competitiveHud.style.display = 'none'
      }
      
      // Return to menu
      this.gameState = 'menu'
      this.settingsMenu.show()
      this.settingsMenu.updateGameState(false)
    }, 10000)
  }

  private handlePlayerHit(hitData: any): void {
    console.log(`💥 Hit detected - Damage: ${hitData.damage}${hitData.isHeadshot ? ' (HEADSHOT!)' : ''}`)
    
    // Update health if we were hit
    if (hitData.targetId === this.gameClient.playerID) {
      this.currentHealth = hitData.newHealth
      this.updateHealthDisplay()
      
      // Show hit indicator
      this.showHitIndicator(hitData.isHeadshot)
    }
  }

  private handlePlayerDeath(deathData: any): void {
    console.log(`💀 Player death - Killer: ${deathData.killerId}, Victim: ${deathData.victimId}`)
    
    // Check if we died
    if (deathData.victimId === this.gameClient.playerID) {
      this.isAlive = false
      this.currentHealth = 0
      this.updateHealthDisplay()
      
      // Show death message
      this.showMatchStatus('💀 You were eliminated!', 3000)
      
      // TODO: Implement spectator mode
    } else if (deathData.killerId === this.gameClient.playerID) {
      // We got a kill
      this.showMatchStatus(`💀 Eliminated enemy${deathData.isHeadshot ? ' (HEADSHOT!)' : ''}!`, 2000)
    }
  }

  private updateCompetitiveUI(): void {
    // Update round counter
    const roundCounter = document.getElementById('round-counter')
    if (roundCounter) {
      roundCounter.textContent = `Round ${this.currentRound}`
    }
    
    // Update scores
    const playerScore = document.getElementById('player-score')
    const enemyScore = document.getElementById('enemy-score')
    
    if (playerScore && enemyScore) {
      const myId = this.gameClient.playerID
      const myScore = myId ? (this.scores[myId] || 0) : 0
      
      // Find enemy score
      let enemyScoreValue = 0
      for (const [playerId, score] of Object.entries(this.scores)) {
        if (parseInt(playerId) !== myId) {
          enemyScoreValue = score
          break
        }
      }
      
      playerScore.textContent = `You: ${myScore}`
      enemyScore.textContent = `Enemy: ${enemyScoreValue}`
    }
  }

  private startRoundTimer(): void {
    if (this.roundTimer) {
      clearInterval(this.roundTimer)
    }
    
    this.roundTimer = setInterval(() => {
      this.roundTimeLeft -= 1000
      
      if (this.roundTimeLeft <= 0) {
        this.roundTimeLeft = 0
        if (this.roundTimer) {
          clearInterval(this.roundTimer)
          this.roundTimer = null
        }
      }
      
      // Update timer display
      const timerElement = document.getElementById('round-timer')
      if (timerElement) {
        const minutes = Math.floor(this.roundTimeLeft / 60000)
        const seconds = Math.floor((this.roundTimeLeft % 60000) / 1000)
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`
        
        // Change color when time is running out
        if (this.roundTimeLeft <= 30000) { // Last 30 seconds
          timerElement.style.color = '#f87171'
        } else {
          timerElement.style.color = '#fff'
        }
      }
    }, 1000)
  }

  private showMatchStatus(message: string, duration: number): void {
    const statusElement = document.getElementById('match-status')
    if (statusElement) {
      statusElement.textContent = message
      statusElement.style.display = 'block'
      
      setTimeout(() => {
        statusElement.style.display = 'none'
      }, duration)
    }
  }

  private showHitIndicator(isHeadshot: boolean): void {
    const hitIndicator = document.getElementById('hit-indicator')
    if (hitIndicator) {
      hitIndicator.style.display = 'block'
      
      if (isHeadshot) {
        hitIndicator.classList.add('headshot-indicator')
      }
      
      setTimeout(() => {
        hitIndicator.style.display = 'none'
        hitIndicator.classList.remove('headshot-indicator')
      }, 500)
    }
  }

  private updateHealthDisplay(): void {
    const healthElement = document.getElementById('health-value')
    if (healthElement) {
      healthElement.textContent = this.currentHealth.toString()
      
      // Change color based on health
      if (this.currentHealth <= 25) {
        healthElement.style.color = '#f87171' // Red
      } else if (this.currentHealth <= 50) {
        healthElement.style.color = '#fbbf24' // Yellow
      } else {
        healthElement.style.color = '#4ade80' // Green
      }
    }
  }

  private handleServerInfo(serverData: any): void {
    console.log('📊 Received server info:', serverData)
    
    // Update the settings menu server list
    this.settingsMenu.updateServerList(serverData)
  }

  private showMatchStartCountdown(onComplete: () => void): void {
    console.log('⏱️ Starting match countdown...')
    
    const overlay = document.getElementById('countdown-overlay')
    const textElement = document.getElementById('countdown-text')
    const numberElement = document.getElementById('countdown-number')
    
    if (!overlay || !textElement || !numberElement) {
      console.warn('⚠️ Countdown elements not found, starting game immediately')
      onComplete()
      return
    }
    
    // Show overlay
    overlay.style.display = 'flex'
    textElement.textContent = 'Match Starting...'
    
    let count = 3
    
    const updateCountdown = () => {
      if (count > 0) {
        numberElement.textContent = count.toString()
        numberElement.className = '' // Reset classes
        // Trigger animation by forcing reflow
        numberElement.offsetHeight
        numberElement.style.animation = 'none'
        numberElement.offsetHeight
        numberElement.style.animation = 'countdownPulse 1s ease-in-out'
        
        count--
        setTimeout(updateCountdown, 1000)
      } else {
        // Show "GO!" message
        numberElement.textContent = 'GO!'
        numberElement.classList.add('countdown-go')
        
        setTimeout(() => {
          overlay.style.display = 'none'
          onComplete()
        }, 800)
      }
    }
    
    updateCountdown()
  }

  private showRoundCountdown(roundNumber: number, onComplete: () => void): void {
    console.log(`⏱️ Starting round ${roundNumber} countdown...`)
    
    const overlay = document.getElementById('countdown-overlay')
    const textElement = document.getElementById('countdown-text')
    const numberElement = document.getElementById('countdown-number')
    
    if (!overlay || !textElement || !numberElement) {
      console.warn('⚠️ Countdown elements not found, starting round immediately')
      onComplete()
      return
    }
    
    // Show overlay
    overlay.style.display = 'flex'
    textElement.textContent = `Round ${roundNumber}`
    
    let count = 3
    
    const updateCountdown = () => {
      if (count > 0) {
        numberElement.textContent = count.toString()
        numberElement.className = '' // Reset classes
        // Trigger animation by forcing reflow
        numberElement.offsetHeight
        numberElement.style.animation = 'none'
        numberElement.offsetHeight
        numberElement.style.animation = 'countdownPulse 1s ease-in-out'
        
        count--
        setTimeout(updateCountdown, 1000)
      } else {
        // Show "FIGHT!" message
        numberElement.textContent = 'FIGHT!'
        numberElement.classList.add('countdown-go')
        
        setTimeout(() => {
          overlay.style.display = 'none'
          onComplete()
        }, 800)
      }
    }
    
    updateCountdown()
  }

  private showRoundResult(won: boolean, roundNumber: number): void {
    console.log(`🏁 Showing round ${roundNumber} result: ${won ? 'WON' : 'LOST'}`)
    
    const overlay = document.getElementById('countdown-overlay')
    const textElement = document.getElementById('countdown-text')
    const numberElement = document.getElementById('countdown-number')
    
    if (!overlay || !textElement || !numberElement) {
      console.warn('⚠️ Countdown elements not found')
      return
    }
    
    // Show overlay
    overlay.style.display = 'flex'
    textElement.textContent = `Round ${roundNumber}`
    textElement.className = won ? 'countdown-round-won' : 'countdown-round-lost'
    
    numberElement.textContent = won ? 'WON!' : 'LOST!'
    numberElement.className = won ? 'countdown-round-won' : 'countdown-round-lost'
    
    // Hide after 3 seconds
    setTimeout(() => {
      overlay.style.display = 'none'
      textElement.className = '' // Reset classes
      numberElement.className = ''
    }, 3000)
  }

  private showPracticeStartCountdown(onComplete: () => void): void {
    console.log('⏱️ Starting practice countdown...')
    
    const overlay = document.getElementById('countdown-overlay')
    const textElement = document.getElementById('countdown-text')
    const numberElement = document.getElementById('countdown-number')
    
    if (!overlay || !textElement || !numberElement) {
      console.warn('⚠️ Countdown elements not found, starting practice immediately')
      onComplete()
      return
    }
    
    // Show overlay
    overlay.style.display = 'flex'
    textElement.textContent = 'Practice Mode'
    
    let count = 3
    
    const updateCountdown = () => {
      if (count > 0) {
        numberElement.textContent = count.toString()
        numberElement.className = '' // Reset classes
        // Trigger animation by forcing reflow
        numberElement.offsetHeight
        numberElement.style.animation = 'none'
        numberElement.offsetHeight
        numberElement.style.animation = 'countdownPulse 1s ease-in-out'
        
        count--
        setTimeout(updateCountdown, 1000)
      } else {
        // Show "PRACTICE!" message
        numberElement.textContent = 'PRACTICE!'
        numberElement.classList.add('countdown-go')
        
        setTimeout(() => {
          overlay.style.display = 'none'
          onComplete()
        }, 800)
      }
    }
    
    updateCountdown()
  }

  // Cleanup method for proper disposal
  dispose(): void {
    this.stop()
    
    // Clean up networking
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval)
    }
    
    // Clean up round timer
    if (this.roundTimer) {
      clearInterval(this.roundTimer)
    }
    
    if (this.gameClient) {
      this.gameClient.dispose()
    }
    
    if (this.networkedPlayerManager) {
      this.networkedPlayerManager.dispose()
    }
    
    // Dispose of controls
    if (this.controls) {
      this.controls.dispose()
    }
    
    // Dispose of arena
    if (this.arena) {
      this.arena.dispose()
    }
    
    // Demo player model no longer used
    
    // Dispose of settings menu
    if (this.settingsMenu) {
      this.settingsMenu.dispose()
    }
    
    // Dispose of Three.js resources
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (object.material instanceof THREE.Material) {
          object.material.dispose()
        }
      }
    })
    
    this.renderer.dispose()
    console.log('🧹 Game engine disposed')
  }
}

