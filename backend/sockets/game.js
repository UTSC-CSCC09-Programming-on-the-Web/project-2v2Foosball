import { Server, Socket } from "socket.io";
import { queue } from "../queue_data.js";

/**
 *
 * @param {Server} io
 * @param {Socket} socket
 */
export function registerGameListeners(io, socket) {
  setInterval(() => {
    // Check if there are enough players in the queue to start a game
    if (queue.length >= 1) {
      const players = queue.splice(0, 1); // Take the first two players from the queue

      // Create a game object (you can customize this as needed)
      const game = {
        id: `game-${Date.now()}`, // Unique game ID
        players: players.map((p) => ({
          userId: p.userId,
          socketId: p.socketId,
        })),
        status: "waiting", // Initial status of the game
      };

      // Notify both players that a game has started
      players.forEach((player) => {
        io.to(player.socketId).emit("game.started", game);
      });

      console.log(
        `Game started with players: ${players.map((p) => p.userId).join(", ")}`,
      );
    }
  }, 1000);

  // Listen for game-related events
  // socket.on
}
