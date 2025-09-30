// Shared types for client-server communication

export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface Player {
  id: number
  position: Vector3
  rotation: Vector3
  health: number
  isAlive: boolean
  team: 'blue' | 'red'
}

export interface GameState {
  players: Map<number, Player>
  round: number
  score: {
    blue: number
    red: number
  }
  timeRemaining: number
  phase: 'waiting' | 'preparation' | 'active' | 'ended'
}

// WebSocket message types
export type ClientMessage = 
  | PingMessage
  | PlayerPositionMessage
  | PlayerShootMessage
  | PlayerReloadMessage
  | RequestMatchmakingMessage
  | RequestServerInfoMessage

export type ServerMessage = 
  | PongMessage
  | WelcomeMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerPositionUpdateMessage
  | PlayerShotMessage
  | GameStateUpdateMessage
  | MatchFoundMessage
  | RoundStartMessage
  | RoundEndMessage
  | MatchEndMessage
  | PlayerHitMessage
  | PlayerDeathMessage
  | ServerInfoMessage

// Client to Server messages
export interface PingMessage {
  type: 'ping'
  timestamp: number
}

export interface PlayerPositionMessage {
  type: 'player_position'
  position: Vector3
  rotation: Vector3
}

export interface PlayerShootMessage {
  type: 'player_shoot'
  direction: Vector3
  position?: Vector3
  timestamp: number
}

export interface PlayerReloadMessage {
  type: 'player_reload'
  timestamp: number
}

export interface RequestMatchmakingMessage {
  type: 'request_matchmaking'
  gameMode: '1v1' | '2v2' | '5v5'
}

export interface RequestServerInfoMessage {
  type: 'request_server_info'
}

// Server to Client messages
export interface PongMessage {
  type: 'pong'
  timestamp: number
}

export interface WelcomeMessage {
  type: 'welcome'
  playerId: number
  message: string
}

export interface PlayerJoinedMessage {
  type: 'player_joined'
  playerId: number
}

export interface PlayerLeftMessage {
  type: 'player_left'
  playerId: number
}

export interface PlayerPositionUpdateMessage {
  type: 'player_position_update'
  playerId: number
  position: Vector3
  rotation: Vector3
}

export interface PlayerShotMessage {
  type: 'player_shot'
  playerId: number
  timestamp: number
}

export interface GameStateUpdateMessage {
  type: 'game_state_update'
  gameState: Partial<GameState>
}

export interface MatchFoundMessage {
  type: 'match_found'
  matchId: string
  players: number[]
  gameMode: '1v1' | '2v2' | '5v5'
}

export interface RoundStartMessage {
  type: 'round_start'
  matchId: string
  round: number
  spawnPosition: Vector3
  health: number
  timeLimit: number
  scores: Record<number, number>
}

export interface RoundEndMessage {
  type: 'round_end'
  matchId: string
  round: number
  winner: number | null
  reason: 'elimination' | 'timeout'
  scores: Record<number, number>
}

export interface MatchEndMessage {
  type: 'match_end'
  matchId: string
  winner: number | null
  finalScores: Record<number, number>
  totalRounds: number
}

export interface PlayerHitMessage {
  type: 'player_hit'
  shooterId: number
  targetId: number
  damage: number
  isHeadshot: boolean
  newHealth: number
}

export interface PlayerDeathMessage {
  type: 'player_death'
  killerId: number
  victimId: number
  isHeadshot: boolean
}

export interface ServerInfoMessage {
  type: 'server_info'
  serverName: string
  playerCount: number
  maxPlayers: number
  playersInQueue: number
  activeMatches: number
  playersInMatches: number
  ping: number
  region: string
  gameMode: string
  status: 'online' | 'offline' | 'maintenance'
}

// Game constants
export const GAME_CONFIG = {
  ARENA_WIDTH: 40,
  ARENA_HEIGHT: 25,
  PLAYER_HEIGHT: 1.8,
  PLAYER_SPEED: 5.0,
  WEAPON_DAMAGE: 30,
  WEAPON_RANGE: 100,
  MAGAZINE_SIZE: 30,
  RELOAD_TIME: 2.5,
  ROUND_TIME: 180, // 3 minutes
  MAX_HEALTH: 100
} as const

