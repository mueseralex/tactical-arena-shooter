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

// Active matches - Map<matchId, matchData>
const activeMatches = new Map()

// Match cleanup interval (clean up finished matches every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [matchId, match] of activeMatches.entries()) {
    // Remove matches that have been finished for more than 5 minutes
    if (match.finishedAt && (now - match.finishedAt) > 300000) {
      console.log(`🧹 Cleaning up finished match: ${matchId}`)
      activeMatches.delete(matchId)
    }
  }
}, 300000) // Run every 5 minutes

// Position synchronization interval (like Python script's broadcast loop)
// Removed periodic sync - using Python script style message-based sync only

// Spawn points for 1v1 (behind brown forward cover boxes - across from each other)
const SPAWN_POINTS = {
  player1: { x: -6, y: 0, z: 10 }, // Left side - behind left brown box (at -4, z=8)
  player2: { x: 6, y: 0, z: -10 }   // Right side - behind right brown box (at 4, z=-8)
}

wss.on('connection', (ws, request) => {
  const playerId = ++playerIdCounter
  const playerInfo = {
    id: playerId,
    ws,
    position: { x: 0, y: 0, z: 0 },
    health: 100,
    maxHealth: 100,
    isAlive: true,
    matchId: null,
    team: null,
    kills: 0,
    deaths: 0,
    connectedAt: new Date(),
    lastActivity: Date.now()
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
  
  // Don't broadcast player_joined here - only when they join a match

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
  
  // Update player activity
  player.lastActivity = Date.now()

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
        player.rotation = message.rotation || { x: 0, y: 0, z: 0 }
        player.lastActivity = Date.now()
        
        // Broadcast to all other players in match
        if (player.matchId) {
          const match = activeMatches.get(player.matchId)
          if (match) {
            match.players.forEach((otherPlayerId: number) => {
              if (otherPlayerId !== playerId) {
                const otherPlayer = connectedPlayers.get(otherPlayerId)
                if (otherPlayer && otherPlayer.ws.readyState === otherPlayer.ws.OPEN) {
                  otherPlayer.ws.send(JSON.stringify({
                    type: 'player_position_update',
                    playerId: playerId,
                    position: player.position,
                    rotation: player.rotation
                  }))
                }
              }
            })
          }
        }
      }
      break
      
    case 'player_shoot':
      // Handle shooting event with hit detection
      console.log(`💥 Player ${playerId} fired weapon`)
      handlePlayerShoot(playerId, message)
      break
      
    case 'request_matchmaking':
      // Handle matchmaking request
      console.log(`🔍 Player ${playerId} requested matchmaking for ${message.gameMode}`)
      handleMatchmakingRequest(playerId, message.gameMode || '1v1')
      break
      
    case 'request_server_info':
      // Handle server info request
      handleServerInfoRequest(playerId)
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
    
    // Create match data
    const matchData = {
      id: matchId,
      players: [player1.playerId, player2.playerId],
      gameMode: '1v1',
      currentRound: 1,
      maxRounds: 5, // First to 3 wins (best of 5)
      roundTimeLimit: 120000, // 2 minutes in milliseconds
      scores: {
        [player1.playerId]: 0,
        [player2.playerId]: 0
      },
      roundStartTime: null,
      roundEndTime: null,
      status: 'starting',
      winner: null
    }
    
    activeMatches.set(matchId, matchData)
    
    // Assign players to match and teams
    const p1 = connectedPlayers.get(player1.playerId)
    const p2 = connectedPlayers.get(player2.playerId)
    
    if (p1 && p2) {
      p1.matchId = matchId
      p1.team = 'team1'
      p2.matchId = matchId
      p2.team = 'team2'
      
      // Start the match
      startMatch(matchId)
    }
  }
}

function startMatch(matchId: string) {
  const match = activeMatches.get(matchId)
  if (!match) return
  
  console.log(`🚀 Starting match ${matchId}`)
  
  // Start first round
  startRound(matchId)
}

function startRound(matchId: string) {
  const match = activeMatches.get(matchId)
  if (!match) return
  
  console.log(`🎯 Starting round ${match.currentRound} for match ${matchId}`)
  console.log(`👥 Players in match: ${match.players.join(', ')}`)
  
  // Reset players for new round
  match.players.forEach((playerId: number, index: number) => {
    const player = connectedPlayers.get(playerId)
    if (!player) return
    
    // Reset health and position
    player.health = player.maxHealth
    player.isAlive = true
    
    // Assign spawn positions (opposite sides)
    const spawnPoint = index === 0 ? SPAWN_POINTS.player1 : SPAWN_POINTS.player2
    player.position = { ...spawnPoint }
    
    console.log(`📍 Set player ${playerId} spawn to:`, spawnPoint)
    
    // Send round start message with spawn position
    player.ws.send(JSON.stringify({
      type: 'round_start',
      matchId: matchId,
      round: match.currentRound,
      spawnPosition: spawnPoint,
      health: player.health,
      timeLimit: match.roundTimeLimit,
      scores: match.scores
    }))
  })
  
  // Send player_joined messages for all players in the match (no delay, send immediately)
  setTimeout(() => {
    match.players.forEach((playerId: number) => {
      const player = connectedPlayers.get(playerId)
      if (!player) return
      
      // Tell this player about all other players
      match.players.forEach((otherPlayerId: number) => {
        if (otherPlayerId !== playerId) {
          const otherPlayer = connectedPlayers.get(otherPlayerId)
          if (otherPlayer) {
            player.ws.send(JSON.stringify({
              type: 'player_joined',
              playerId: otherPlayerId,
              position: otherPlayer.position,
              health: otherPlayer.health
            }))
            console.log(`👥 Told player ${playerId} about player ${otherPlayerId} at position`, otherPlayer.position)
          }
        }
      })
    })
  }, 1000) // 1 second delay to ensure clients are ready
  
  // Set round timer
  match.roundStartTime = Date.now()
  match.roundEndTime = match.roundStartTime + match.roundTimeLimit
  match.status = 'active'
  
  // Start round timer
  setTimeout(() => {
    endRound(matchId, 'timeout')
  }, match.roundTimeLimit)
}

function handlePlayerShoot(shooterId: number, message: any) {
  const shooter = connectedPlayers.get(shooterId)
  if (!shooter || !shooter.matchId || !shooter.isAlive) return
  
  const match = activeMatches.get(shooter.matchId)
  if (!match || match.status !== 'active') return
  
  // Broadcast shot event
  broadcast({
    type: 'player_shot',
    playerId: shooterId,
    timestamp: Date.now()
  }, shooterId)
  
  // Perform hit detection
  const hitResult = performHitDetection(shooterId, message.direction, message.position || shooter.position)
  
  if (hitResult.hit && hitResult.targetId !== undefined) {
    handlePlayerHit(shooterId, hitResult.targetId, hitResult.damage, hitResult.isHeadshot)
  }
}

function performHitDetection(shooterId: number, direction: any, shooterPosition: any) {
  const shooter = connectedPlayers.get(shooterId)
  if (!shooter) return { hit: false, targetId: undefined, damage: 0, isHeadshot: false, distance: 0 }
  
  const match = activeMatches.get(shooter.matchId!)
  if (!match) return { hit: false, targetId: undefined, damage: 0, isHeadshot: false, distance: 0 }
  
  const maxRange = 100 // Maximum weapon range
  let closestHit = null
  let closestDistance = maxRange
  
  // Check all other players in the match
  for (const targetId of match.players) {
    if (targetId === shooterId) continue
    
    const target = connectedPlayers.get(targetId)
    if (!target || !target.isAlive) continue
    
    // Calculate if shot hits the target using improved raycasting
    const hitResult = calculateRaycastHit(shooterPosition, direction, target.position, maxRange)
    
    if (hitResult.hit && hitResult.distance < closestDistance) {
      closestDistance = hitResult.distance
      
      // Determine if headshot based on hit position
      const isHeadshot = hitResult.hitHeight > 1.6 // Head is above 1.6m height
      
      // Calculate damage with proper falloff
      let damage = 35 // Base body damage
      if (isHeadshot) {
        damage = 100 // One-shot headshot kill
      } else {
        // Distance-based damage falloff for body shots
        const damageFalloff = Math.max(0.3, 1 - (hitResult.distance / maxRange))
        damage = Math.floor(damage * damageFalloff)
      }
      
      closestHit = {
        hit: true,
        targetId: targetId,
        damage: damage,
        isHeadshot: isHeadshot,
        distance: hitResult.distance
      }
    }
  }
  
  return closestHit || { hit: false, targetId: undefined, damage: 0, isHeadshot: false, distance: 0 }
}

function calculateRaycastHit(shooterPos: any, direction: any, targetPos: any, maxRange: number) {
  // Calculate vector from shooter to target
  const toTarget = {
    x: targetPos.x - shooterPos.x,
    y: targetPos.y - shooterPos.y,
    z: targetPos.z - shooterPos.z
  }
  
  const targetDistance = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y + toTarget.z * toTarget.z)
  
  // Check if target is within range
  if (targetDistance > maxRange) {
    return { hit: false, distance: targetDistance, hitHeight: 0 }
  }
  
  // Normalize direction and toTarget vectors
  const dirLength = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z)
  const normalizedDir = {
    x: direction.x / dirLength,
    y: direction.y / dirLength,
    z: direction.z / dirLength
  }
  
  const normalizedToTarget = {
    x: toTarget.x / targetDistance,
    y: toTarget.y / targetDistance,
    z: toTarget.z / targetDistance
  }
  
  // Calculate dot product to check if shot is aimed at target
  const dotProduct = normalizedDir.x * normalizedToTarget.x + 
                    normalizedDir.y * normalizedToTarget.y + 
                    normalizedDir.z * normalizedToTarget.z
  
  // Require high accuracy for hits (0.95 = very precise aim)
  const accuracyThreshold = 0.95
  
  if (dotProduct >= accuracyThreshold) {
    // Calculate hit height for headshot detection
    const hitHeight = shooterPos.y + (normalizedDir.y * targetDistance)
    
    return {
      hit: true,
      distance: targetDistance,
      hitHeight: hitHeight
    }
  }
  
  return { hit: false, distance: targetDistance, hitHeight: 0 }
}

function calculateDistance(pos1: any, pos2: any): number {
  const dx = pos1.x - pos2.x
  const dy = pos1.y - pos2.y
  const dz = pos1.z - pos2.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function calculateAimAccuracy(shooterPos: any, targetPos: any, aimDirection: any): number {
  // Calculate vector from shooter to target
  const toTarget = {
    x: targetPos.x - shooterPos.x,
    y: targetPos.y - shooterPos.y,
    z: targetPos.z - shooterPos.z
  }
  
  // Normalize vectors
  const targetLength = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y + toTarget.z * toTarget.z)
  const aimLength = Math.sqrt(aimDirection.x * aimDirection.x + aimDirection.y * aimDirection.y + aimDirection.z * aimDirection.z)
  
  if (targetLength === 0 || aimLength === 0) return 0
  
  const normalizedTarget = {
    x: toTarget.x / targetLength,
    y: toTarget.y / targetLength,
    z: toTarget.z / targetLength
  }
  
  const normalizedAim = {
    x: aimDirection.x / aimLength,
    y: aimDirection.y / aimLength,
    z: aimDirection.z / aimLength
  }
  
  // Calculate dot product (cosine of angle between vectors)
  const dotProduct = normalizedTarget.x * normalizedAim.x + 
                    normalizedTarget.y * normalizedAim.y + 
                    normalizedTarget.z * normalizedAim.z
  
  // Convert to 0-1 range (1 = perfect aim, 0 = opposite direction)
  return Math.max(0, dotProduct)
}

function handlePlayerHit(shooterId: number, targetId: number, damage: number, isHeadshot: boolean) {
  const shooter = connectedPlayers.get(shooterId)
  const target = connectedPlayers.get(targetId)
  
  if (!shooter || !target || !target.isAlive) return
  
  // Apply damage
  target.health = Math.max(0, target.health - damage)
  
  console.log(`💥 Player ${shooterId} hit Player ${targetId} for ${damage} damage${isHeadshot ? ' (HEADSHOT!)' : ''} - Health: ${target.health}`)
  
  // Broadcast hit event
  broadcast({
    type: 'player_hit',
    shooterId: shooterId,
    targetId: targetId,
    damage: damage,
    isHeadshot: isHeadshot,
    newHealth: target.health
  })
  
  // Check if player died
  if (target.health <= 0) {
    handlePlayerDeath(shooterId, targetId)
  }
}

function handlePlayerDeath(killerId: number, victimId: number) {
  const killer = connectedPlayers.get(killerId)
  const victim = connectedPlayers.get(victimId)
  
  if (!killer || !victim) return
  
  // Update player stats
  victim.isAlive = false
  victim.deaths++
  killer.kills++
  
  console.log(`💀 Player ${victimId} eliminated by Player ${killerId}`)
  
  // Broadcast death event
  broadcast({
    type: 'player_death',
    killerId: killerId,
    victimId: victimId,
    isHeadshot: victim.health <= -65 // Headshot if overkill damage
  })
  
  // Check if round should end
  if (victim.matchId) {
    checkRoundEnd(victim.matchId, 'elimination')
  }
}

function endRound(matchId: string, reason: 'elimination' | 'timeout') {
  const match = activeMatches.get(matchId)
  if (!match || match.status !== 'active') return
  
  match.status = 'round_ended'
  
  console.log(`🏁 Round ${match.currentRound} ended (${reason}) for match ${matchId}`)
  
  // Determine round winner
  let roundWinner = null
  
  if (reason === 'elimination') {
    // Winner is the alive player
    for (const playerId of match.players) {
      const player = connectedPlayers.get(playerId)
      if (player && player.isAlive) {
        roundWinner = playerId
        break
      }
    }
  } else if (reason === 'timeout') {
    // Winner is player with most health
    let highestHealth = -1
    for (const playerId of match.players) {
      const player = connectedPlayers.get(playerId)
      if (player && player.health > highestHealth) {
        highestHealth = player.health
        roundWinner = playerId
      }
    }
    
    // Check for tie
    const playersWithHighestHealth = match.players.filter((id: number) => {
      const player = connectedPlayers.get(id)
      return player && player.health === highestHealth
    })
    
    if (playersWithHighestHealth.length > 1) {
      roundWinner = null // Tie
    }
  }
  
  // Update scores
  if (roundWinner) {
    match.scores[roundWinner]++
  }
  
  // Broadcast round end
  broadcast({
    type: 'round_end',
    matchId: matchId,
    round: match.currentRound,
    winner: roundWinner,
    reason: reason,
    scores: match.scores
  })
  
  // Check if match is over
  const maxScore = Math.max(...Object.values(match.scores).map(score => Number(score)))
  const requiredWins = Math.ceil(match.maxRounds / 2) // First to 3 in best of 5
  
  if (maxScore >= requiredWins) {
    endMatch(matchId)
  } else {
    // Start next round after delay
    match.currentRound++
    setTimeout(() => {
      startRound(matchId)
    }, 5000) // 5 second delay between rounds
  }
}

function checkRoundEnd(matchId: string, reason: 'elimination' | 'timeout') {
  const match = activeMatches.get(matchId)
  if (!match || match.status !== 'active') return
  
  // Count alive players
  const alivePlayers = match.players.filter((id: number) => {
    const player = connectedPlayers.get(id)
    return player && player.isAlive
  })
  
  // End round if only one or no players alive
  if (alivePlayers.length <= 1) {
    endRound(matchId, reason)
  }
}

function endMatch(matchId: string) {
  const match = activeMatches.get(matchId)
  if (!match) return
  
  // Determine match winner
  let matchWinner = null
  let highestScore = -1
  
  for (const [playerId, score] of Object.entries(match.scores)) {
    const numericScore = Number(score)
    if (numericScore > highestScore) {
      highestScore = numericScore
      matchWinner = parseInt(playerId)
    }
  }
  
  match.winner = matchWinner
  match.status = 'completed'
  match.finishedAt = Date.now() // Mark for cleanup
  
  console.log(`🏆 Match ${matchId} completed! Winner: Player ${matchWinner} (${highestScore} rounds)`)
  
  // Broadcast match end with error handling
  try {
    broadcast({
      type: 'match_end',
      matchId: matchId,
      winner: matchWinner,
      finalScores: match.scores,
      totalRounds: match.currentRound
    })
  } catch (error) {
    console.error(`❌ Failed to broadcast match end for ${matchId}:`, error)
  }
  
  // Clean up match and reset players
  match.players.forEach((playerId: number) => {
    const player = connectedPlayers.get(playerId)
    if (player) {
      player.matchId = null
      player.team = null
      player.health = player.maxHealth
      player.isAlive = true
    }
  })
  
  // Remove match from active matches
  activeMatches.delete(matchId)
}

function handleServerInfoRequest(playerId: number) {
  const player = connectedPlayers.get(playerId)
  if (!player) return
  
  // Calculate server statistics
  const totalPlayers = connectedPlayers.size
  const playersInQueue = matchmakingQueue.length
  const activeMatchCount = activeMatches.size
  const playersInMatches = activeMatchCount * 2 // Assuming 1v1 matches
  
  // Send server info
  player.ws.send(JSON.stringify({
    type: 'server_info',
    serverName: 'Railway Main Server',
    playerCount: totalPlayers,
    maxPlayers: 100,
    playersInQueue: playersInQueue,
    activeMatches: activeMatchCount,
    playersInMatches: playersInMatches,
    ping: 25, // Approximate ping for Railway
    region: 'US-East',
    gameMode: '1v1 Arena',
    status: 'online'
  }))
  
  console.log(`📊 Sent server info to player ${playerId}: ${totalPlayers} players online`)
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

