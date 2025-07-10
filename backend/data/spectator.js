export class SpectatorService {
    constructor() {
        // Array of snapshots, mapped to gameId
        this.gameSnapshots = new Map();
        // Set of socketIds for spectators, mapped to gameId
        this.spectatorRooms = new Map();
        // 5 seconds delay for spectators
        this.BUFFER_DURATION = 5000;
        // 60 FPS for spectators
        this.SNAPSHOT_INTERVAL = 1000 / 60;
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

        // Add new snapshot with deep copy to avoid reference issues
        snapshots.push({
            timestamp: now,
            gameId,
            ball: { ...gameState.ball }, // Deep copy ball
            team1: {
                score: gameState.team1.score,
                rods: gameState.team1.rods.map((rod) => ({
                    ...rod,
                    figures: rod.figures.map((figure) => ({ ...figure })),
                })),
            },
            team2: {
                score: gameState.team2.score,
                rods: gameState.team2.rods.map((rod) => ({
                    ...rod,
                    figures: rod.figures.map((figure) => ({ ...figure })),
                })),
            },
        });

        // Remove snapshots older than buffer duration + 1 second (for safety)
        const cutoffTime = now - (this.BUFFER_DURATION + 1000);
        this.gameSnapshots.set(
            gameId,
            snapshots.filter((snapshot) => snapshot.timestamp > cutoffTime)
        );
    }

    // Get the game state that's 5 seconds behind
    getSpectatorState(gameId) {
        const snapshots = this.gameSnapshots.get(gameId);
        if (!snapshots || snapshots.length === 0) {
            return null;
        }

        const now = Date.now();
        const targetTime = now - this.BUFFER_DURATION; // 5 seconds ago

        // Find the snapshot closest to 5 seconds ago
        let closestSnapshot = null;
        let closestTimeDiff = Infinity;

        for (const snapshot of snapshots) {
            const timeDiff = Math.abs(snapshot.timestamp - targetTime);
            if (timeDiff < closestTimeDiff) {
                closestTimeDiff = timeDiff;
                closestSnapshot = snapshot;
            }
        }

        if (!closestSnapshot) {
            return null;
        }

        const actualDelay = (now - closestSnapshot.timestamp) / 1000;

        // Only return if we have a snapshot that's at least 4 seconds old
        // (allowing 1 second tolerance for timing variations)
        if (actualDelay >= 4.0) {
            return closestSnapshot;
        } else {
            return null;
        }
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
