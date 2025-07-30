import { Router } from "express";
import { spectatorService } from "../data/spectator.js";
import { Game } from "../models/game.js";
import { Player } from "../models/players.js";
import { User } from "../models/users.js";
import { isAuth } from "../middlewares/auth.js";

export const spectatorRouter = Router();

// Get all active games that can be spectated
spectatorRouter.get("/active-games", isAuth, async (req, res) => {
  try {
    const activeGames = await Game.findAll({
      where: {
        status: "in_progress",
      },
      include: [
        {
          model: Player,
          include: [
            {
              model: User,
              attributes: ["name", "avatar"],
            },
          ],
        },
      ],
    });

    const gamesWithSpectatorData = activeGames.map((game) => {
      const players = game.players;
      const team1Players = players.filter((p) => p.team === 1);
      const team2Players = players.filter((p) => p.team === 2);

      return {
        gameId: game.gameId,
        status: game.status,
        createdAt: game.createdAt,
        score: {
          team1: game.score1,
          team2: game.score2,
        },
        players: {
          team1: team1Players.map((p) => ({
            userId: p.userId,
            name: p.user.name,
            avatar: p.user.avatar,
          })),
          team2: team2Players.map((p) => ({
            userId: p.userId,
            name: p.user.name,
            avatar: p.user.avatar,
          })),
        },
        spectatorCount: spectatorService.getSpectatorCount(game.gameId),
      };
    });

    res.json(gamesWithSpectatorData);
  } catch (error) {
    console.error("Error fetching active games:", error);
    res.status(500).json({ error: "Failed to fetch active games" });
  }
});
