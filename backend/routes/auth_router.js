import express from "express";
import jwt from "jsonwebtoken";

import { passport } from "../passport.js";
import {
  doubleCsrfProtection,
  generateCsrfToken,
  isAuth,
  isAuthWithoutSubscription,
} from "../middlewares/auth.js";
import { User } from "../models/users.js";
import {
  MOCK_USER,
  MOCK_USER_2,
  MOCK_USER_3,
  MOCK_USER_4,
} from "../data/mock.js";

export const authRouter = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      name: user.name,
      avatar: user.avatar,
    },
    process.env.JWT_SIGNING_KEY,
    {
      expiresIn: "7d",
    }
  );
}

// Route to initiate Github OAuth
// Frontend redirects to this endpoint
// authRouter.get(
//   "/github",
//   passport.authenticate("github", {
//     scope: ["user:email"],
//     session: false,
//   })
// );

// Callback for Github OAuth
authRouter.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: false,
  }),
  async (req, res) => {
    const token = signToken(req.user);
    // Set the JWT token in an HTTP-only cookie
    res.cookie("authtoken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: new URL(process.env.BACKEND_URL).hostname,
    });

    // NOTE: Set the authtoken for this request so that CSRF token can be generated
    req.cookies.authtoken = token;
    generateCsrfToken(req, res);

    return res.redirect(`${process.env.FRONTEND_URL}`);
  }
);

authRouter.post("/mock", (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "Wrong place." });
  }

  const token = signToken(MOCK_USER);

  res.cookie("authtoken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: new URL(process.env.BACKEND_URL).hostname,
  });

  req.cookies.authtoken = token;
  generateCsrfToken(req, res);

  return res.json({ message: "Mock user logged in successfully" });
});

authRouter.post("/mock2", (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "Wrong place." });
  }

  const token = signToken(MOCK_USER_2);

  res.cookie("authtoken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: new URL(process.env.BACKEND_URL).hostname,
  });

  req.cookies.authtoken = token;
  generateCsrfToken(req, res);

  return res.json({ message: "Mock user 2 logged in successfully" });
});

authRouter.post("/mock3", (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "Wrong place." });
  }

  const token = signToken(MOCK_USER_3);

  res.cookie("authtoken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: new URL(process.env.BACKEND_URL).hostname,
  });

  return res.json({ message: "Mock user 3 logged in successfully" });
});

authRouter.post("/mock4", (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "Wrong place." });
  }

  const token = signToken(MOCK_USER_4);

  res.cookie("authtoken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: new URL(process.env.BACKEND_URL).hostname,
  });

  return res.json({ message: "Mock user 4 logged in successfully" });
});

authRouter.get("/me", isAuth, async (req, res) => {
  console.log(req.user.userId, MOCK_USER.userId);
  if (
    process.env.NODE_ENV === "development" &&
    req.user.userId === MOCK_USER.userId
  ) {
    return res.json({
      ...MOCK_USER,
      active: true, // Mock user is always active
    });
  }

  if (
    process.env.NODE_ENV === "development" &&
    req.user.userId === MOCK_USER_2.userId
  ) {
    return res.json({
      ...MOCK_USER_2,
      active: true, // Mock user 2 is always active
    });
  }

  if (
    process.env.NODE_ENV === "development" &&
    req.user.userId === MOCK_USER_3.userId
  ) {
    return res.json({
      ...MOCK_USER_3,
      active: true, // Mock user 3 is always active
    });
  }

  if (
    process.env.NODE_ENV === "development" &&
    req.user.userId === MOCK_USER_4.userId
  ) {
    return res.json({
      ...MOCK_USER_4,
      active: true, // Mock user 4 is always active
    });
  }

  const user = await User.findByPk(req.user.userId);

  res.json({
    userId: req.user.userId,
    name: req.user.name,
    avatar: req.user.avatar,
    active: user.active,
  });
});

authRouter.post("/logout", isAuth, doubleCsrfProtection, (req, res) => {
  // Clear the HTTP-only cookie
  res.clearCookie("authtoken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: new URL(process.env.BACKEND_URL).hostname,
  });
  res.clearCookie("xsrf-token", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: new URL(process.env.FRONTEND_URL).hostname,
  });

  res.json({ message: "Logged out successfully" });
});
