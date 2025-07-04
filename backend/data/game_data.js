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
      vx: 0,
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
