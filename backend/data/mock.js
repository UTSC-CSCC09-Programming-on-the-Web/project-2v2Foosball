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

export const MOCK_USER_3 = {
  userId: "b2c3d4e5-6789-0123-4567-890123456789",
  name: "Mock User 3",
  avatar: null,
};

export const MOCK_USER_4 = {
  userId: "c3d4e5f6-7890-1234-5678-901234567890",
  name: "Mock User 4",
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
      active: true,
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
      active: true,
    });
  });

  // Setup third mock user
  User.findByPk(MOCK_USER_3.userId).then((user) => {
    if (user) {
      console.log("Mock user 3 already exists, skipping creation.");
      return;
    }

    User.create({
      userId: MOCK_USER_3.userId,
      name: MOCK_USER_3.name,
      email: "example3@gmail.com",
      provider: "github",
      providerUserId: "mock3",
    });
  });

  // Setup fourth mock user
  User.findByPk(MOCK_USER_4.userId).then((user) => {
    if (user) {
      console.log("Mock user 4 already exists, skipping creation.");
      return;
    }

    User.create({
      userId: MOCK_USER_4.userId,
      name: MOCK_USER_4.name,
      email: "example4@gmail.com",
      provider: "github",
      providerUserId: "mock4",
    });
  });
};
