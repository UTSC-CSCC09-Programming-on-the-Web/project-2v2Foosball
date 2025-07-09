import { Server, Socket } from "socket.io";
import { spectatorService } from "../data/spectator.js";
import { games } from "../data/game_data.js";

/**
 *
 * @param {Server} io
 * @param {Socket} socket
 */
export function registerSpectatorListeners(io, socket) {
  // Spectator joins a specific game
  socket.on("spectator.join", (data) => {
    const { gameId } = data;

    if (!games.has(gameId)) {
      socket.emit("spectator.error", { message: "Game not found" });
      return;
    }

    socket.join(`spectator-${gameId}`);
    spectatorService.addSpectator(gameId, socket.id);

    // Send initial game state (delayed) if available
    const spectatorState = spectatorService.getSpectatorState(gameId);

    if (spectatorState) {
      const gameData = games.get(gameId);
      socket.emit("spectator.updated", {
        gameId,
        gameState: {
          ball: spectatorState.ball,
          rods: {
            team1: spectatorState.team1?.rods || [],
            team2: spectatorState.team2?.rods || [],
          },
          config: gameData?.config || {
            fieldWidth: 1200,
            fieldHeight: 500,
            goalWidth: 20,
            goalHeight: 200,
            rodWidth: 20,
            rodHeight: 400,
            rodSpeed: 500,
            ballRadius: 10,
            ballSpeed: 300,
            figureRadius: 20,
          },
          activeRod: gameData?.activeRod || 1,
          gameInfo: {
            score: {
              team1: spectatorState.team1?.score || 0,
              team2: spectatorState.team2?.score || 0,
            },
            players: gameData?.players || {
              team1: [],
              team2: [],
            },
          },
        },
      });
    } else {
      // Game hasn't been running long enough for delayed state
      socket.emit("spectator.error", {
        gameId,
        message:
          "Game is too new. Please wait a few seconds for spectator delay to build up...",
      });
    }

    // Notify about spectator count update
    io.emit("spectator.count.updated", {
      gameId,
      count: spectatorService.getSpectatorCount(gameId),
    });
  });

  // Spectator leaves a specific game
  socket.on("spectator.leave", (data) => {
    const { gameId } = data;

    socket.leave(`spectator-${gameId}`);
    spectatorService.removeSpectator(gameId, socket.id);

    // Notify about spectator count update
    io.emit("spectator.count.updated", {
      gameId,
      count: spectatorService.getSpectatorCount(gameId),
    });
  });

  // Handle spectator disconnect
  socket.on("disconnect", () => {
    // Remove from all spectator rooms they might be in
    for (const [
      gameId,
      spectatorSet,
    ] of spectatorService.spectatorRooms.entries()) {
      if (spectatorSet.has(socket.id)) {
        spectatorService.removeSpectator(gameId, socket.id);
        io.emit("spectator.count.updated", {
          gameId,
          count: spectatorService.getSpectatorCount(gameId),
        });
      }
    }
  });
}
