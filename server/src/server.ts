import { WebSocketServer } from 'ws'
import { createServer } from 'http'

const PORT = process.env.PORT || 8080

console.log('🚀 Starting Tactical Arena Shooter Server...')

// Create HTTP server
const server = createServer()

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/game'
})

// Track connected players
const connectedPlayers = new Map()
let playerIdCounter = 0

// Matchmaking queue
const matchmakingQueue: Array<{playerId: number, gameMode: string, queueTime: number}> = []
let matchIdCounter = 0

wss.on('connection', (ws, request) => {
  const playerId = ++playerIdCounter
  const playerInfo = {
    id: playerId,
    ws,
    position: { x: 0, y: 5, z: 10 },
    health: 100,
    isAlive: true,
    connectedAt: new Date()
  }
  
  connectedPlayers.set(playerId, playerInfo)
  
  console.log(`👤 Player ${playerId} connected from ${request.socket.remoteAddress}`)
  console.log(`📊 Total players: ${connectedPlayers.size}`)
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    playerId: playerId,
    message: 'Connected to Tactical Arena Shooter server'
  }))
  
  // Broadcast player join to others
  broadcast({
    type: 'player_joined',
    playerId: playerId
  }, playerId)

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      handlePlayerMessage(playerId, message)
    } catch (error) {
      console.error(`❌ Invalid message from player ${playerId}:`, error)
    }
  })

  // Handle disconnection
  ws.on('close', () => {
    console.log(`👋 Player ${playerId} disconnected`)
    
    // Remove player from tracking
    connectedPlayers.delete(playerId)
    
    // Remove from matchmaking queue if present
    const queueIndex = matchmakingQueue.findIndex(item => item.playerId === playerId)
    if (queueIndex !== -1) {
      matchmakingQueue.splice(queueIndex, 1)
      console.log(`🗑️ Removed player ${playerId} from matchmaking queue`)
    }
    
    // Broadcast player leave to others
    broadcast({
      type: 'player_left',
      playerId: playerId
    }, playerId)
    
    console.log(`📊 Total players: ${connectedPlayers.size}`)
  })

  // Handle connection errors
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for player ${playerId}:`, error)
  })
})

function handlePlayerMessage(playerId: number, message: any) {
  const player = connectedPlayers.get(playerId)
  if (!player) return

  switch (message.type) {
    case 'ping':
      // Respond to ping for latency measurement
      player.ws.send(JSON.stringify({
        type: 'pong',
        timestamp: message.timestamp
      }))
      break
      
    case 'player_position':
      // Update player position and broadcast to others
      if (message.position) {
        player.position = message.position
        broadcast({
          type: 'player_position_update',
          playerId: playerId,
          position: message.position
        }, playerId)
      }
      break
      
    case 'player_shoot':
      // Handle shooting event
      console.log(`💥 Player ${playerId} fired weapon`)
      broadcast({
        type: 'player_shot',
        playerId: playerId,
        timestamp: Date.now()
      }, playerId)
      break
      
    case 'request_matchmaking':
      // Handle matchmaking request
      console.log(`🔍 Player ${playerId} requested matchmaking for ${message.gameMode}`)
      handleMatchmakingRequest(playerId, message.gameMode || '1v1')
      break
      
    default:
      console.log(`❓ Unknown message type from player ${playerId}:`, message.type)
  }
}

function handleMatchmakingRequest(playerId: number, gameMode: string) {
  const player = connectedPlayers.get(playerId)
  if (!player) return

  // Check if player is already in queue
  const existingIndex = matchmakingQueue.findIndex(item => item.playerId === playerId)
  if (existingIndex !== -1) {
    console.log(`⚠️ Player ${playerId} already in matchmaking queue`)
    return
  }

  // Add player to queue
  matchmakingQueue.push({
    playerId: playerId,
    gameMode: gameMode,
    queueTime: Date.now()
  })

  console.log(`➕ Player ${playerId} added to ${gameMode} queue (${matchmakingQueue.length} players waiting)`)

  // Try to find matches
  findMatches()
}

function findMatches() {
  // Simple 1v1 matchmaking
  const queue1v1 = matchmakingQueue.filter(item => item.gameMode === '1v1')
  
  while (queue1v1.length >= 2) {
    const player1 = queue1v1.shift()!
    const player2 = queue1v1.shift()!
    
    // Remove from main queue
    const index1 = matchmakingQueue.findIndex(item => item.playerId === player1.playerId)
    const index2 = matchmakingQueue.findIndex(item => item.playerId === player2.playerId)
    if (index1 !== -1) matchmakingQueue.splice(index1, 1)
    if (index2 !== -1) matchmakingQueue.splice(Math.max(0, index2 - 1), 1) // Adjust for removed element
    
    // Create match
    const matchId = `match_${++matchIdCounter}_${Date.now()}`
    console.log(`⚔️ Match found! ${matchId}: Player ${player1.playerId} vs Player ${player2.playerId}`)
    
    // Notify both players
    const matchMessage = {
      type: 'match_found',
      matchId: matchId,
      players: [player1.playerId, player2.playerId],
      gameMode: '1v1'
    }
    
    const player1Ws = connectedPlayers.get(player1.playerId)?.ws
    const player2Ws = connectedPlayers.get(player2.playerId)?.ws
    
    if (player1Ws) {
      player1Ws.send(JSON.stringify(matchMessage))
    }
    if (player2Ws) {
      player2Ws.send(JSON.stringify(matchMessage))
    }
  }
}

function broadcast(message: any, excludePlayerId?: number) {
  const messageString = JSON.stringify(message)
  
  connectedPlayers.forEach((player, playerId) => {
    if (excludePlayerId && playerId === excludePlayerId) return
    
    try {
      player.ws.send(messageString)
    } catch (error) {
      console.error(`❌ Failed to send message to player ${playerId}:`, error)
    }
  })
}

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
  console.log(`🌐 WebSocket endpoint: ws://localhost:${PORT}/game`)
  console.log(`📡 Ready for player connections...`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...')
  
  // Close all WebSocket connections
  connectedPlayers.forEach((player) => {
    player.ws.close(1000, 'Server shutting down')
  })
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ Server shutdown complete')
    process.exit(0)
  })
})

// Error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

