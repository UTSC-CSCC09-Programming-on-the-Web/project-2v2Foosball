import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

import { sequelize } from "./datasource.js";
import { authRouter } from "./routes/auth_router.js";
import { checkoutRouter } from "./routes/checkout_router.js";
import { webhookRouter } from "./routes/webhook_router.js";
import { queueRouter } from "./routes/queue_router.js";
import { gameRouter } from "./routes/game_router.js";
import { spectatorRouter } from "./routes/spectator_router.js";
import { replayRouter } from "./routes/replay_router.js";
import { registerIOListeners } from "./sockets/index.js";
import { isAuthSocket } from "./middlewares/auth.js";

import { Game } from "./models/game.js";
import { addNewGame } from "./data/game_data.js";
import { setupMockUsers } from "./data/mock.js";

const app = express();
const httpServer = http.createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    credentials: true,
  },
});

// Socket authentication middleware
io.use(isAuthSocket);
registerIOListeners(io);

// Pass io to routers that need it
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:4200"],
    credentials: true,
  })
);
app.use("/api/webhook", webhookRouter); // has to be before express.json() is applied
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: { drop: false } });
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}
// Insert mock users
if (process.env.NODE_ENV === "development") {
  setupMockUsers();
}
// When the server is restarted, the array of ongoing games is cleared.
// TODO: After replaying is implemented, we should have a way to restore the game states.
Game.findAll({
  where: {
    status: "in_progress",
  },
}).then((gs) => {
  gs.forEach((game) => {
    console.log(
      "Restoring game:",
      game.dataValues.gameId,
      "with scores:",
      game.dataValues.score1,
      "-",
      game.dataValues.score2
    );
    addNewGame(game.dataValues.gameId, {
      team1: game.dataValues.score1,
      team2: game.dataValues.score2,
    });
  });
});

// Routes here
app.use("/api/auth", authRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/queue", queueRouter);
app.use("/api/game", gameRouter);
app.use("/api/spectator", spectatorRouter);
app.use("/api/replays", replayRouter);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log("Server running"));
