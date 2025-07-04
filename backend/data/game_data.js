import { io } from "../app.js";

export const userToGameMap = new Map();

// Maps gameId to game objects
export const games = new Map();

function gameFunction(gameId) {
  // TODO: update ball position

  const game = games.get(gameId);
  if (!game) {
    console.error(`Game with ID ${gameId} not found.`);
    return;
  }

  updateGamePhysics(game);
  checkBounds(game);
  checkCollisions(game);
  checkGoals(game);

  updateRods(game, 1);
  updateRods(game, 2);
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
      team1: game.state.team1.score,
      team2: game.state.team2.score,
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
  }

  const xCheck = reflect(ball.x, ball.vx, ballRadius, fieldWidth);
  const yCheck = reflect(ball.y, ball.vy, ballRadius, fieldHeight);

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
          const overlap = game.config.ballRadius + game.config.figureRadius - distance;
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
          const overlap = game.config.ballRadius + game.config.figureRadius - distance;
          ball.x += overlap * Math.cos(angle);
          ball.y += overlap * Math.sin(angle);
        }
      });
    });
  }
}

function checkGoals(game) {
  // TODO: Check if the ball is in the goal area and update scores
}

function resetBall(game) {
  // TODO: Reset ball properly/game state properly
}

export function addNewGame(gameId) {
  if (games.has(gameId)) {
    console.error(`Game with ID ${gameId} already exists.`);
    return;
  }

  games.set(gameId, {
    ...GAME_DEFAULTS,
    gameFunction: setInterval(() => gameFunction(gameId), 1000 / 60),
    updateFunction: setInterval(() => updateFunction(gameId), 1000 / 10),
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
