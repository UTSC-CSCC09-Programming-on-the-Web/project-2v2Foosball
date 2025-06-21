import express from "express";
import passport from "passport";
import GitHubStrategy from "passport-github2";
import jwt from "jsonwebtoken";

import { User } from "../models/users.js";
import { isAuth } from "../middlewares/auth.js";

export const authRouter = express.Router();

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.OAUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.OAUTH_GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/github/callback`,
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        const user = await User.findOrCreate({
          where: {
            provider: "github",
            providerUserId: profile.id,
          },
          defaults: {
            name: profile.displayName || profile.username,
            avatar: profile._json.avatar_url,
          },
        });
        const { userId, name, provider, providerUserId, avatar } =
          user[0].dataValues;
        return done(null, {
          userId,
          name,
          provider,
          providerUserId,
          avatar,
        });
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

// Route to initiate Github OAuth
// Frontend redirects to this endpoint
authRouter.get(
  "/github",
  passport.authenticate("github", {
    scope: ["read:user"],
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
  (req, res) => {
    const token = jwt.sign(req.user, process.env.JWT_SIGNING_KEY, {
      expiresIn: "7d",
    });

    // Set the JWT token in an HTTP-only cookie
    res.cookie("authtoken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: new URL(process.env.FRONTEND_URL).hostname,
    });

    res.redirect(`${process.env.FRONTEND_URL}`);
  },
);

authRouter.get("/me", isAuth, async (req, res) => {
  res.json({
    userId: req.user.userId,
    name: req.user.name,
    avatar: req.user.avatar,
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
