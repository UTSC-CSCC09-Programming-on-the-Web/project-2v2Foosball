import { isAuth } from "../middlewares/auth.js";
import { Router } from "express";
import { Player } from "../models/players.js";
import { Game } from "../models/game.js";
import { games, userToGameMap } from "../data/game_data.js";

export const gameRouter = Router();

// If the user is in a game, return the game state
gameRouter.get("/", isAuth, async (req, res) => {
  const user = req.user;
  const player = await Player.findOne({
    where: {
      userId: user.userId,
    },
    include: [
      {
        model: Game,
        where: {
          status: "in_progress",
        },
      },
    ],
  });
  if (player) {
    const game = games.get(player.gameId);
    if (game) {
      // Get the database record to ensure we have the latest scores
      const dbGame = await Game.findByPk(player.gameId);

      return res.status(200).json({
        config: game.config,
        state: {
          ...game.state,
          team1: {
            ...game.state.team1,
            score: dbGame.score1, // Use database score
          },
          team2: {
            ...game.state.team2,
            score: dbGame.score2, // Use database score
          },
        },
        meta: {
          team: player.team,
          activeRod: 1,
        },
      });
    } else {
      console.error(`Game with ID ${player.gameId} not found.`);
      return res.status(404).json({ error: "Game not found." });
    }
  } else {
    return res.status(404).json({ error: "User is not in a game." });
  }
});
