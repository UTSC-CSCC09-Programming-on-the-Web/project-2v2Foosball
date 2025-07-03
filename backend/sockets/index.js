import { Server } from "socket.io";
import { registerQueueListeners } from "./queue.js";
import { registerGameListeners } from "./game.js";
import { Player } from "../models/players.js";

/**
 *
 * @param {Server} io
 */
export function registerIOListeners(io) {
  // Register all socket event listeners for different features
  io.on("connection", (socket) => {
    // when someone connects, they are assigned a socket object.
    console.log("a user connected");

    // Player reconnection
    Player.findByPk(socket.user.userId).then((player) => {
      if (player) {
        socket.join(`game-${player.gameId}`);
        io.to(socket.id).emit("game.joined", player.gameId);
        console.log(`User ${socket.user.userId} joined game ${player.gameId}`);
      } else {
        console.log(`User ${socket.user.userId} is not in a game.`);
      }
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });

    registerQueueListeners(io, socket);
    registerGameListeners(io, socket);
  });
}
