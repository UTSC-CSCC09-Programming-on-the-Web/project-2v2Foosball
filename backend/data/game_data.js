import { io } from "../app.js";
import { spectatorService } from "./spectator.js";
import { Game } from "../models/game.js";
import { Player } from "../models/players.js";
import { GameAction } from "../models/game_actions.js";

export const userToGameMap = new Map();

// Maps gameId to game objects
export const games = new Map();

function gameFunction(gameId) {
  const game = games.get(gameId);
  if (!game) {
    console.error(`Game with ID ${gameId} not found.`);
    return;
  }

  // Skip game updates if the game is paused
  if (game.state.isPaused) {
    return;
  }

  game.frameCount++;

  updateGamePhysics(game);
  checkBounds(game, gameId);
  checkCollisions(game, gameId);
  checkGoals(game, gameId);

  updateRods(game, 1);
  updateRods(game, 2);

  spectatorService.recordGameState(gameId, {
    ball: game.state.ball,
    team1: {
      score: game.state.team1.score,
      rods: game.state.team1.rods,
    },
    team2: {
      score: game.state.team2.score,
      rods: game.state.team2.rods,
    },
  });
}

function spectatorUpdateFunction(gameId) {
  const delayedState = spectatorService.getSpectatorState(gameId);
  if (delayedState) {
    const gameData = games.get(gameId);

    io.to(`spectator-${gameId}`).emit("spectator.updated", {
      gameId,
      gameState: {
        ball: delayedState.ball,
        rods: {
          team1: delayedState.team1?.rods || [],
          team2: delayedState.team2?.rods || [],
        },
        config: gameData?.config || {
          fieldWidth: 1200,
          fieldHeight: 500,
          goalWidth: 20,
          goalHeight: 200,
          rodWidth: 20,
          rodHeight: 400,
          rodSpeed: 500,
          ballRadius: 10,
          ballSpeed: 300,
          figureRadius: 20,
        },
        activeRod: gameData?.activeRod || 1,
        gameInfo: {
          score: {
            team1: delayedState.team1?.score || 0,
            team2: delayedState.team2?.score || 0,
          },
          players: gameData?.players || {
            team1: [],
            team2: [],
          },
        },
      },
    });
  }
}

async function replayUpdateFunction(gameId) {
  const game = games.get(gameId);

  if (!game) {
    return;
  }

  // Update the game state
  const stateCopy = { ...game.state };
  stateCopy.pauseTimer = null; // Avoid circular reference

  await GameAction.create({
    gameId,
    elapsedMs: Date.now() - game.startTime,
    frameNumber: game.frameCount,
    type: "game_snapshot",
    data: {
      state: JSON.parse(JSON.stringify(stateCopy)),
      config: JSON.parse(JSON.stringify(game.config)),
    },
  });
}

function updateFunction(gameId) {
  const game = games.get(gameId);
  if (!game) {
    console.error(`Game with ID ${gameId} not found.`);
    return;
  }

  io.to(`game-${gameId}`).emit("game.updated", {
    eventType: "position_update",
    gameState: {
      ball: game.state.ball,
      team1: {
        score: game.state.team1.score,
        rods: game.state.team1.rods,
      },
      team2: {
        score: game.state.team2.score,
        rods: game.state.team2.rods,
      },
      frameCount: game.frameCount || 0,
    },
  });
}

export function updateRods(game, team) {
  game.state[`team${team}`].rods.forEach((rod) => {
    const lambda = (figure) => {
      figure.y += rod.vy;

      // Ensure figures stay within the rod bounds
      if (figure.y < game.config.figureRadius) {
        figure.y = game.config.figureRadius;
        return false;
      } else if (figure.y > game.config.rodHeight - game.config.figureRadius) {
        figure.y = game.config.rodHeight - game.config.figureRadius;
        return false;
      }
      return true;
    };
    if (rod.vy < 0) {
      for (let i = 0; i < rod.figures.length; i++) {
        if (!lambda(rod.figures[i])) {
          break;
        }
      }
    } else {
      for (let i = rod.figures.length - 1; i >= 0; i--) {
        if (!lambda(rod.figures[i])) {
          break;
        }
      }
    }
  });
}

export function updateGamePhysics(game) {
  const ball = game.state.ball;
  // Update ball position based on its velocity
  ball.x += ball.vx;
  ball.y += ball.vy;

  // // Friction
  // ball.vx *= 0.99;
  // ball.vy *= 0.99;

  // // Stop micro-movements
  // if (Math.abs(ball.vx) < 0.05) {
  //   ball.vx = 0;
  // }
  // if (Math.abs(ball.vy) < 0.05) {
  //   ball.vy = 0;
  // }
}

export function checkBounds(game, gameId) {
  const ball = game.state.ball;
  const { fieldWidth, fieldHeight, ballRadius } = game.config;

  const reflect = (pos, vel, min, max) => {
    if (pos < min + ballRadius) {
      pos = min + ballRadius;
      vel = Math.abs(vel);
    } else if (pos > max - ballRadius) {
      pos = max - ballRadius;
      vel = -Math.abs(vel);
    }
    return { pos, vel };
  };

  const xCheck = reflect(ball.x, ball.vx, 0, fieldWidth);
  const yCheck = reflect(ball.y, ball.vy, 0, fieldHeight);

  ball.x = xCheck.pos;
  ball.vx = xCheck.vel;
  ball.y = yCheck.pos;
  ball.vy = yCheck.vel;
}

export function checkCollisions(game, gameId) {
  const ball = game.state.ball;
  // If the ball is on the left side of the field, check team1 rods
  if (ball.x < game.config.fieldWidth / 2) {
    game.state.team1.rods.forEach((rod) => {
      rod.figures.forEach((figure) => {
        const dx = ball.x - rod.x;
        const dy = ball.y - figure.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < game.config.ballRadius + game.config.figureRadius) {
          // Ball hits the figure (circle-circle collision)
          const angle = Math.atan2(dy, dx);
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          ball.vx = Math.abs(speed * Math.cos(angle));
          ball.vy = speed * Math.sin(angle);
          // Move ball out of collision
          const overlap =
            game.config.ballRadius + game.config.figureRadius - distance;
          ball.x += overlap * Math.cos(angle);
          ball.y += overlap * Math.sin(angle);
        }
      });
    });
  } else {
    game.state.team2.rods.forEach((rod) => {
      rod.figures.forEach((figure) => {
        const dx = ball.x - rod.x;
        const dy = ball.y - figure.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < game.config.ballRadius + game.config.figureRadius) {
          // Ball hits the figure (circle-circle collision)
          const angle = Math.atan2(dy, dx);
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          ball.vx = -Math.abs(speed * Math.cos(angle));
          ball.vy = speed * Math.sin(angle);
          // Move ball out of collision
          const overlap =
            game.config.ballRadius + game.config.figureRadius - distance;
          ball.x += overlap * Math.cos(angle);
          ball.y += overlap * Math.sin(angle);
        }
      });
    });
  }
}

export function checkGoals(game, gameId) {
  const ball = game.state.ball;
  const { fieldWidth, fieldHeight, goalWidth, goalHeight, ballRadius } =
    game.config;
  const leftGoalX = goalWidth / 2;
  const rightGoalX = fieldWidth - goalWidth / 2;
  const goalTop = fieldHeight / 2 - goalHeight / 2;
  const goalBottom = fieldHeight / 2 + goalHeight / 2;

  let goalScored = false;

  // Check if ball is in goal area
  const ballInLeftGoal =
    ball.x < leftGoalX + ballRadius &&
    ball.y >= goalTop &&
    ball.y <= goalBottom;

  const ballInRightGoal =
    ball.x > rightGoalX - ballRadius &&
    ball.y >= goalTop &&
    ball.y <= goalBottom;

  // If ball is not in any goal area, reset the goal flag
  if (!ballInLeftGoal && !ballInRightGoal) {
    game.state.goalJustScored = false;
    return;
  }

  // If a goal was already scored this round, don't score again
  if (game.state.goalJustScored) {
    return;
  }

  if (ballInLeftGoal) {
    // Ball is in left goal - Team 2 scores
    game.state.team2.score += 1;
    goalScored = true;
    game.state.goalJustScored = true;

    // Update database

    if (game.status !== "replaying") {
      updateGameScoreInDatabase(
        gameId,
        game.state.team1.score,
        game.state.team2.score
      );

      GameAction.create({
        gameId,
        elapsedMs: Date.now() - game.startTime,
        frameNumber: game.frameCount,
        type: "goal",
        userId: null,
        data: {
          score1: game.state.team1.score,
          score2: game.state.team2.score,
        },
      });
    }

    // Check if game should end
    if (game.state.team2.score >= game.config.maxScore) {
      // Game over - Team 2 wins
      endGame(game, gameId);
      return; // Don't continue with celebration, game is over
    } else {
      // Pause the game for celebration
      if (game.status === "replaying") game.state.isPaused = true;
      else pauseGameForCelebration(game, gameId);
    }
  } else if (ballInRightGoal) {
    // Ball is in right goal - Team 1 scores
    game.state.team1.score += 1;
    goalScored = true;
    game.state.goalJustScored = true;

    if (game.status !== "replaying") {
      // Update database
      updateGameScoreInDatabase(
        gameId,
        game.state.team1.score,
        game.state.team2.score
      );
      GameAction.create({
        gameId,
        elapsedMs: Date.now() - game.startTime,
        frameNumber: game.frameCount,
        type: "goal",
        userId: null,
        data: {
          score1: game.state.team1.score,
          score2: game.state.team2.score,
        },
      });
    }

    // Check if game should end
    if (game.state.team1.score >= game.config.maxScore) {
      // Game over - Team 1 wins
      if (game.status !== "replaying") {
        endGame(game, gameId);
      }
      return; // Don't continue with celebration, game is over
    } else {
      // Pause the game for celebration
      if (game.status === "replaying") game.state.isPaused = true;
      else pauseGameForCelebration(game, gameId);
    }
  }

  // If a goal was scored and game didn't end, emit the updated game state
  if (goalScored && game.status !== "replaying") {
    // Emit to players
    io.to(`game-${gameId}`).emit("game.updated", {
      eventType: "goal_scored",
      gameState: {
        ball: game.state.ball,
        team1: {
          score: game.state.team1.score,
          rods: game.state.team1.rods,
        },
        team2: {
          score: game.state.team2.score,
          rods: game.state.team2.rods,
        },
      },
    });
  }
}

function pauseGameForCelebration(game, gameId) {
  // Pause the game
  game.state.isPaused = true;
  console.log(`Game ${gameId} paused for celebration after goal.`);

  // Clear any existing pause timer
  if (game.state.pauseTimer) {
    clearTimeout(game.state.pauseTimer);
  }

  // Set the ball velocity to 0 to stop it immediately
  game.state.ball.vx = 0;
  game.state.ball.vy = 0;

  // After 3 seconds (celebration complete), reset ball position and rods but keep it paused
  setTimeout(() => {
    // Use resetBall to reset ball to center and randomize velocity, but then set velocity to 0 (still paused)
    resetBall(game);

    // Reset rods to their default positions
    resetRodsToDefault(game);

    // Emit ball repositioned event to show the ball in center and rods reset
    io.to(`game-${gameId}`).emit("game.updated", {
      eventType: "ball_repositioned",
      gameState: {
        ball: game.state.ball,
        team1: {
          score: game.state.team1.score,
          rods: game.state.team1.rods,
        },
        team2: {
          score: game.state.team2.score,
          rods: game.state.team2.rods,
        },
      },
    });
  }, 3000);

  // Resume the game after 4 seconds total (3s celebration + 1s with ball visible but stationary)
  game.state.pauseTimer = setTimeout(async () => {
    game.state.isPaused = false;
    game.state.pauseTimer = null;

    const randomVelocity = getRandomBallVelocity();
    // Use resetBall to randomize ball direction and position
    resetBall(game, randomVelocity.vx, randomVelocity.vy);

    // Store the ball randomization event for replay
    try {
      if (game.status !== "replaying")
        await GameAction.create({
          gameId,
          elapsedMs: Date.now() - game.startTime,
          frameNumber: game.frameCount,
          type: "ball_reset",
          userId: null,
          data: {
            ball: { ...game.state.ball },
          },
        });
    } catch (error) {
      console.error(
        `Error recording ball randomization for game ${gameId}:`,
        error
      );
    }

    // Emit game resumed event
    io.to(`game-${gameId}`).emit("game.updated", {
      eventType: "game_resumed",
      gameState: {
        ball: game.state.ball,
        team1: {
          score: game.state.team1.score,
          rods: game.state.team1.rods,
        },
        team2: {
          score: game.state.team2.score,
          rods: game.state.team2.rods,
        },
      },
    });
  }, 4000);
}

function getRandomBallVelocity(ballSpeed = 5) {
  // Generate random angle that avoids purely vertical movement
  // Exclude angles that would make the ball go straight up/down
  const excludeVerticalZone = Math.PI / 3; // 60 degrees in radians

  let angle;
  if (Math.random() < 0.5) {
    // Left/right direction with some vertical component (±60°)
    angle = (Math.random() - 0.5) * 2 * excludeVerticalZone; // -60° to +60°
  } else {
    // Opposite direction (120° to 240°)
    angle = Math.PI + (Math.random() - 0.5) * 2 * excludeVerticalZone; // 120° to 240°
  }

  // Convert to velocity components using original ball speed (5)
  const vx = Math.cos(angle) * 5; // Use fixed speed of 5 instead of ballSpeed
  const vy = Math.sin(angle) * 5;

  return { vx, vy };
}

function resetBall(game, vx = 0, vy = 0) {
  // Basic reset logic after a goal
  game.state.ball.x = game.config.fieldWidth / 2;
  game.state.ball.y = game.config.fieldHeight / 2;
  game.state.ball.vx = vx;
  game.state.ball.vy = vy;
}

function resetRodsToDefault(game) {
  // Reset team1 rods to default positions (1-3-1-3 formation)
  // Rod 1 (1 figure)
  game.state.team1.rods[0].vy = 0;
  game.state.team1.rods[0].figures[0].y = 250;

  // Rod 2 (3 figures)
  game.state.team1.rods[1].vy = 0;
  game.state.team1.rods[1].figures[0].y = 125;
  game.state.team1.rods[1].figures[1].y = 250;
  game.state.team1.rods[1].figures[2].y = 375;

  // Rod 3 (1 figure)
  game.state.team1.rods[2].vy = 0;
  game.state.team1.rods[2].figures[0].y = 250;

  // Rod 4 (3 figures)
  game.state.team1.rods[3].vy = 0;
  game.state.team1.rods[3].figures[0].y = 125;
  game.state.team1.rods[3].figures[1].y = 250;
  game.state.team1.rods[3].figures[2].y = 375;

  // Reset team2 rods to default positions (3-1-3-1 formation)
  // Rod 1 (3 figures)
  game.state.team2.rods[0].vy = 0;
  game.state.team2.rods[0].figures[0].y = 125;
  game.state.team2.rods[0].figures[1].y = 250;
  game.state.team2.rods[0].figures[2].y = 375;

  // Rod 2 (1 figure)
  game.state.team2.rods[1].vy = 0;
  game.state.team2.rods[1].figures[0].y = 250;

  // Rod 3 (3 figures)
  game.state.team2.rods[2].vy = 0;
  game.state.team2.rods[2].figures[0].y = 125;
  game.state.team2.rods[2].figures[1].y = 250;
  game.state.team2.rods[2].figures[2].y = 375;

  // Rod 4 (1 figure)
  game.state.team2.rods[3].vy = 0;
  game.state.team2.rods[3].figures[0].y = 250;
}

export async function endGame(game, gameId) {
  if (game.status === "replaying") return;
  // Determine the winner
  const winner = game.state.team1.score > game.state.team2.score ? 1 : 2;

  // Emit game ended event to all players
  io.to(`game-${gameId}`).emit("game.updated", {
    eventType: "game_ended",
    gameState: {
      ball: game.state.ball,
      team1: {
        score: game.state.team1.score,
        rods: game.state.team1.rods,
      },
      team2: {
        score: game.state.team2.score,
        rods: game.state.team2.rods,
      },
      winner: winner,
      finalScore: {
        team1: game.state.team1.score,
        team2: game.state.team2.score,
      },
    },
  });

  // Notify spectators after 5 second delay to match the spectator buffer
  setTimeout(() => {
    io.to(`spectator-${gameId}`).emit("spectator.updated", {
      gameId,
      eventType: "game_ended",
      gameState: {
        ball: game.state.ball,
        rods: {
          team1: game.state.team1.rods,
          team2: game.state.team2.rods,
        },
        config: game.config,
        gameInfo: {
          score: {
            team1: game.state.team1.score,
            team2: game.state.team2.score,
          },
          winner: winner,
          gameEnded: true,
        },
      },
    });

    // Now cleanup spectator resources after end-game event is sent
    if (game.spectatorFunction) {
      clearInterval(game.spectatorFunction);
    }

    // Remove game from games map after spectators have received end-game event
    games.delete(gameId);
  }, 5000);

  // Update game status in database to "finished"
  try {
    await Game.update(
      {
        status: "finished",
      },
      {
        where: {
          gameId: gameId,
        },
      }
    );
  } catch (error) {
    console.error(`Error updating game status for game ${gameId}:`, error);
  }

  // Clear player-related game intervals immediately (but keep spectator interval running)
  if (game.gameFunction) {
    clearInterval(game.gameFunction);
  }
  if (game.updateFunction) {
    clearInterval(game.updateFunction);
  }
  if (game.state.pauseTimer) {
    clearTimeout(game.state.pauseTimer);
  }
  if (game.replayFunction) {
    clearInterval(game.replayFunction);
  }

  // Immediately remove players from this game to prevent new game creation issues
  try {
    // Get players before updating their gameId to null
    const playersInGame = await Player.findAll({
      where: {
        gameId: gameId,
      },
    });

    // Remove players from userToGameMap
    for (const player of playersInGame) {
      userToGameMap.delete(player.userId);
    }
  } catch (error) {
    console.error(`Error removing players from game ${gameId}:`, error);
  }

  // Game end action logging
  try {
    if (game.status !== "replaying")
      await GameAction.create({
        gameId,
        elapsedMs: Date.now() - game.startTime,
        frameNumber: game.frameCount,
        type: "game_ended",
        userId: null, // No specific user for game end
        data: {
          winner: winner,
          finalScore: {
            team1: game.state.team1.score,
            team2: game.state.team2.score,
          },
        },
      });
  } catch (error) {
    console.error(`Error recording game end action for game ${gameId}:`, error);
  }
}

export async function addNewGame(gameId, initialScores = null) {
  if (games.has(gameId)) {
    console.error(`Game with ID ${gameId} already exists.`);
    return;
  }

  // Create a deep copy of game defaults to ensure fresh state
  const gameDefaults = JSON.parse(JSON.stringify(GAME_DEFAULTS));

  // Set random initial ball velocity
  const randomVelocity = getRandomBallVelocity();
  gameDefaults.state.ball.vx = randomVelocity.vx;
  gameDefaults.state.ball.vy = randomVelocity.vy;

  // Ensure scores are always 0 for new games
  gameDefaults.state.team1.score = 0;
  gameDefaults.state.team2.score = 0;
  gameDefaults.state.goalJustScored = false;

  // If initial scores are provided, use them instead of defaults
  if (initialScores) {
    gameDefaults.state.team1.score = initialScores.team1 || 0;
    gameDefaults.state.team2.score = initialScores.team2 || 0;
  }

  games.set(gameId, {
    ...gameDefaults,
    frameCount: 0,
    gameFunction: setInterval(() => gameFunction(gameId), 1000 / 60),
    updateFunction: setInterval(() => updateFunction(gameId), 1000 / 30),
    spectatorFunction: setInterval(
      () => spectatorUpdateFunction(gameId),
      spectatorService.SNAPSHOT_INTERVAL
    ),
    replayFunction: setInterval(() => replayUpdateFunction(gameId), 5000),
    startTime: Date.now(),
  });

  // Record game start action for replay
  try {
    await GameAction.create({
      gameId,
      elapsedMs: 0,
      frameNumber: 0,
      type: "game_start",
      userId: null,
      data: gameDefaults,
    });
  } catch (error) {
    console.error(
      `Error recording game start action for game ${gameId}:`,
      error
    );
  }
}

export const GAME_DEFAULTS = {
  config: {
    fieldWidth: 1200,
    fieldHeight: 500,
    goalWidth: 20,
    goalHeight: 200,
    rodWidth: 6,
    rodHeight: 500,
    ballRadius: 10,
    figureRadius: 12,
    maxScore: 5,
    rodSpeed: 5,
    ballSpeed: 10,
  },
  state: {
    isPaused: false,
    pauseTimer: null,
    goalJustScored: false,
    ball: {
      x: 600,
      y: 250,
      vx: -5,
      vy: 0,
    },
    team1: {
      score: 0,
      rods: [
        {
          x: 100,
          vy: 0,
          figureCount: 1,
          figures: [
            {
              y: 250,
            },
          ],
        },
        {
          x: 200,
          vy: 0,
          figureCount: 3,
          figures: [
            {
              y: 125,
            },
            {
              y: 250,
            },
            {
              y: 375,
            },
          ],
        },
        {
          x: 300,
          vy: 0,
          figureCount: 1,
          figures: [
            {
              y: 250,
            },
          ],
        },
        {
          x: 400,
          vy: 0,
          figureCount: 3,
          figures: [
            {
              y: 125,
            },
            {
              y: 250,
            },
            {
              y: 375,
            },
          ],
        },
      ],
    },
    team2: {
      score: 0,
      rods: [
        {
          x: 800,
          vy: 0,
          figureCount: 3,
          figures: [
            {
              y: 125,
            },
            {
              y: 250,
            },
            {
              y: 375,
            },
          ],
        },
        {
          x: 900,
          vy: 0,
          figureCount: 1,
          figures: [
            {
              y: 250,
            },
          ],
        },
        {
          x: 1000,
          vy: 0,
          figureCount: 3,
          figures: [
            {
              y: 125,
            },
            {
              y: 250,
            },
            {
              y: 375,
            },
          ],
        },
        {
          x: 1100,
          vy: 0,
          figureCount: 1,
          figures: [
            {
              y: 250,
            },
          ],
        },
      ],
    },
  },
};

// Function to update game scores in the database
async function updateGameScoreInDatabase(gameId, team1Score, team2Score) {
  try {
    const game = await Game.findOne({
      where: {
        gameId: gameId,
      },
    });

    if (!game) {
      console.error(`Game with ID ${gameId} not found in database.`);
      return;
    }

    if (game.status === "replaying") {
      return;
    }

    game.score1 = team1Score;
    game.score2 = team2Score;
    await game.save();
  } catch (error) {
    console.error(
      `Error updating game score in database for game ${gameId}:`,
      error
    );
  }
}
