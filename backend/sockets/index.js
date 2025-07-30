import { Server } from "socket.io";
import { registerQueueListeners } from "./queue.js";
import { registerGameListeners } from "./game.js";
import { registerSpectatorListeners } from "./spectator.js";
import { registerReplayListeners } from "./replay.js";
import { Player } from "../models/players.js";
import { userToGameMap } from "../data/game_data.js";
import { Game } from "../models/game.js";

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
    Player.findOne({
      where: {
        userId: socket.user.userId,
      },
      include: [
        {
          model: Game,
          where: {
            status: "in_progress",
          },
        },
      ],
    }).then((player) => {
      if (player) {
        userToGameMap.set(player.userId, player.gameId);
        socket.join(`game-${player.gameId}`);
        io.to(socket.id).emit("game.joined", player.gameId);
        console.log(
          `User ${socket.user.userId} re-joined game ${player.gameId}`,
        );
      } else {
        console.log(`User ${socket.user.userId} is not in a game.`);
      }
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });

    registerQueueListeners(io, socket);
    registerGameListeners(io, socket);
    registerSpectatorListeners(io, socket);
    registerReplayListeners(io, socket);
  });
}
