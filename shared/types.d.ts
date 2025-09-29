export interface Vector3 {
    x: number;
    y: number;
    z: number;
}
export interface Player {
    id: number;
    position: Vector3;
    rotation: Vector3;
    health: number;
    isAlive: boolean;
    team: 'blue' | 'red';
}
export interface GameState {
    players: Map<number, Player>;
    round: number;
    score: {
        blue: number;
        red: number;
    };
    timeRemaining: number;
    phase: 'waiting' | 'preparation' | 'active' | 'ended';
}
export type ClientMessage = PingMessage | PlayerPositionMessage | PlayerShootMessage | PlayerReloadMessage | RequestMatchmakingMessage;
export type ServerMessage = PongMessage | WelcomeMessage | PlayerJoinedMessage | PlayerLeftMessage | PlayerPositionUpdateMessage | PlayerShotMessage | GameStateUpdateMessage | MatchFoundMessage;
export interface PingMessage {
    type: 'ping';
    timestamp: number;
}
export interface PlayerPositionMessage {
    type: 'player_position';
    position: Vector3;
    rotation: Vector3;
}
export interface PlayerShootMessage {
    type: 'player_shoot';
    direction: Vector3;
    timestamp: number;
}
export interface PlayerReloadMessage {
    type: 'player_reload';
    timestamp: number;
}
export interface RequestMatchmakingMessage {
    type: 'request_matchmaking';
    gameMode: '1v1' | '2v2' | '5v5';
}
export interface PongMessage {
    type: 'pong';
    timestamp: number;
}
export interface WelcomeMessage {
    type: 'welcome';
    playerId: number;
    message: string;
}
export interface PlayerJoinedMessage {
    type: 'player_joined';
    playerId: number;
}
export interface PlayerLeftMessage {
    type: 'player_left';
    playerId: number;
}
export interface PlayerPositionUpdateMessage {
    type: 'player_position_update';
    playerId: number;
    position: Vector3;
    rotation: Vector3;
}
export interface PlayerShotMessage {
    type: 'player_shot';
    playerId: number;
    timestamp: number;
}
export interface GameStateUpdateMessage {
    type: 'game_state_update';
    gameState: Partial<GameState>;
}
export interface MatchFoundMessage {
    type: 'match_found';
    matchId: string;
    players: number[];
    gameMode: '1v1' | '2v2' | '5v5';
}
export declare const GAME_CONFIG: {
    readonly ARENA_WIDTH: 40;
    readonly ARENA_HEIGHT: 25;
    readonly PLAYER_HEIGHT: 1.8;
    readonly PLAYER_SPEED: 5;
    readonly WEAPON_DAMAGE: 30;
    readonly WEAPON_RANGE: 100;
    readonly MAGAZINE_SIZE: 30;
    readonly RELOAD_TIME: 2.5;
    readonly ROUND_TIME: 180;
    readonly MAX_HEALTH: 100;
};
