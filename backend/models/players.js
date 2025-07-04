import { sequelize } from "../datasource.js";
import { DataTypes, ValidationError } from "sequelize";
import { User } from "./users.js";
import { Game } from "./game.js";

export const Player = sequelize.define(
  "player",
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    gameId: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    team: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isIn: {
          args: [[1, 2]],
          msg: "Team must be either 1 or 2",
        },
      },
    },
  },
  {
    hooks: {
      beforeCreate: async (player, options) => {
        // Check if user already has a game in progress
        const existingPlayer = await Player.findOne({
          where: {
            userId: player.userId,
          },
          include: [
            {
              model: Game,
              where: {
                status: "in_progress",
              },
            },
          ],
        });

        if (existingPlayer) {
          throw new ValidationError(
            "Player can only have one game in progress at a time",
          );
        }
      },
    },
  },
);

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
