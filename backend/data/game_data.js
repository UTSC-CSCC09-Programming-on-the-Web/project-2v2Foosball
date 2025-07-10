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

    resetBall(game);
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

    resetBall(game);
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
  game.state.ball.vx = -5;
  game.state.ball.vy = 0;
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
