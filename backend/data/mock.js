import { User } from "../models/users.js";

export const MOCK_USER = {
  userId: "f7ce258b-9598-4036-a17e-b132d07b9fa5",
  name: "Mock User",
  avatar: null,
};

export const setupMockUsers = () => {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Mock users can only be set up in development mode.");
  }
  User.findByPk(MOCK_USER.userId).then((user) => {
    if (user) {
      console.log("Mock user already exists, skipping creation.");
      return;
    }

    User.create({
      userId: MOCK_USER.userId,
      name: MOCK_USER.name,
      email: "example@gmail.com",
      provider: "github",
      providerUserId: "mock",
    });
  });
};
