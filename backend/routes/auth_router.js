import express from "express";
import jwt from "jsonwebtoken";

import { passport } from "../passport.js";
import { stripe } from "../stripe.js";
import { isAuth } from "../middlewares/auth.js";

export const authRouter = express.Router();

// Route to initiate Github OAuth
// Frontend redirects to this endpoint
authRouter.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  }),
);

// Callback for Github OAuth
authRouter.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: false,
  }),
  async (req, res) => {
    const token = jwt.sign(
      {
        userId: req.user.userId,
        name: req.user.name,
        avatar: req.user.avatar,
        stripeSubscriptionId: req.user.stripeSubscriptionId,
      },
      process.env.JWT_SIGNING_KEY,
      {
        expiresIn: "7d",
      },
    );
    // Set the JWT token in an HTTP-only cookie
    res.cookie("authtoken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: new URL(process.env.BACKEND_URL).hostname,
    });
    return res.redirect(`${process.env.FRONTEND_URL}`);
  },
);

authRouter.get("/me", isAuth, async (req, res) => {
  const subscription = req.user.stripeSubscriptionId
    ? await stripe.subscriptions.retrieve(req.user.stripeSubscriptionId)
    : null;

  res.json({
    userId: req.user.userId,
    name: req.user.name,
    avatar: req.user.avatar,
    active: subscription && subscription.status === "active",
  });
});

authRouter.post("/logout", isAuth, (req, res) => {
  // Clear the HTTP-only cookie
  res.clearCookie("authtoken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: new URL(process.env.FRONTEND_URL).hostname,
  });

  res.json({ message: "Logged out successfully" });
});
