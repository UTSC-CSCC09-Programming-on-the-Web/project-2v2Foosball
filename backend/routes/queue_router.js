import { isAuth } from "../middlewares/auth.js";
import { Router } from "express";

export const queueRouter = Router();

const queue = [];
const game_size = 4; // Number of players needed to create a game

//  Routes - Queue Management
//  Add a user
queueRouter.post("/add", isAuth, (req, res) => {
  const user = req.user;
  if (queue.find((u) => u.userId === user.userId)) {
    return res.status(409).json({ message: "User already in queue" });
  }

  // Add user to the queue
  queue.push(user);
  req.io.emit("queue.update", queue);
  res.status(200).json({ message: "User added to queue", user });
});

// Remove a user
queueRouter.post("/remove", isAuth, (req, res) => {
  const user = req.user;
  const index = queue.findIndex((u) => u.userId === user.userId);

  if (index === -1) {
    return res.status(404).json({ message: "User not found in queue" });
  }

  // Remove user from the queue
  queue.splice(index, 1);
  req.io.emit("queue.update", queue);
  res.status(200).json({ message: "User removed from queue", user });
});

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

// Create a game with the first 4 players in the queue
queueRouter.post("/create-game", isAuth, (req, res) => {
  if (queue.length < game_size) {
    return res.status(422).json({ message: "Not enough players in the queue" });
  }
  const players = queue.splice(0, game_size);
  // Emit queue update after removing players for game creation
  req.io.emit("queue.update", queue);
  // Here you would typically create a game with these players
  // TODO: Create game state and model
  // For now, we just return the players
  res.status(200).json({ message: "Game created", players });
});
