export interface GameSettings {
  mouseSensitivity: number
  fieldOfView: number
  viewmodelEnabled: boolean
}

export class SettingsMenu {
  private settingsElement!: HTMLElement
  private isVisible = false
  private settings: GameSettings
  
  // Callbacks for settings changes
  private onSensitivityChange?: (sensitivity: number) => void
  private onFOVChange?: (fov: number) => void
  private onViewmodelChange?: (enabled: boolean) => void
  private onStartGame?: () => void
  private onStartPractice?: () => void
  private onExitPractice?: () => void
  private onShouldClose?: () => boolean
  private onRequestServerInfo?: () => void
  
  // Debug logging
  private debugLogElement?: HTMLElement

  constructor() {
    this.settings = this.loadSettings()
    this.createSettingsMenu()
    this.setupEventListeners()
    this.setupDebugLogging()
  }

  private loadSettings(): GameSettings {
    // Load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem('tactical-shooter-settings')
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings)
      } catch (error) {
        console.warn('Failed to load settings, using defaults')
      }
    }
    
    return {
      mouseSensitivity: 1.0,
      fieldOfView: 75,
      viewmodelEnabled: true
    }
  }

  private saveSettings(): void {
    localStorage.setItem('tactical-shooter-settings', JSON.stringify(this.settings))
    console.log('✅ Settings saved')
  }

  private createSettingsMenu(): void {
    // Create settings menu HTML
    this.settingsElement = document.createElement('div')
    this.settingsElement.id = 'settings-menu'
    this.settingsElement.innerHTML = `
      <div class="settings-overlay">
        <div class="settings-panel">
          <div class="settings-header">
            <h2>🎮 Game Menu</h2>
            <button class="close-btn" id="close-settings">✕</button>
          </div>
          
          <div class="menu-tabs">
            <button class="tab-btn active" data-tab="game">🎯 Game</button>
            <button class="tab-btn" data-tab="inventory">🎒 Inventory</button>
            <button class="tab-btn" data-tab="debug">🐛 Debug</button>
            <button class="tab-btn" data-tab="gameplay">⚙️ Settings</button>
          </div>
          
          <div class="settings-content">
            <!-- Game Tab -->
            <div class="tab-content active" data-tab="game">
          <div class="settings-section">
            <h3>🎮 Game Modes</h3>
            <div class="button-group">
              <button class="btn btn-primary" id="matchmake-1v1">⚔️ Find Match</button>
              <button class="btn btn-success" id="solo-practice">🎯 Practice</button>
              <button class="btn btn-warning" id="exit-practice" style="display: none;">🚪 Exit Practice</button>
              <button class="btn btn-secondary" id="resume-game" style="display: none;">▶️ Resume</button>
            </div>
          </div>
              
              <div class="settings-section" id="server-section">
                <h3>🌐 Server</h3>
                <div class="server-list">
                  <div class="server-item server-selected" data-server="railway-main">
                    <span class="server-name">🚂 Railway Main Server</span>
                    <span class="server-ping">--ms</span>
                    <span class="server-players">--/--</span>
                    <span class="server-status">🔄</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Inventory Tab -->
            <div class="tab-content" data-tab="inventory">
              <div class="settings-section">
                <h3>🔫 Weapons</h3>
                <div class="inventory-grid">
                  <div class="inventory-slot active">
                    <div class="item-icon">🔫</div>
                    <div class="item-name">Pistol</div>
                    <div class="item-ammo">15/15</div>
                  </div>
                  <div class="inventory-slot disabled">
                    <div class="item-icon">🔫</div>
                    <div class="item-name">Rifle</div>
                    <div class="item-ammo">Coming Soon</div>
                  </div>
                </div>
              </div>
              
              <div class="settings-section">
                <h3>🎒 Equipment</h3>
                <div class="inventory-grid">
                  <div class="inventory-slot disabled">
                    <div class="item-icon">🛡️</div>
                    <div class="item-name">Armor</div>
                    <div class="item-ammo">Coming Soon</div>
                  </div>
                  <div class="inventory-slot disabled">
                    <div class="item-icon">💊</div>
                    <div class="item-name">Health Kit</div>
                    <div class="item-ammo">Coming Soon</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Debug Tab -->
            <div class="tab-content" data-tab="debug">
              <div class="settings-section">
                <h3>🐛 Debug Console</h3>
                <div class="debug-log" id="debug-log">
                  <div class="debug-placeholder">Debug messages will appear here...</div>
                </div>
                <button class="btn btn-secondary" id="clear-debug">Clear Log</button>
              </div>
            </div>
            
            <!-- Gameplay Settings Tab -->
            <div class="tab-content" data-tab="gameplay">
              <div class="settings-section">
                <h3>🖱️ Controls</h3>
                <div class="setting-group">
                  <label for="sensitivity-slider">Mouse Sensitivity</label>
                  <div class="slider-container">
                    <input type="range" id="sensitivity-slider" min="0.1" max="3.0" step="0.1" value="${this.settings.mouseSensitivity}">
                    <span class="slider-value" id="sensitivity-value">${this.settings.mouseSensitivity.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              
              <div class="settings-section">
                <h3>📷 Display</h3>
                <div class="setting-group">
                  <label for="fov-slider">Field of View</label>
                  <div class="slider-container">
                    <input type="range" id="fov-slider" min="60" max="120" step="5" value="${this.settings.fieldOfView}">
                    <span class="slider-value" id="fov-value">${this.settings.fieldOfView}°</span>
                  </div>
                </div>
                
                <div class="setting-group">
                  <label class="checkbox-container">
                    <input type="checkbox" id="viewmodel-toggle" ${this.settings.viewmodelEnabled ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    Show Weapon Viewmodel
                  </label>
                </div>
              </div>
            </div>
            
          <div class="settings-footer">
            <button class="btn btn-secondary" id="reset-settings">Reset to Defaults</button>
            <button class="btn btn-primary" id="apply-settings">Save Settings</button>
          </div>
          </div>
        </div>
      </div>
    `
    
    // Add CSS styles
    this.addStyles()
    
    // Hide initially
    this.settingsElement.style.display = 'none'
    document.body.appendChild(this.settingsElement)
    
    console.log('✅ Settings menu created')
  }

  private addStyles(): void {
    const style = document.createElement('style')
    style.textContent = `
      #settings-menu {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        font-family: 'Courier New', monospace;
      }
      
      .settings-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(5px);
        z-index: 9999;
        cursor: default;
      }
      
      .settings-panel {
        background: rgba(20, 20, 20, 0.95);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 12px;
        padding: 0;
        width: 600px;
        max-width: 90vw;
        max-height: 80vh;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        overflow: hidden;
      }
      
      .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 25px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .settings-header h2 {
        margin: 0;
        color: #fff;
        font-size: 24px;
        font-weight: bold;
      }
      
      .close-btn {
        background: none;
        border: none;
        color: #ccc;
        font-size: 24px;
        cursor: pointer;
        padding: 5px 10px;
        border-radius: 4px;
        transition: all 0.2s;
      }
      
      .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      
      .menu-tabs {
        display: flex;
        background: rgba(0, 0, 0, 0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .tab-btn {
        flex: 1;
        padding: 15px 20px;
        background: none;
        border: none;
        color: #ccc;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'Courier New', monospace;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .tab-btn:last-child {
        border-right: none;
      }
      
      .tab-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      
      .tab-btn.active {
        background: rgba(74, 144, 226, 0.3);
        color: #4a90e2;
        border-bottom: 2px solid #4a90e2;
      }
      
      .settings-content {
        padding: 25px;
        max-height: 60vh;
        overflow-y: auto;
      }
      
      .tab-content {
        display: none;
      }
      
      .tab-content.active {
        display: block;
      }
      
      .settings-section {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .settings-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }
      
      .settings-section h3 {
        color: #4a90e2;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .setting-group {
        margin-bottom: 25px;
      }
      
      .setting-group label {
        display: block;
        color: #ccc;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      
      .slider-container {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      
      .slider-container input[type="range"] {
        flex: 1;
        height: 6px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        outline: none;
        -webkit-appearance: none;
      }
      
      .slider-container input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        background: #4a90e2;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .slider-container input[type="range"]::-webkit-slider-thumb:hover {
        background: #5ba3f5;
        transform: scale(1.1);
      }
      
      .slider-value {
        color: #4a90e2;
        font-weight: bold;
        font-size: 16px;
        min-width: 50px;
        text-align: center;
      }
      
      .settings-footer {
        display: flex;
        gap: 15px;
        justify-content: flex-end;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'Courier New', monospace;
      }
      
      .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #ccc;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      
      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
      
      .btn-primary {
        background: #4a90e2;
        color: #fff;
      }
      
      .btn-primary:hover {
        background: #5ba3f5;
        transform: translateY(-1px);
      }
      
        .btn-success {
          background: #10b981;
          color: #fff;
        }
        
        .btn-success:hover {
          background: #059669;
          transform: translateY(-1px);
        }
        
        .btn-warning {
          background: #f59e0b;
          color: #fff;
        }
        
        .btn-warning:hover {
          background: #d97706;
          transform: translateY(-1px);
        }
      
      .debug-section {
        margin-bottom: 25px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        padding-top: 20px;
      }
      
      .debug-section label {
        display: block;
        color: #ccc;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      
      .debug-log {
        background: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 10px;
        height: 150px;
        overflow-y: auto;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        margin-bottom: 10px;
      }
      
      .debug-placeholder {
        color: #666;
        font-style: italic;
      }
      
      .debug-message {
        color: #fff;
        margin-bottom: 2px;
        word-wrap: break-word;
      }
      
      .debug-message.error {
        color: #ff6b6b;
      }
      
      .debug-message.warning {
        color: #ffa726;
      }
      
      .debug-message.success {
        color: #4caf50;
      }
      
      /* Checkbox styling */
      .checkbox-container {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-size: 16px;
        color: #ccc;
        font-weight: bold;
      }
      
      .checkbox-container input {
        display: none;
      }
      
      .checkmark {
        width: 20px;
        height: 20px;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        margin-right: 12px;
        position: relative;
        transition: all 0.2s;
      }
      
      .checkbox-container:hover .checkmark {
        background: rgba(255, 255, 255, 0.2);
        border-color: #4a90e2;
      }
      
      .checkbox-container input:checked + .checkmark {
        background: #4a90e2;
        border-color: #4a90e2;
      }
      
      .checkbox-container input:checked + .checkmark:after {
        content: "✓";
        position: absolute;
        top: -2px;
        left: 3px;
        color: white;
        font-size: 14px;
        font-weight: bold;
      }
      
      /* Button groups */
      .button-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      
      .btn-danger {
        background: #dc3545;
        color: #fff;
      }
      
      .btn-danger:hover {
        background: #c82333;
        transform: translateY(-1px);
      }
      
      /* Info grid */
      .info-grid {
        display: grid;
        gap: 12px;
      }
      
      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .info-label {
        color: #ccc;
        font-weight: bold;
      }
      
      .info-value {
        color: #4a90e2;
        font-weight: bold;
      }
      
      /* Inventory grid */
      .inventory-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 15px;
      }
      
      /* Server List Styles */
      .server-list {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        overflow: hidden;
        margin-top: 10px;
      }
      
      .server-header {
        display: grid;
        grid-template-columns: 2fr 80px 80px 80px;
        gap: 10px;
        padding: 12px 15px;
        background: rgba(255, 255, 255, 0.1);
        font-weight: bold;
        font-size: 12px;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.8);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .server-item {
        display: grid;
        grid-template-columns: 2fr 80px 80px 80px;
        gap: 10px;
        padding: 12px 15px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 13px;
      }
      
      .server-item:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      
      .server-item.server-selected {
        background: rgba(0, 150, 255, 0.2);
        border-left: 3px solid #0096ff;
      }
      
      .server-item:last-child {
        border-bottom: none;
      }
      
      .server-name {
        color: #ffffff;
        font-weight: 500;
      }
      
      .server-ping {
        text-align: center;
        font-family: 'Courier New', monospace;
      }
      
      .ping-good {
        color: #4CAF50;
      }
      
      .ping-ok {
        color: #FFC107;
      }
      
      .ping-high {
        color: #FF9800;
      }
      
      .ping-very-high {
        color: #F44336;
      }
      
      .server-players {
        text-align: center;
        color: rgba(255, 255, 255, 0.8);
        font-family: 'Courier New', monospace;
      }
      
      .server-status {
        text-align: center;
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
      }
      
      .status-online {
        color: #4CAF50;
      }
      
      .status-offline {
        color: #F44336;
      }
      
      .status-maintenance {
        color: #FF9800;
      }
      
      .inventory-slot {
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 15px;
        text-align: center;
        transition: all 0.2s;
        cursor: pointer;
      }
      
      .inventory-slot:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      .inventory-slot.active {
        border-color: #4a90e2;
        background: rgba(74, 144, 226, 0.1);
      }
      
      .inventory-slot.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .inventory-slot.disabled:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
      }
      
      .item-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }
      
      .item-name {
        color: #fff;
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 4px;
      }
      
      .item-ammo {
        color: #ccc;
        font-size: 12px;
      }
      
      .inventory-slot.active .item-name {
        color: #4a90e2;
      }
    `
    document.head.appendChild(style)
  }

  private setupEventListeners(): void {
    // Tab switching
    const tabBtns = this.settingsElement.querySelectorAll('.tab-btn') as NodeListOf<HTMLButtonElement>
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab')
        this.switchTab(targetTab)
      })
    })
    
    // Close button
    const closeBtn = this.settingsElement.querySelector('#close-settings') as HTMLButtonElement
    closeBtn?.addEventListener('click', () => {
      // Only hide if we have a callback to check game state
      if (this.onShouldClose) {
        if (this.onShouldClose()) {
          this.hide()
        }
      } else {
        this.hide()
      }
    })
    
    // Prevent clicking outside to close - entire screen is menu area
    const overlay = this.settingsElement.querySelector('.settings-overlay') as HTMLElement
    overlay?.addEventListener('click', (e) => {
      // Don't close when clicking outside - user must use M key or close button
      e.preventDefault()
      e.stopPropagation()
    })
    
    // Prevent panel clicks from bubbling to overlay
    const panel = this.settingsElement.querySelector('.settings-panel') as HTMLElement
    panel?.addEventListener('click', (e) => {
      e.stopPropagation()
    })
    
    // Sensitivity slider
    const sensitivitySlider = this.settingsElement.querySelector('#sensitivity-slider') as HTMLInputElement
    const sensitivityValue = this.settingsElement.querySelector('#sensitivity-value') as HTMLSpanElement
    sensitivitySlider?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value)
      this.settings.mouseSensitivity = value
      sensitivityValue.textContent = value.toFixed(1)
      this.onSensitivityChange?.(value)
    })
    
    // FOV slider
    const fovSlider = this.settingsElement.querySelector('#fov-slider') as HTMLInputElement
    const fovValue = this.settingsElement.querySelector('#fov-value') as HTMLSpanElement
    fovSlider?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      this.settings.fieldOfView = value
      fovValue.textContent = `${value}°`
      this.onFOVChange?.(value)
    })
    
    // Reset button
    const resetBtn = this.settingsElement.querySelector('#reset-settings') as HTMLButtonElement
    resetBtn?.addEventListener('click', () => this.resetToDefaults())
    
    // Apply button
    const applyBtn = this.settingsElement.querySelector('#apply-settings') as HTMLButtonElement
    applyBtn?.addEventListener('click', () => {
      this.saveSettings()
      // Only hide if we have a callback to check game state
      if (this.onShouldClose) {
        if (this.onShouldClose()) {
          this.hide()
        }
      } else {
        this.hide()
      }
    })
    
    // Viewmodel toggle
    const viewmodelToggle = this.settingsElement.querySelector('#viewmodel-toggle') as HTMLInputElement
    viewmodelToggle?.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked
      this.settings.viewmodelEnabled = enabled
      this.onViewmodelChange?.(enabled)
    })
    
    // Game action buttons
    const matchmakeBtn = this.settingsElement.querySelector('#matchmake-1v1') as HTMLButtonElement
    matchmakeBtn?.addEventListener('click', () => {
      console.log('⚔️ Matchmake 1v1 requested')
      this.onStartGame?.()
    })

    const soloPracticeBtn = this.settingsElement.querySelector('#solo-practice') as HTMLButtonElement
    soloPracticeBtn?.addEventListener('click', () => {
      console.log('🎯 Solo practice requested')
      this.onStartPractice?.()
    })

    const exitPracticeBtn = this.settingsElement.querySelector('#exit-practice') as HTMLButtonElement
    exitPracticeBtn?.addEventListener('click', () => {
      console.log('🚪 Exit practice requested')
      this.onExitPractice?.()
    })
    
    const resumeBtn = this.settingsElement.querySelector('#resume-game') as HTMLButtonElement
    resumeBtn?.addEventListener('click', () => this.hide())
    
    const restartBtn = this.settingsElement.querySelector('#restart-match') as HTMLButtonElement
    restartBtn?.addEventListener('click', () => {
      console.log('🔄 Restart match requested')
      // TODO: Implement match restart
    })
    
    const quitBtn = this.settingsElement.querySelector('#quit-game') as HTMLButtonElement
    quitBtn?.addEventListener('click', () => {
      if (confirm('Are you sure you want to quit the game?')) {
        window.close()
      }
    })
    
    // Server selection
    const serverItems = this.settingsElement.querySelectorAll('.server-item')
    serverItems.forEach(item => {
      item.addEventListener('click', () => {
        // Remove selection from all servers
        serverItems.forEach(s => s.classList.remove('server-selected'))
        
        // Add selection to clicked server
        item.classList.add('server-selected')
        
        const serverName = item.querySelector('.server-name')?.textContent || 'Unknown'
        console.log('🌐 Selected server:', serverName)
        
        // Update the selected server display
        this.updateSelectedServer(item)
      })
    })
    
    // Clear debug button
    const clearDebugBtn = this.settingsElement.querySelector('#clear-debug') as HTMLButtonElement
    clearDebugBtn?.addEventListener('click', () => {
      this.clearDebugLog()
    })
    
    // ESC key handling is now managed by the game engine
  }

  private switchTab(tabName: string | null): void {
    if (!tabName) return
    
    // Update tab buttons
    const tabBtns = this.settingsElement.querySelectorAll('.tab-btn')
    tabBtns.forEach(btn => {
      btn.classList.remove('active')
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active')
      }
    })
    
    // Update tab content
    const tabContents = this.settingsElement.querySelectorAll('.tab-content')
    tabContents.forEach(content => {
      content.classList.remove('active')
      if (content.getAttribute('data-tab') === tabName) {
        content.classList.add('active')
      }
    })
  }

  private resetToDefaults(): void {
    this.settings = {
      mouseSensitivity: 1.0,
      fieldOfView: 75,
      viewmodelEnabled: true
    }
    
    // Update UI
    const sensitivitySlider = this.settingsElement.querySelector('#sensitivity-slider') as HTMLInputElement
    const sensitivityValue = this.settingsElement.querySelector('#sensitivity-value') as HTMLSpanElement
    const fovSlider = this.settingsElement.querySelector('#fov-slider') as HTMLInputElement
    const fovValue = this.settingsElement.querySelector('#fov-value') as HTMLSpanElement
    
    if (sensitivitySlider && sensitivityValue) {
      sensitivitySlider.value = this.settings.mouseSensitivity.toString()
      sensitivityValue.textContent = this.settings.mouseSensitivity.toFixed(1)
    }
    
    if (fovSlider && fovValue) {
      fovSlider.value = this.settings.fieldOfView.toString()
      fovValue.textContent = `${this.settings.fieldOfView}°`
    }
    
    const viewmodelToggle = this.settingsElement.querySelector('#viewmodel-toggle') as HTMLInputElement
    if (viewmodelToggle) {
      viewmodelToggle.checked = this.settings.viewmodelEnabled
    }
    
    // Apply changes
    this.onSensitivityChange?.(this.settings.mouseSensitivity)
    this.onFOVChange?.(this.settings.fieldOfView)
    this.onViewmodelChange?.(this.settings.viewmodelEnabled)
    
    console.log('🔄 Settings reset to defaults')
  }

  // Public methods
  show(): void {
    console.log('🔧 Settings menu showing')
    this.settingsElement.style.display = 'block'
    this.isVisible = true
    
    // Always show Game tab when opening menu
    this.switchTab('game')
    
    // Request fresh server info when menu is shown
    if (this.onRequestServerInfo) {
      this.onRequestServerInfo()
    }
    
    // Release pointer lock when showing menu
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
  }

  hide(): void {
    console.log('🔧 Settings menu hiding')
    this.settingsElement.style.display = 'none'
    this.isVisible = false
    
    // Automatically re-acquire pointer lock when menu is closed
    setTimeout(() => {
      const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
      if (canvas) {
        canvas.requestPointerLock()
        console.log('🔒 Auto-requesting pointer lock after menu close')
      }
    }, 100) // Small delay to ensure menu is fully hidden
  }

  toggle(): void {
    console.log(`🔧 Settings menu toggle called - currently visible: ${this.isVisible}`)
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  getSettings(): GameSettings {
    return { ...this.settings }
  }

  get visible(): boolean {
    return this.isVisible
  }

  // Callback setters
  onSensitivityChanged(callback: (sensitivity: number) => void): void {
    this.onSensitivityChange = callback
  }

  onFOVChanged(callback: (fov: number) => void): void {
    this.onFOVChange = callback
  }

  onViewmodelChanged(callback: (enabled: boolean) => void): void {
    this.onViewmodelChange = callback
  }

  onStartGameRequested(callback: () => void): void {
    this.onStartGame = callback
  }

  onStartPracticeRequested(callback: () => void): void {
    this.onStartPractice = callback
  }

  onExitPracticeRequested(callback: () => void): void {
    this.onExitPractice = callback
  }

  onShouldCloseCheck(callback: () => boolean): void {
    this.onShouldClose = callback
  }

  onServerInfoRequested(callback: () => void): void {
    this.onRequestServerInfo = callback
  }

  updateServerList(serverData: any): void {
    console.log('📊 Updating server list with real data:', serverData)
    
    // Update the Railway Main Server entry
    const railwayServer = this.settingsElement.querySelector('[data-server="railway-main"]') as HTMLElement
    if (railwayServer) {
      // Update player count
      const playerCountElement = railwayServer.querySelector('.server-players')
      if (playerCountElement) {
        playerCountElement.textContent = `${serverData.playerCount}/${serverData.maxPlayers}`
      }
      
      // Update ping
      const pingElement = railwayServer.querySelector('.server-ping')
      if (pingElement) {
        pingElement.textContent = `${serverData.ping}ms`
        
        // Add ping color classes
        pingElement.className = 'server-ping'
        if (serverData.ping <= 30) {
          pingElement.classList.add('ping-excellent')
        } else if (serverData.ping <= 60) {
          pingElement.classList.add('ping-good')
        } else if (serverData.ping <= 100) {
          pingElement.classList.add('ping-ok')
        } else {
          pingElement.classList.add('ping-high')
        }
      }
      
      // Update status indicator
      const statusElement = railwayServer.querySelector('.server-status')
      if (statusElement) {
        statusElement.textContent = serverData.status === 'online' ? '🟢' : '🔴'
      }
      
      // Update match info since Railway server is always selected
      this.updateMatchInfo(serverData)
    }
  }

  private updateMatchInfo(serverData: any): void {
    const matchInfoItems = [
      { id: 'players-online', value: `${serverData.playerCount}` },
      { id: 'players-in-queue', value: `${serverData.playersInQueue}` },
      { id: 'active-matches', value: `${serverData.activeMatches}` },
      { id: 'server-region', value: serverData.region }
    ]
    
    matchInfoItems.forEach(item => {
      const element = document.getElementById(item.id)
      if (element) {
        element.textContent = item.value
      }
    })
  }

  updateGameState(gameStarted: boolean, gameMode?: 'multiplayer' | 'practice'): void {
    const matchmakeBtn = this.settingsElement.querySelector('#matchmake-1v1') as HTMLButtonElement
    const practiceBtn = this.settingsElement.querySelector('#solo-practice') as HTMLButtonElement
    const exitPracticeBtn = this.settingsElement.querySelector('#exit-practice') as HTMLButtonElement
    const resumeBtn = this.settingsElement.querySelector('#resume-game') as HTMLButtonElement
    const serverSection = this.settingsElement.querySelector('#server-section') as HTMLElement
    
    if (gameStarted && gameMode === 'practice') {
      // Practice mode - show exit practice button, hide others
      if (matchmakeBtn) matchmakeBtn.style.display = 'none'
      if (practiceBtn) practiceBtn.style.display = 'none'
      if (exitPracticeBtn) exitPracticeBtn.style.display = 'inline-block'
      if (resumeBtn) resumeBtn.style.display = 'inline-block'
      if (serverSection) serverSection.style.display = 'none'
    } else if (gameStarted) {
      // Multiplayer mode - show resume button, hide others
      if (matchmakeBtn) matchmakeBtn.style.display = 'none'
      if (practiceBtn) practiceBtn.style.display = 'none'
      if (exitPracticeBtn) exitPracticeBtn.style.display = 'none'
      if (resumeBtn) resumeBtn.style.display = 'inline-block'
      if (serverSection) serverSection.style.display = 'block'
    } else {
      // Main menu - show main buttons, hide game buttons
      if (matchmakeBtn) matchmakeBtn.style.display = 'inline-block'
      if (practiceBtn) practiceBtn.style.display = 'inline-block'
      if (exitPracticeBtn) exitPracticeBtn.style.display = 'none'
      if (resumeBtn) resumeBtn.style.display = 'none'
      if (serverSection) serverSection.style.display = 'block'
    }
  }

  private updateSelectedServer(selectedItem: Element): void {
    const serverName = selectedItem.querySelector('.server-name')?.textContent || 'Unknown'
    const ping = selectedItem.querySelector('.server-ping')?.textContent || '??ms'
    
    // Update match info to show selected server
    const matchInfo = this.settingsElement.querySelector('.info-grid')
    if (matchInfo) {
      // Find or create server info item
      let serverInfoItem = matchInfo.querySelector('.server-info-item')
      if (!serverInfoItem) {
        serverInfoItem = document.createElement('div')
        serverInfoItem.className = 'info-item server-info-item'
        matchInfo.appendChild(serverInfoItem)
      }
      
      serverInfoItem.innerHTML = `
        <span class="info-label">Selected Server</span>
        <span class="info-value">${serverName} (${ping})</span>
      `
    }
  }

  // Initialize settings on first load
  applyInitialSettings(): void {
    this.onSensitivityChange?.(this.settings.mouseSensitivity)
    this.onFOVChange?.(this.settings.fieldOfView)
    this.onViewmodelChange?.(this.settings.viewmodelEnabled)
  }

  // Debug logging methods
  private setupDebugLogging(): void {
    this.debugLogElement = this.settingsElement.querySelector('#debug-log') as HTMLElement
    
    // Intercept console.log calls and display them in the debug log
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error
    
    console.log = (...args) => {
      originalLog.apply(console, args)
      this.addDebugMessage(args.join(' '), 'info')
    }
    
    console.warn = (...args) => {
      originalWarn.apply(console, args)
      this.addDebugMessage(args.join(' '), 'warning')
    }
    
    console.error = (...args) => {
      originalError.apply(console, args)
      this.addDebugMessage(args.join(' '), 'error')
    }
  }
  
  private addDebugMessage(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info'): void {
    if (!this.debugLogElement) return
    
    // Remove placeholder if it exists
    const placeholder = this.debugLogElement.querySelector('.debug-placeholder')
    if (placeholder) {
      placeholder.remove()
    }
    
    // Create message element
    const messageElement = document.createElement('div')
    messageElement.className = `debug-message ${type}`
    messageElement.textContent = `${new Date().toLocaleTimeString()}: ${message}`
    
    // Add to log
    this.debugLogElement.appendChild(messageElement)
    
    // Keep only last 50 messages
    const messages = this.debugLogElement.querySelectorAll('.debug-message')
    if (messages.length > 50) {
      messages[0].remove()
    }
    
    // Auto-scroll to bottom
    this.debugLogElement.scrollTop = this.debugLogElement.scrollHeight
  }
  
  private clearDebugLog(): void {
    if (!this.debugLogElement) return
    
    this.debugLogElement.innerHTML = '<div class="debug-placeholder">Debug messages will appear here...</div>'
  }

  dispose(): void {
    document.body.removeChild(this.settingsElement)
    console.log('🧹 Settings menu disposed')
  }
}
