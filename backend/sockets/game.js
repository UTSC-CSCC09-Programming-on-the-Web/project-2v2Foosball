import { Server, Socket } from "socket.io";
import { queue } from "../data/queue_data.js";
import { Game } from "../models/game.js";
import { Player } from "../models/players.js";
import { addNewGame, games, userToGameMap } from "../data/game_data.js";

/**
 *
 * @param {Server} io
 * @param {Socket} socket
 */
export function registerGameListeners(io, socket) {
  setInterval(async () => {
    // Check if there are enough players in the queue to start a game
    if (queue.length >= 2) {
      const players = queue.splice(0, 2); // Take the first two players from the queue
      io.emit("queue.updated", queue);

      // Create a game object
      const game = await Game.create();
      players.forEach(async (player, i) => {
        await Player.create({
          userId: player.userId,
          gameId: game.gameId,
          team: i + 1, // Assign teams 1 and 2
        });

        userToGameMap.set(player.userId, game.gameId);
        addNewGame(game.gameId);

        // Move players to a game room
        io.sockets.sockets.get(player.socketId).join(`game-${game.gameId}`);
        io.to(player.socketId).emit("game.joined", game.gameId);
      });

      console.log(
        `Game started with players: ${players.map((p) => p.userId).join(", ")}`,
      );
    }
  }, 1000);

  // Listen for game-related events
  // Make sure for game events, only broadcast to players in the game room
  // ie: socket.to(`game-${game.id}`).emit("event.name", data);
  socket.on("game.keypress", async (data) => {
    const { key, activeRod, type } = data;
    const userId = socket.user.userId;

    const gameId = userToGameMap.get(socket.user.userId);
    const player = await Player.findOne({
      where: {
        userId,
        gameId,
      },
    });
    const game = games.get(gameId);

    console.log(
      `Key ${type === "keydown" ? "pressed" : "lifted"} in game ${gameId}: ${key} by user ${userId} on rod ${activeRod}`,
    );

    if (gameId && game && player) {
      if (type === "keydown") {
        game.state[`team${player.team}`].rods[activeRod - 1].vy =
          key === "w" ? -game.config.rodSpeed : game.config.rodSpeed;
      } else if (type === "keyup") {
        game.state[`team${player.team}`].rods[activeRod - 1].vy = 0;
      }

      io.to(`game-${gameId}`).emit("game.updated", {
        eventType: "direction_update",
        gameState: {
          [`team${player.team}`]: {
            rods: game.state[`team${player.team}`].rods,
          },
        },
      });
    }
  });
}
