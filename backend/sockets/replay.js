import { games } from "../data/game_data.js";
import { ReplayController } from "../data/replay_controller.js";

/**
 *
 * @param {Server} io
 * @param {Socket} socket
 */

const activeReplays = new Map(); // socket.id -> { [gameId]: ReplayController }

export function registerReplayListeners(io, socket) {
  // Store active replay controllers by socket and gameId

  socket.on("replay.start", async (gameId) => {
    // Join the socket to the replay room
    // Create a ReplayController for this socket/gameId
    const controller = new ReplayController(gameId, io, socket);
    await controller.loadActions();
    await controller.start();

    const userId = socket.user.userId;

    activeReplays.set(userId, controller);

    // Emit replay started event
    socket.emit("replay.started", {
      gameId,
    });
  });

  socket.on("replay.stop", (gameId) => {
    socket.emit("replay.stopped");
    const userId = socket.user.userId;
    // Clean up controller
    if (activeReplays.has(userId)) {
      const replay = activeReplays.get(userId);
      console.log("Stopping replay for game:", gameId);
      replay.endReplay();
      activeReplays.delete(userId);
    }
  });

  // Seek (or rewind) to a specific frame
  socket.on("replay.seek", ({ gameId, frameNumber }) => {
    const userId = socket.user.userId;
    const ctrls = activeReplays.get(userId);
    if (ctrls) {
      ctrls.seek(frameNumber);
    }
  });

  // Pause the replay
  socket.on("replay.pause", (gameId) => {
    const userId = socket.user.userId;
    const ctrls = activeReplays.get(userId);
    if (ctrls) {
      ctrls.pause();
    }
  });

  // Resume the replay
  socket.on("replay.resume", (gameId) => {
    const ctrls = activeReplays.get(socket.user.userId);
    if (ctrls) {
      ctrls.resume();
    }
  });

  // Clean up on disconnect
  socket.on("disconnect", () => {
    const userId = socket.user.userId;
    if (activeReplays.has(socket.user.userId)) {
      const controller = activeReplays.get(socket.user.userId);
      if (controller) {
        controller.endReplay();
      }
      activeReplays.delete(socket.user.userId);
    }
  });
}
