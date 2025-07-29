import { ReplayController } from "../data/replay_controller.js";

/**
 *
 * @param {Server} io
 * @param {Socket} socket
 */

export function registerReplayListeners(io, socket) {

  // Store active replay controllers by socket and gameId
  const activeReplays = new Map(); // socket.id -> { [gameId]: ReplayController }

  socket.on("replay.start", async (gameId) => {
    // Join the socket to the replay room
    socket.join(`replay-${gameId}`);

    // Create a ReplayController for this socket/gameId
    const controller = new ReplayController(gameId, io, socket);
    await controller.loadActions();
    await controller.start();

    // Track the controller for this socket
    if (!activeReplays.has(socket.id)) {
      activeReplays.set(socket.id, {});
    }
    activeReplays.get(socket.id)[gameId] = controller;
    
    // Emit replay started event
    io.to(`replay-${gameId}`).emit("replay.started", {
      gameId,
    });
  });

  socket.on("replay.stop", (gameId) => {
    socket.leave(`replay-${gameId}`);
    io.to(`replay-${gameId}`).emit("replay.stopped");
    // Clean up controller
    if (activeReplays.has(socket.id) && activeReplays.get(socket.id)[gameId]) {
      delete activeReplays.get(socket.id)[gameId];
    }
  });

  // Seek (or rewind) to a specific frame
  socket.on("replay.seek", ({ gameId, frameNumber }) => {
    const ctrls = activeReplays.get(socket.id);
    if (ctrls && ctrls[gameId]) {
      ctrls[gameId].seek(frameNumber);
    }
  });

  // Pause the replay
  socket.on("replay.pause", (gameId) => {
    const ctrls = activeReplays.get(socket.id);
    if (ctrls && ctrls[gameId]) {
      ctrls[gameId].pause();
    }
  });

  // Resume the replay
  socket.on("replay.resume", (gameId) => {
    const ctrls = activeReplays.get(socket.id);
    if (ctrls && ctrls[gameId]) {
      ctrls[gameId].resume();
    }
  });

  // Clean up on disconnect
  socket.on("disconnect", () => {
    if (activeReplays.has(socket.id)) {
      Object.keys(activeReplays.get(socket.id)).forEach((gameId) => {
        socket.leave(`replay-${gameId}`);
      });
      activeReplays.delete(socket.id);
    }
  });
}