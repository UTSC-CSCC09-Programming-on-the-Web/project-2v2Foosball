import { io } from "../app.js";
import { spectatorService } from "./spectator.js";
import { Game } from "../models/game.js";

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

  updateGamePhysics(game);
  checkBounds(game);
  checkCollisions(game);
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
    },
  });
}

function updateRods(game, team) {
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

function updateGamePhysics(game) {
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

function checkBounds(game) {
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

function checkCollisions(game) {
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

function checkGoals(game, gameId) {
  const ball = game.state.ball;
  const { fieldWidth, fieldHeight, goalWidth, goalHeight, ballRadius } =
    game.config;
  const leftGoalX = goalWidth / 2;
  const rightGoalX = fieldWidth - goalWidth / 2;
  const goalTop = fieldHeight / 2 - goalHeight / 2;
  const goalBottom = fieldHeight / 2 + goalHeight / 2;

  let goalScored = false;

  if (
    ball.x < leftGoalX + ballRadius &&
    ball.y >= goalTop &&
    ball.y <= goalBottom
  ) {
    // Ball is in left goal - Team 2 scores
    game.state.team2.score += 1;
    goalScored = true;

    // Update database
    updateGameScoreInDatabase(
      gameId,
      game.state.team1.score,
      game.state.team2.score,
    );

    // Pause the game for celebration
    pauseGameForCelebration(game, gameId);
  } else if (
    ball.x > rightGoalX - ballRadius &&
    ball.y >= goalTop &&
    ball.y <= goalBottom
  ) {
    // Ball is in right goal - Team 1 scores
    game.state.team1.score += 1;
    goalScored = true;

    // Update database
    updateGameScoreInDatabase(
      gameId,
      game.state.team1.score,
      game.state.team2.score,
    );

    // Pause the game for celebration
    pauseGameForCelebration(game, gameId);
  }

  // If a goal was scored, immediately emit the updated game state
  if (goalScored) {
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

  // Clear any existing pause timer
  if (game.state.pauseTimer) {
    clearTimeout(game.state.pauseTimer);
  }

  // Set the ball velocity to 0 to stop it immediately
  game.state.ball.vx = 0;
  game.state.ball.vy = 0;

  // After 3 seconds (celebration complete), reset ball position and rods but keep it paused
  setTimeout(() => {
    // Reset ball to center position but with no velocity (still paused)
    game.state.ball.x = game.config.fieldWidth / 2;
    game.state.ball.y = game.config.fieldHeight / 2;
    game.state.ball.vx = 0;
    game.state.ball.vy = 0;

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
  game.state.pauseTimer = setTimeout(() => {
    game.state.isPaused = false;
    game.state.pauseTimer = null;

    // Give the ball initial random velocity to start the game
    const randomVelocity = getRandomBallVelocity();
    game.state.ball.vx = randomVelocity.vx;
    game.state.ball.vy = randomVelocity.vy;

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
  // Use angles between -60° to 60° and 120° to 240° (in radians)
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

function resetBall(game) {
  if (
    game.state.team1.score >= game.config.maxScore ||
    game.state.team2.score >= game.config.maxScore
  ) {
    // Reset scores if max score is reached
    endGame(game);
  }
  // Basic reset logic after a goal
  game.state.ball.x = game.config.fieldWidth / 2;
  game.state.ball.y = game.config.fieldHeight / 2;

  // Set random velocity direction
  const randomVelocity = getRandomBallVelocity();
  game.state.ball.vx = randomVelocity.vx;
  game.state.ball.vy = randomVelocity.vy;
}

function resetRodsToDefault(game) {
  // Reset team1 rods to default positions
  game.state.team1.rods[0].vy = 0;
  game.state.team1.rods[0].figures[0].y = 250;

  game.state.team1.rods[1].vy = 0;
  game.state.team1.rods[1].figures[0].y = 100;
  game.state.team1.rods[1].figures[1].y = 250;
  game.state.team1.rods[1].figures[2].y = 400;

  // Reset team2 rods to default positions
  game.state.team2.rods[0].vy = 0;
  game.state.team2.rods[0].figures[0].y = 100;
  game.state.team2.rods[0].figures[1].y = 250;
  game.state.team2.rods[0].figures[2].y = 400;

  game.state.team2.rods[1].vy = 0;
  game.state.team2.rods[1].figures[0].y = 250;
}

function endGame(game) {
  // TODO: End game logic
}
export function addNewGame(gameId, initialScores = null) {
  if (games.has(gameId)) {
    console.error(`Game with ID ${gameId} already exists.`);
    return;
  }

  const gameDefaults = { ...GAME_DEFAULTS };

  // Set random initial ball velocity
  const randomVelocity = getRandomBallVelocity();
  gameDefaults.state.ball.vx = randomVelocity.vx;
  gameDefaults.state.ball.vy = randomVelocity.vy;

  // If initial scores are provided, use them instead of defaults
  if (initialScores) {
    gameDefaults.state.team1.score = initialScores.team1 || 0;
    gameDefaults.state.team2.score = initialScores.team2 || 0;
    console.log(
      `Initializing game ${gameId} with scores: Team1=${initialScores.team1}, Team2=${initialScores.team2}`,
    );
  }

  games.set(gameId, {
    ...gameDefaults,
    gameFunction: setInterval(() => gameFunction(gameId), 1000 / 60),
    updateFunction: setInterval(() => updateFunction(gameId), 1000 / 30),
    spectatorFunction: setInterval(
      () => spectatorUpdateFunction(gameId),
      spectatorService.SNAPSHOT_INTERVAL,
    ),
  });
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
          x: 300,
          vy: 0,
          figureCount: 3,
          figures: [
            {
              y: 100,
            },
            {
              y: 250,
            },
            {
              y: 400,
            },
          ],
        },
      ],
    },
    team2: {
      score: 0,
      rods: [
        {
          x: 900,
          vy: 0,
          figureCount: 3,
          figures: [
            {
              y: 100,
            },
            {
              y: 250,
            },
            {
              y: 400,
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
    await Game.update(
      {
        score1: team1Score,
        score2: team2Score,
      },
      {
        where: {
          gameId: gameId,
        },
      },
    );
  } catch (error) {
    console.error(
      `Error updating game score in database for game ${gameId}:`,
      error,
    );
  }
}
