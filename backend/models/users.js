import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";

export const User = sequelize.define(
  "user",
  {
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    avatar: {
      type: DataTypes.STRING,
    },
    provider: {
      type: DataTypes.ENUM,
      values: ["github"],
      allowNull: false,
    },
    providerUserId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      unique: true,
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      unique: true,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["provider", "providerUserId"],
      },
    ],
  },
);
