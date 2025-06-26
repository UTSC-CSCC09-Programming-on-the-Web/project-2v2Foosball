import passport from "passport";
import GitHubStrategy from "passport-github2";
import { User } from "./models/users.js";

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.OAUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.OAUTH_GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/github/callback`,
      scope: ["user:email"],
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
    },
  ),
);

export { passport };
