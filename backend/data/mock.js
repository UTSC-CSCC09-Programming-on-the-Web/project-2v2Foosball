import { User } from "../models/users.js";

export const MOCK_USER = {
  userId: "f7ce258b-9598-4036-a17e-b132d07b9fa5",
  name: "Mock User",
  avatar: null,
};

export const MOCK_USER_2 = {
  userId: "a1b2c3d4-5678-9012-3456-789012345678",
  name: "Mock User 2",
  avatar: null,
};

export const setupMockUsers = () => {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Mock users can only be set up in development mode.");
  }

  // Setup first mock user
  User.findByPk(MOCK_USER.userId).then((user) => {
    if (user) {
      console.log("Mock user 1 already exists, skipping creation.");
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

  // Setup second mock user
  User.findByPk(MOCK_USER_2.userId).then((user) => {
    if (user) {
      console.log("Mock user 2 already exists, skipping creation.");
      return;
    }

    User.create({
      userId: MOCK_USER_2.userId,
      name: MOCK_USER_2.name,
      email: "example2@gmail.com",
      provider: "github",
      providerUserId: "mock2",
    });
  });
};
