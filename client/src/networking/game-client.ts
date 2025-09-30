import { Player, ClientMessage, ServerMessage, Vector3 } from '../types/shared'

export class GameClient {
  private ws: WebSocket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private playerId: number | null = null
  
  // Callbacks for game events
  private onPlayerJoined?: (playerId: number) => void
  private onPlayerLeft?: (playerId: number) => void
  private onPlayerPositionUpdate?: (playerId: number, position: Vector3, rotation: Vector3) => void
  private onPlayerShot?: (playerId: number) => void
  private onConnectionStatusChange?: (connected: boolean) => void
  private onMatchFound?: (matchData: any) => void
  private onRoundStart?: (roundData: any) => void
  private onRoundEnd?: (roundData: any) => void
  private onMatchEnd?: (matchData: any) => void
  private onPlayerHit?: (hitData: any) => void
  private onPlayerDeath?: (deathData: any) => void
  private onServerInfo?: (serverData: any) => void

  constructor() {
    console.log('🌐 GameClient initialized')
  }

  // Connect to game server
  async connect(serverUrl: string = 'ws://localhost:8080/game'): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Connecting to server:', serverUrl)
        this.ws = new WebSocket(serverUrl)
        
        this.ws.onopen = () => {
          console.log('✅ Connected to game server')
          this.isConnected = true
          this.reconnectAttempts = 0
          this.onConnectionStatusChange?.(true)
          resolve(true)
        }
        
        this.ws.onmessage = (event) => {
          try {
            const message: ServerMessage = JSON.parse(event.data)
            this.handleServerMessage(message)
          } catch (error) {
            console.error('❌ Failed to parse server message:', error)
          }
        }
        
        this.ws.onclose = (event) => {
          console.log('🔌 Disconnected from server:', event.reason)
          this.isConnected = false
          this.onConnectionStatusChange?.(false)
          
          // Auto-reconnect if not intentional disconnect
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect(serverUrl)
          }
        }
        
        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          this.isConnected = false
          this.onConnectionStatusChange?.(false)
          reject(error)
        }
        
        // Connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'))
          }
        }, 5000)
        
      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error)
        reject(error)
      }
    })
  }

  private attemptReconnect(serverUrl: string): void {
    this.reconnectAttempts++
    console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
    
    setTimeout(() => {
      this.connect(serverUrl).catch(() => {
        console.log('❌ Reconnection failed')
      })
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  private handleServerMessage(message: ServerMessage): void {
    console.log('📨 Server message:', message.type)
    
    switch (message.type) {
      case 'welcome':
        this.playerId = message.playerId
        console.log('🎮 Assigned player ID:', this.playerId)
        break
        
      case 'player_joined':
        console.log('👤 Player joined match:', message.playerId, 'Position:', message.position, 'Health:', message.health)
        console.log('👤 Player joined callback exists:', !!this.onPlayerJoined)
        console.log('👤 NetworkedPlayerManager exists:', !!this.onPlayerJoined)
        this.onPlayerJoined?.(message.playerId)
        break
        
      case 'player_left':
        console.log('👋 Player left:', message.playerId)
        this.onPlayerLeft?.(message.playerId)
        break
        
      case 'player_position_update':
        this.onPlayerPositionUpdate?.(message.playerId, message.position!, message.rotation!)
        break
        
      case 'player_shot':
        console.log('💥 Player fired:', message.playerId)
        this.onPlayerShot?.(message.playerId)
        break
        
      case 'match_found':
        console.log('⚔️ Match found!')
        this.onMatchFound?.(message)
        break
        
      case 'round_start':
        console.log(`🎯 Round ${message.round} started!`, message)
        console.log('🎯 Round start callback exists:', !!this.onRoundStart)
        this.onRoundStart?.(message)
        break
        
      case 'round_end':
        console.log(`🏁 Round ${message.round} ended - Winner: ${message.winner}`)
        this.onRoundEnd?.(message)
        break
        
      case 'match_end':
        console.log(`🏆 Match ended - Winner: ${message.winner}`)
        this.onMatchEnd?.(message)
        break
        
      case 'player_hit':
        console.log(`💥 Player ${message.targetId} hit for ${message.damage} damage${message.isHeadshot ? ' (HEADSHOT!)' : ''}`)
        this.onPlayerHit?.(message)
        break
        
      case 'player_death':
        console.log(`💀 Player ${message.victimId} eliminated by Player ${message.killerId}${message.isHeadshot ? ' (HEADSHOT!)' : ''}`)
        this.onPlayerDeath?.(message)
        break
        
      case 'server_info':
        console.log(`📊 Server info received: ${message.playerCount} players online`)
        this.onServerInfo?.(message)
        break
        
      case 'pong':
        // Handle ping response for latency measurement
        if (message.timestamp) {
          const latency = Date.now() - message.timestamp
          console.log(`📡 Server latency: ${latency}ms`)
        }
        break
        
      default:
        console.log('❓ Unknown server message type:', message.type)
    }
  }

  // Send messages to server
  private sendMessage(message: ClientMessage): void {
    if (!this.isConnected || !this.ws) {
      console.warn('⚠️ Cannot send message - not connected to server')
      return
    }
    
    try {
      this.ws.send(JSON.stringify(message))
    } catch (error) {
      console.error('❌ Failed to send message to server:', error)
    }
  }

  // Game actions
  sendPlayerPosition(position: Vector3, rotation: Vector3): void {
    this.sendMessage({
      type: 'player_position',
      position: position,
      rotation: rotation
    })
  }

  sendPlayerShot(direction: Vector3, position?: Vector3): void {
    this.sendMessage({
      type: 'player_shoot',
      direction: direction,
      position: position,
      timestamp: Date.now()
    })
  }

  requestMatchmaking(gameMode: '1v1' | '2v2' | '5v5' = '1v1'): void {
    console.log('🔍 Requesting matchmaking...')
    this.sendMessage({
      type: 'request_matchmaking',
      gameMode: gameMode
    })
  }

  requestServerInfo(): void {
    console.log('📊 Requesting server info...')
    this.sendMessage({
      type: 'request_server_info'
    })
  }

  sendPing(): void {
    this.sendMessage({
      type: 'ping',
      timestamp: Date.now()
    })
  }

  // Event listeners
  onPlayerJoinedCallback(callback: (playerId: number) => void): void {
    this.onPlayerJoined = callback
  }

  onPlayerLeftCallback(callback: (playerId: number) => void): void {
    this.onPlayerLeft = callback
  }

  onPlayerPositionUpdateCallback(callback: (playerId: number, position: Vector3, rotation: Vector3) => void): void {
    this.onPlayerPositionUpdate = callback
  }

  onPlayerShotCallback(callback: (playerId: number) => void): void {
    this.onPlayerShot = callback
  }

  onConnectionStatusChangeCallback(callback: (connected: boolean) => void): void {
    this.onConnectionStatusChange = callback
  }

  onMatchFoundCallback(callback: (matchData: any) => void): void {
    this.onMatchFound = callback
  }

  onRoundStartCallback(callback: (roundData: any) => void): void {
    this.onRoundStart = callback
  }

  onRoundEndCallback(callback: (roundData: any) => void): void {
    this.onRoundEnd = callback
  }

  onMatchEndCallback(callback: (matchData: any) => void): void {
    this.onMatchEnd = callback
  }

  onPlayerHitCallback(callback: (hitData: any) => void): void {
    this.onPlayerHit = callback
  }

  onPlayerDeathCallback(callback: (deathData: any) => void): void {
    this.onPlayerDeath = callback
  }

  onServerInfoCallback(callback: (serverData: any) => void): void {
    this.onServerInfo = callback
  }

  // Getters
  get connected(): boolean {
    return this.isConnected
  }

  get playerID(): number | null {
    return this.playerId
  }

  // Cleanup
  disconnect(): void {
    if (this.ws) {
      console.log('🔌 Disconnecting from server...')
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
      this.isConnected = false
      this.playerId = null
    }
  }

  dispose(): void {
    this.disconnect()
  }
}
