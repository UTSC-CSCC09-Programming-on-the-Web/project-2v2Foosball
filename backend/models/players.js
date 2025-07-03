import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { User } from "./users.js";
import { Game } from "./game.js";

export const Player = sequelize.define("player", {
  userId: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  gameId: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
});

Player.belongsTo(User, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  targetKey: "userId",
});
User.hasMany(Player, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  sourceKey: "userId",
});

Player.belongsTo(Game, {
  foreignKey: {
    name: "gameId",
    allowNull: false,
  },
  targetKey: "gameId",
});
Game.hasMany(Player, {
  foreignKey: {
    name: "gameId",
    allowNull: false,
  },
  sourceKey: "gameId",
});
