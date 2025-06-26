import { Server } from "socket.io";
import { registerQueueListeners } from "./queue.js";
import { registerGameListeners } from "./game.js";

/**
 *
 * @param {Server} io
 */
export function registerIOListeners(io) {
  // Register all socket event listeners for different features
  io.on("connection", (socket) => {
    // when someone connects, they are assigned a socket object.
    console.log("a user connected");

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });

    registerQueueListeners(io, socket);
    registerGameListeners(io, socket);
  });
}
