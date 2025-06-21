import { isAuth } from "../middlewares/auth.js";
import { Router } from "express";

export const queueRouter = Router();

const queue = [];

//  Routes
// Check if user is in the queue
queueRouter.get("/userInQueue", isAuth, (req, res) => {
  console.log("Running");

  const user = req.user;
  const isInQueue = queue.some((u) => u.userId === user.userId);
  return res.status(200).json({ isInQueue });
});

//  Add a user
queueRouter.post("/add", isAuth, (req, res) => {
  const user = req.user;
  if (!queue.find((u) => u.userId === user.userId)) {
    queue.push(user);

    console.log(
      `User ${user.userId} added to queue. Current queue length: ${queue.length}`,
    );
    console.log(`Current queue: ${JSON.stringify(queue, null, 2)}`);

    res.status(200).json({ message: "User added to queue", user });
  } else {
    console.log(
      `User ${user.userId} is already in the queue. Current queue length: ${queue.length}`,
    );
    res.status(422).json({ message: "User is already in the queue" });
  }
});

// Remove a user
queueRouter.post("/remove", isAuth, (req, res) => {
  const userId = req.user.userId;
  const idx = queue.findIndex((u) => u.userId === userId);
  if (idx !== -1) {
    queue.splice(idx, 1);
    res.status(200).json({ message: "User removed from queue" });
  } else {
    res.status(404).json({ message: "User not found in the queue" });
  }
});

// Get the queue
queueRouter.get("/", isAuth, (req, res) => {
  res.status(200).json(queue);
});

// Create a game with the first 4 players in the queue
queueRouter.post("/create-game", isAuth, (req, res) => {
  if (queue.length < 4) {
    return res.status(422).json({ message: "Not enough players in the queue" });
  }
  const players = queue.splice(0, 4);
  // Here you would typically create a game with these players
  // TODO: Create game state and model
  // For now, we just return the players
  res.status(200).json({ message: "Game created", players });
});
