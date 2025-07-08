export class SpectatorService {
  constructor() {
    // Array of snapshots, mapped to gameId
    this.gameSnapshots = new Map();
    // Set of socketIds for spectators, mapped to gameId
    this.spectatorRooms = new Map();
    // 5 seconds delay for spectators
    this.BUFFER_DURATION = 5000;
    // 20 FPS for spectators
    this.SNAPSHOT_INTERVAL = 50;
  }

  // Record game state with timestamp
  recordGameState(gameId, gameState) {
    // If there is no gameId in the snapshots, initialize a new array for gameId
    if (!this.gameSnapshots.has(gameId)) {
      this.gameSnapshots.set(gameId, []);
    }

    // Get the snapshots for the gameId
    const snapshots = this.gameSnapshots.get(gameId);
    const now = Date.now();

    // Add new snapshot
    snapshots.push({
      timestamp: now,
      gameId,
      ...gameState,
    });

    // Remove snapshots older than buffer duration
    const cutoffTime = now - this.BUFFER_DURATION;
    this.gameSnapshots.set(
      gameId,
      snapshots.filter((snapshot) => snapshot.timestamp > cutoffTime),
    );
  }

  // Get the game state that's 5 seconds behind
  getSpectatorState(gameId) {
    const snapshots = this.gameSnapshots.get(gameId);
    if (!snapshots || snapshots.length === 0) {
      return null;
    }

    // Return the oldest snapshot (5 seconds behind)
    return snapshots[0];
  }

  // Add spectator to a game
  addSpectator(gameId, socketId) {
    // If there is no gameId in the spectator rooms, initialize a new set for gameId
    if (!this.spectatorRooms.has(gameId)) {
      this.spectatorRooms.set(gameId, new Set());
    }
    // Add the spectator's socketId to the set for the gameId
    this.spectatorRooms.get(gameId).add(socketId);
  }

  // Remove spectator from a game
  removeSpectator(gameId, socketId) {
    if (this.spectatorRooms.has(gameId)) {
      this.spectatorRooms.get(gameId).delete(socketId);
      if (this.spectatorRooms.get(gameId).size === 0) {
        this.spectatorRooms.delete(gameId);
      }
    }
  }

  // Get spectator count for a game
  getSpectatorCount(gameId) {
    return this.spectatorRooms.has(gameId)
      ? this.spectatorRooms.get(gameId).size
      : 0;
  }

  // Cleanup when game ends
  cleanupGame(gameId) {
    this.gameSnapshots.delete(gameId);
    this.spectatorRooms.delete(gameId);
  }
}

export const spectatorService = new SpectatorService();
