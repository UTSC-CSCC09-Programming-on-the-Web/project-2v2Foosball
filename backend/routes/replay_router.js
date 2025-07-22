import { Router } from "express";
import { Player } from "../models/players.js";
import { Game } from "../models/game.js";
import { GameAction } from "../models/game_actions.js";
import { Op } from "sequelize";
import { User } from "../models/users.js";

export const replayRouter = Router();

// Returns paginated game history for a user
replayRouter.get("/:userId", isAuth, async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 0;
  const limit = 5;
  const offset = page * limit;

  try {
    const gameIds = await Player.findAll({
      where: { userId },
      attributes: ["gameId"],
    });

    const gamesWithReplays = await Game.findAll({
      where: {
        [Op.and]: [
          {
            status: "finished",
          },
          {
            gameId: {
              [Op.in]: gameIds.map((g) => g.gameId),
            },
          },
        ],
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
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    console.log("Games fetched:", gamesWithReplays.length);

    return res.status(200).json(
      gamesWithReplays.map((game) => ({
        gameId: game.gameId,
        status: game.status,
        createdAt: game.createdAt,
        score: {
          team1: game.score1,
          team2: game.score2,
        },
        players: {
          team1: game.players
            .filter((p) => p.team === 1)
            .map((p) => ({
              userId: p.userId,
              name: p.user.name,
              avatar: p.user.avatar,
            })),
          team2: game.players
            .filter((p) => p.team === 2)
            .map((p) => ({
              userId: p.userId,
              name: p.user.name,
              avatar: p.user.avatar,
            })),
        },
      })),
    );
  } catch (error) {
    console.error("Error fetching game history:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch actions for a specific gameId
replayRouter.get("/actions/:gameId", isAuth, async (req, res) => {
  const { gameId } = req.params;

  try {
    const actions = await GameAction.findAll({
      where: { gameId },
      order: [["elapsedMs", "ASC"]],
    });

    if (!actions.length) {
      return res.status(404).json({ error: "No actions found for this game" });
    }

    return res.status(200).json(actions);
  } catch (error) {
    console.error("Error fetching game actions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
