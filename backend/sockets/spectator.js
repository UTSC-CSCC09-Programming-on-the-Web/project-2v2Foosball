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

    console.log(
      `User ${socket.user?.userId || "anonymous"} joined spectating game ${gameId}`,
    );

    // Send initial game state (delayed) if available
    const spectatorState = spectatorService.getSpectatorState(gameId);
    if (spectatorState) {
      socket.emit("spectator.updated", {
        eventType: "position_update",
        gameState: {
          ball: spectatorState.ball,
          team1: {
            score: spectatorState.team1.score,
            rods: spectatorState.team1.rods,
          },
          team2: {
            score: spectatorState.team2.score,
            rods: spectatorState.team2.rods,
          },
        },
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

    console.log(
      `User ${socket.user?.userId || "anonymous"} left spectating game ${gameId}`,
    );

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
