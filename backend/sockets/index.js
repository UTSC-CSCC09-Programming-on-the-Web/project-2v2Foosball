import { registerQueueListeners } from "./queue.js";

export function registerIOListeners(io) {
  // Register all socket event listeners for different features
  registerQueueListeners(io);
}
