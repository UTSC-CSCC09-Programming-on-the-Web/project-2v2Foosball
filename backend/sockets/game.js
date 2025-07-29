import { Server, Socket } from "socket.io";
import { queue } from "../data/queue_data.js";
import { Game } from "../models/game.js";
import { Player } from "../models/players.js";
import { GameAction } from "../models/game_actions.js";
import { addNewGame, games, userToGameMap } from "../data/game_data.js";

/**
 *
 * @param {Server} io
 * @param {Socket} socket
 */
export function registerGameListeners(io, socket) {
  setInterval(async () => {
    // Check if there are enough players in the queue to start a game
    if (queue.length >= 4) {
      const players = queue.splice(0, 4); // Take the first four players from the queue
      io.emit("queue.updated", queue);

      // Create a game object
      const game = await Game.create({
        score1: 0,
        score2: 0,
      });

      // Add the new game to memory once
      addNewGame(game.gameId);

      for (const [i, player] of players.entries()) {
        try {
          // Assign teams and rod positions:
          // Players 0,1 → Team 1 (rod positions: front=1,2 and back=3,4)
          // Players 2,3 → Team 2 (rod positions: front=1,2 and back=3,4)
          const team = i < 2 ? 1 : 2;
          const rodPosition = i % 2 === 0 ? "front" : "back"; // front controls rods 1-2, back controls rods 3-4

          await Player.create({
            userId: player.userId,
            gameId: game.gameId,
            team: team,
            rodPosition: rodPosition,
          });

          userToGameMap.set(player.userId, game.gameId);

          // Move players to a game room
          io.sockets.sockets.get(player.socketId).join(`game-${game.gameId}`);
          io.to(player.socketId).emit("game.joined", game.gameId);

          // Send initial game state to the player
          const gameState = games.get(game.gameId);
          if (gameState) {
            io.to(player.socketId).emit("game.updated", {
              eventType: "initial_state",
              gameState: {
                ball: gameState.state.ball,
                team1: {
                  score: gameState.state.team1.score,
                  rods: gameState.state.team1.rods,
                },
                team2: {
                  score: gameState.state.team2.score,
                  rods: gameState.state.team2.rods,
                },
              },
            });
          }
        } catch (error) {
          console.error(
            `Error creating player ${player.userId} for game ${game.gameId}:`,
            error,
          );
          // If there's an error, it might be because the player still has a game association
          // Try to clean up and retry
          await Player.update(
            { gameId: null },
            { where: { userId: player.userId } },
          );

          // Retry player creation
          await Player.create({
            userId: player.userId,
            gameId: game.gameId,
            team: team,
            rodPosition: rodPosition,
          });

          userToGameMap.set(player.userId, game.gameId);
          io.sockets.sockets.get(player.socketId).join(`game-${game.gameId}`);
          io.to(player.socketId).emit("game.joined", game.gameId);

          // Send initial game state to the player
          const gameState = games.get(game.gameId);
          if (gameState) {
            io.to(player.socketId).emit("game.updated", {
              eventType: "initial_state",
              gameState: {
                ball: gameState.state.ball,
                team1: {
                  score: gameState.state.team1.score,
                  rods: gameState.state.team1.rods,
                },
                team2: {
                  score: gameState.state.team2.score,
                  rods: gameState.state.team2.rods,
                },
              },
            });
          }
        }
      }

      console.log(
        `Game started with 4 players: ${players.map((p) => p.userId).join(", ")}`,
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

    if (gameId && game && player) {
      // Validate that player can control the requested rod
      const allowedRods = player.rodPosition === "front" ? [1, 2] : [3, 4];
      if (!allowedRods.includes(activeRod)) {
        console.log(
          `Player ${userId} attempted to control rod ${activeRod} but is only allowed rods ${allowedRods.join(", ")}`,
        );
        return; // Ignore invalid rod control attempts
      }

      console.log(
        `Key ${type === "keydown" ? "pressed" : "lifted"} in game ${gameId}: ${key} by user ${userId} on rod ${activeRod} (${player.rodPosition} position)`,
      );

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

      // Store the action in the database
      try {
        await GameAction.create({
          gameId,
          elapsedMs: Date.now() - game.startTime,
          frameNumber: game.frameCount,
          type: type === "keydown" ? "player_input_start" : "player_input_end",
          data: {
            key,
            activeRod,
            team: player.team,
            rodPosition: player.rodPosition,
          },
        });
      } catch (error) {
        console.error(
          `Error storing game action for user ${userId} in game ${gameId}:`,
          error,
        );
      }
    }
  });
}
