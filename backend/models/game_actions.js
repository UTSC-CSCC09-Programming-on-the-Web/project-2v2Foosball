import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { Game } from "./game.js";

export const GameAction = sequelize.define(
  "game_action",
  {
    actionId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    gameId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    elapsedMs: {
      type: DataTypes.INTEGER,
      allowNull: false, // milliseconds from game start
    },
    type: {
      type: DataTypes.ENUM,
      values: ['game_start', 'player_input_start', 'player_input_end', 'goal', 'game_ended', 'ball_reset'],
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true, // optional: for additional action data if needed
    },
  },
  {
    indexes: [
      { fields: ["gameId"] },
      { fields: ["elapsedMs"] },
    ],
  }
);

Game.hasMany(GameAction, {
  foreignKey: "gameId",
  sourceKey: "gameId",
});

GameAction.belongsTo(Game, {
  foreignKey: "gameId",
  targetKey: "gameId",
});