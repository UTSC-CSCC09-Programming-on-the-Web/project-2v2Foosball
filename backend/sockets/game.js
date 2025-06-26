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
    if (queue.length >= 2) {
      const players = queue.splice(0, 2); // Take the first two players from the queue
      io.emit("queue.updated", queue);

      // Create a game object (you can customize this as needed)
      const game = {
        id: `game-${crypto.randomUUID()}`, // Unique game ID
        players: players.map((p) => ({
          userId: p.userId,
          socketId: p.socketId,
        })),
        status: "waiting", // Initial status of the game
      };

      // Move players to a game room
      players.forEach((player) => {
        io.sockets.sockets.get(player.socketId).join(`game-${game.id}`);
        io.to(player.socketId).emit("game.joined", game);
      });

      console.log(
        `Game started with players: ${players.map((p) => p.userId).join(", ")}`,
      );
    }
  }, 1000);

  // Listen for game-related events
  // Make sure for game events, only broadcast to players in the game room
  // ie: socket.to(`game-${game.id}`).emit("event.name", data);
}
