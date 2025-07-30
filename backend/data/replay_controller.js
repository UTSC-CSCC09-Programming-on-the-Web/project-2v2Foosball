import { GameAction } from "../models/game_actions.js";

import { endGame, GAME_DEFAULTS } from "./game_data.js";
import {
  updateGamePhysics,
  checkBounds,
  checkCollisions,
  updateRods,
  checkGoals,
} from "./game_data.js";
import { Op } from "sequelize";

export class ReplayController {
  /**
   * @param {string} gameId
   * @param {import("socket.io").Server} io
   * @param {import("socket.io").Socket} socket
   */
  constructor(gameId, io, socket) {
    this.gameId = gameId;
    this.io = io;
    this.socket = socket;
    this.actions = new Map(); // Frame number -> GameAction
    this.game = null; // Will hold the game state
    this.currentFrame = 0;
    this.isPaused = false;
    this.next = null;
  }

  // Load game actions from the database
  async loadActions() {
    try {
      const actions = await GameAction.findAll({
        where: {
          gameId: this.gameId,
          type: {
            [Op.ne]: "game_snapshot", // exclude game_snapshot actions
          },
        },
        order: [["frameNumber", "ASC"]],
      });
      if (!actions.length) {
        this.socket.emit("replay.error", "No actions found for this game");
        return;
      }
      // Map actions by frame number
      actions.forEach((action) => {
        // A map of arrrays
        if (this.actions.has(action.frameNumber)) {
          this.actions.get(action.frameNumber).push(action);
        } else {
          this.actions.set(action.frameNumber, [action]);
        }
      });
    } catch (err) {
      this.socket.emit("replay.error", "Could not fetch actions");
    }
  }

  // Start the replay
  async start() {
    this.isPaused = false;
    this.currentFrame = 0;

    // Initial game state should be default
    this.game = {
      gameId: this.gameId,
      status: "replaying",
      config: this.actions.get(0)[0].data.config,
      state: this.actions.get(0)[0].data.state,
    };

    this.playNextFrame();
  }

  // Play the next frame of the replay
  async playNextFrame() {
    if (this.isPaused || this.currentFrame >= this.actions.length) return;

    const actions = this.actions.get(this.currentFrame);

    // Apply the action to the local game state
    if (actions) {
      actions.forEach((action) => this.applyActionToGame(action));
    }

    // Run physics and logic as in game_data.js
    updateGamePhysics(this.game);
    checkBounds(this.game, this.gameId);
    checkCollisions(this.game, this.gameId);
    checkGoals(this.game, this.gameId);
    updateRods(this.game, 1);
    updateRods(this.game, 2);

    // Emit the updated state to the replay room
    this.socket.emit("replay.state", {
      ball: this.game.state.ball,
      rods: {
        team1: this.game.state.team1.rods,
        team2: this.game.state.team2.rods,
      },
      config: this.game.config,
      score: {
        team1: this.game.state.team1.score,
        team2: this.game.state.team2.score,
      },
    });

    this.currentFrame++;
    this.next = setTimeout(() => this.playNextFrame(), 1000 / 60);
  }

  // Apply a single action to the local game state
  applyActionToGame(action) {
    if (!action) return;
    const { type, data } = action;
    switch (type) {
      case "game_start":
        // Reset to initial state
        // this.game.state = JSON.parse(JSON.stringify(GAME_DEFAULTS.state));
        // this.game.config = JSON.parse(JSON.stringify(GAME_DEFAULTS.config));
        break;
      case "player_input_start": {
        const { team, activeRod, key } = data;
        const rod = this.game.state[`team${team}`].rods[activeRod - 1];
        rod.vy =
          key === "w" ? -this.game.config.rodSpeed : this.game.config.rodSpeed;
        break;
      }
      case "player_input_end": {
        const { team, activeRod } = data;
        const rod = this.game.state[`team${team}`].rods[activeRod - 1];
        rod.vy = 0;
        break;
      }
      case "ball_reset":
        this.isPaused = false;
        this.game.state.ball = { ...data.ball };
        this.game.state.team1.rods = GAME_DEFAULTS.state.team1.rods;
        this.game.state.team2.rods = GAME_DEFAULTS.state.team2.rods;
        break;
      case "goal":
        // Update scores if present
        if (
          data &&
          typeof data.score1 === "number" &&
          typeof data.score2 === "number"
        ) {
          this.game.state.team1.score = data.score1;
          this.game.state.team2.score = data.score2;
        }
        break;
      case "game_ended":
        this.endReplay();
        break;
      default:
        break;
    }
  }

  endReplay() {
    console.log("Ending replay for game:", this.gameId);
    this.isPaused = true;
    this.socket.emit("replay.stopped");
    clearTimeout(this.next);
  }

  // Pause the replay
  pause() {
    this.isPaused = true;
    this.socket.emit("replay.paused");

    // Remove any scheduled frame updates
    clearTimeout(this.next);
  }

  // Resume the replay
  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.playNextFrame();
      this.socket.emit("replay.resumed");
    }
  }

  // Helper function to for rewind
  async _goToLastSnapshotInterval(frameNumber) {
    // Get the last action before the target frame
    const lastAction = await GameAction.findOne({
      where: {        
        gameId: this.gameId,
        frameNumber: {
          [Op.lte]: frameNumber,
        },
      },
      order: [["frameNumber", "DESC"]],
    });

    if (!lastAction) {
      this.socket.emit("replay.error", "No actions found for rewind");
      return;
    }

    // Set the game state to the last snapshot
    this.currentFrame = lastAction.frameNumber;

    console.log("Interpolating game state to frame:", frameNumber, lastAction.data);

    // Interpolate the game state to the target frame
    this.game.state = JSON.parse(JSON.stringify(lastAction.data.state));
    this.game.config = JSON.parse(JSON.stringify(lastAction.data.config));
  }

  // Rewind 5 seconds
  async rewind() {
    const rewindAmount = 5 * 60; // 5 seconds in frames (60 FPS)
    const newFrame = this.currentFrame - rewindAmount;
    if (newFrame < 0) {
      this.socket.emit("replay.error", "Invalid frame number");
      return;
    }

    clearTimeout(this.next);

    // Go to the last snapshot interval before the new frame
    await this._goToLastSnapshotInterval(newFrame);

    this.socket.emit("replay.state", {
      ball: this.game.state.ball,
      rods: {
        team1: this.game.state.team1.rods,
        team2: this.game.state.team2.rods,
      },
      config: this.game.config,
      score: {
        team1: this.game.state.team1.score,
        team2: this.game.state.team2.score,
      },
    });

    this.playNextFrame();
  }
}
