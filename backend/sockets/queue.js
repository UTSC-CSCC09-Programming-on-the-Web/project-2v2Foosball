import { Server, Socket } from "socket.io";
import { queue } from "../data/queue_data.js";
import { userToGameMap } from "../data/game_data.js";

/**
 *
 * @param {Server} io
 * @param {Socket} socket
 */
export function registerQueueListeners(io, socket) {
  socket.on("queue.join", () => {
    const user = socket.user;

    // Don't allow users already in a game to join queue
    if (userToGameMap.has(user.userId)) {
      return;
    }

    // Use a room for the queue so we can broadcast updates only to queue members
    socket.join("queue");

    user.socketId = socket.id;
    queue.push(user);
    io.emit("queue.updated", queue);
  });

  socket.on("queue.leave", () => {
    const user = socket.user;
    const index = queue.findIndex((u) => u.userId === user.userId);

    queue.splice(index, 1);
    io.emit("queue.updated", queue);
  });
}
