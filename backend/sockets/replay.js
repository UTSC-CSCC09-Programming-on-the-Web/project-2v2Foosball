import { Server, Socket } from "socket.io";
import { games } from "../data/game_data.js";
import { Game } from "../models/game.js";
import { GAME_DEFAULTS } from "../data/game_data.js";
import { GameAction } from "../models/game_actions.js";

/**
 *
 * @param {Server} io
 * @param {Socket} socket
 */

export function registerReplayListeners(io, socket) {
  socket.on("replay.start", async (gameId) => {
    let game = games.get(gameId);
    let gameFromDb = null;
    if (!game) {
      // Try to fetch from DB
      try {
        gameFromDb = await Game.findOne({ where: { gameId } });
      } catch (err) {
        socket.emit("replay.error", "Game not found");
        return;
      }
      if (!gameFromDb) {
        socket.emit("replay.error", "Game not found");
        return;
      }
      if (gameFromDb.status !== "finished") {
        socket.emit("replay.error", "Game is not finished");
        return;
      }
      // Use default config/state for replay, will be overwritten by actions
      game = {
        gameId: gameFromDb.gameId,
        status: gameFromDb.status,
        config: GAME_DEFAULTS.config,
        state: JSON.parse(JSON.stringify(GAME_DEFAULTS.state)),
      };
    } else {
      if (game.status !== "finished") {
        socket.emit("replay.error", "Game is not finished");
        return;
      }
    }

    // Fetch the game actions
    let actions;
    try {
      actions = await GameAction.findAll({
        where: { gameId },
        order: [["elapsedMs", "ASC"]],
      });
    } catch (err) {
      socket.emit("replay.error", "Could not fetch actions");
      return;
    }

    if (!actions.length) {
      socket.emit("replay.error", "No actions found for this game");
      return;
    }

    // Start the replay
    socket.join(`replay-${gameId}`);
    io.to(`replay-${gameId}`).emit("replay.started", game);

    // Replay loop: simulate game state from actions and emit to clients
    let replayPaused = false;
    let replayTimer = null;
    let startTime = Date.now();
    let lastState = null;


    function buildGameState(upToMs) {
      let state = JSON.parse(JSON.stringify(game.state));
      let config = JSON.parse(JSON.stringify(game.config));
      let score = { team1: 0, team2: 0 };
      for (const action of actions) {
        if (action.elapsedMs > upToMs) break;
        switch (action.type) {
          case "game_start":
            state = action.data.state;
            config = action.data.config;
            break;
          case "player_input_start":
            const { team, activeRod, key } = action.data;
            const rod = state[`team${team}`].rods[activeRod - 1];
            rod.vy = key === "w" ? -config.rodSpeed : config.rodSpeed;
            break;
          case "player_input_end":
            const { team: teamEnd, activeRod: rodEnd } = action.data;
            state[`team${teamEnd}`].rods[rodEnd - 1].vy = 0;
            break;
          case "ball_reset":
            state.ball = action.data.ball;
            break;
          case "goal":
            score.team1 = action.data.score1;
            score.team2 = action.data.score2;
            break;
          case "game_ended":
            // Mark game ended
            break;
        }
      }
      return { state, config, score };
    }

    function emitReplayState() {
      if (replayPaused) return;
      const elapsedMs = Date.now() - startTime;
      const { state, config, score } = buildGameState(elapsedMs);
      lastState = { ball: state.ball, rods: { team1: state.team1.rods, team2: state.team2.rods }, config, score };
      io.to(`replay-${gameId}`).emit("replay.state", lastState);
      // End replay if time exceeds last action
      if (elapsedMs >= actions[actions.length - 1].elapsedMs) {
        clearInterval(replayTimer);
        io.to(`replay-${gameId}`).emit("replay.stopped");
      }
    }

    // Start emitting replay state every 50ms
    replayTimer = setInterval(emitReplayState, 50);

    // Store timer for pause/resume/stop
    socket.replayTimer = replayTimer;
    socket.replayPaused = false;
    socket.replayGameId = gameId;
  });

  socket.on("replay.stop", (gameId) => {
    socket.leave(`replay-${gameId}`);
    io.to(`replay-${gameId}`).emit("replay.stopped");
  });

  // Seek (or rewind) to a specific time in the replay
  socket.on("replay.seek", (data) => {
    // TODO
  });

  // Pause the replay
  socket.on("replay.pause", (gameId) => {
    // TODO
  });

  // Resume the replay
  socket.on("replay.resume", (gameId) => {
    // TODO
  });

}