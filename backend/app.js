import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { sequelize } from "./datasource.js";
import { authRouter } from "./routes/auth_router.js";
import { checkoutRouter } from "./routes/checkout_router.js";

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    credentials: true,
  }),
);
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

// Routes here
app.use("/api/auth", authRouter);
app.use("/api/checkout", checkoutRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
