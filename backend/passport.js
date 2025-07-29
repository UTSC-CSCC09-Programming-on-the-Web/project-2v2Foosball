import passport from "passport";
import GitHubStrategy from "passport-github2";
import GoogleStrategy from "passport-google-oauth20";
import { User } from "./models/users.js";

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.OAUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.OAUTH_GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/github/callback`,
      scope: ["user:email"],
      session: false,
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        const user = await User.findOrCreate({
          where: {
            provider: "github",
            providerUserId: profile.id,
          },
          defaults: {
            email: profile.emails[0].value,
            name: profile.displayName || profile.username,
            avatar: profile._json.avatar_url,
          },
        });
        return done(null, user[0].dataValues);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.OAUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
      scope: ["profile", "email"],
      session: false,
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log(profile);
      try {
        const user = await User.findOrCreate({
          where: {
            provider: "google",
            providerUserId: profile.id,
          },
          defaults: {
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar: profile._json.picture,
          },
        });
        return done(null, user[0].dataValues);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export { passport };
