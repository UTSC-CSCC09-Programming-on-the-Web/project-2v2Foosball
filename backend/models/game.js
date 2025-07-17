import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";

export const Game = sequelize.define("game", {
  gameId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  status: {
    type: DataTypes.ENUM,
    values: ["in_progress", "finished"],
    defaultValue: "in_progress",
  },
  score1: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  score2: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});
