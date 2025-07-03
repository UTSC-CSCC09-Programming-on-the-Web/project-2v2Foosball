import { isAuth } from "../middlewares/auth.js";
import { queue } from "../data/queue_data.js";
import { Router } from "express";

export const queueRouter = Router();

const game_size = 4; // Number of players needed to create a game

// Get the queue
queueRouter.get("/", isAuth, (req, res) => {
  res.status(200).json({ queue });
});

// Check if user is in the queue
queueRouter.get("/userInQueue", isAuth, (req, res) => {
  const user = req.user;
  const isInQueue = queue.some((u) => u.userId === user.userId);
  return res.status(200).json({ isInQueue });
});
