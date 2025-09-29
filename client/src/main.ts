import { GameEngine } from './core/game-engine'

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Tactical Arena Shooter - Initializing...')
  
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
  const loadingElement = document.getElementById('loading') as HTMLElement
  
  if (!canvas) {
    console.error('❌ Canvas element not found')
    return
  }

  // Create game engine instance
  const gameEngine = new GameEngine(canvas)
  
  // Initialize the game
  gameEngine.initialize().then(() => {
    console.log('✅ Game engine initialized successfully')
    
    // Show main menu instead of starting the game immediately
    gameEngine.showMainMenu()
    
    console.log('🎮 Main menu displayed - Use menu to start playing!')
  }).catch((error) => {
    console.error('❌ Failed to initialize game engine:', error)
    loadingElement.innerHTML = `
      <div style="color: #ff4444;">
        <div>Failed to load game</div>
        <div style="font-size: 14px; margin-top: 10px;">
          Error: ${error.message}
        </div>
        <div style="font-size: 12px; margin-top: 10px;">
          Check console for details
        </div>
      </div>
    `
  })

  // Handle window resize
  window.addEventListener('resize', () => {
    gameEngine.handleResize()
  })

  // Handle visibility changes (pause when tab is not active)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      gameEngine.pause()
    } else {
      gameEngine.resume()
    }
  })
})

