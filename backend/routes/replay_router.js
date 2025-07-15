import { Router } from "express";
import { Player } from "../models/players.js";
import { Game } from "../models/game.js";
import { GameAction } from "../models/game_actions.js";

export const replayRouter = Router();

// Returns paginated game history for a user
replayRouter.get("/:userId", async (req, res) => {

  const { userId } = req.params;
  const page = parseInt(req.query.page) || 0;
  const limit = 5;
  const offset = page * limit;

  try {
    const gamesWithReplays = await Game.findAll({
      where: { status: "finished" },
      include: [
        {
          model: Player,
          where: { userId },
        },
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    console.log("Games fetched:", gamesWithReplays);

    return res.status(200).json({ replays: gamesWithReplays });
  } catch (error) {
    console.error("Error fetching game history:", error);
    return res.status(500).json({ error: "Internal server error" });
}
});

// Fetch actions for a specific gameId
replayRouter.get("/actions/:gameId", async (req, res) => {
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

// Stores a new game action
// replayRouter.post("/action", async (req, res) => {
//   const { gameId, elapsedMs, type, userId, data } = req.body;
//   try {
//     const action = await GameAction.create({
//       gameId,
//       elapsedMs,
//       type,
//       userId,
//       data,
//     });
//     return res.status(201).json(action);
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// });



