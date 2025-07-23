import jwt from "jsonwebtoken";
import { User } from "../models/users.js";
import { MOCK_USER, MOCK_USER_2 } from "../data/mock.js";
import { doubleCsrf } from "csrf-csrf";

const createAuthMiddleware = (requireSubscription = true) => {
  return async (req, res, next) => {
    const token = req.cookies.authtoken;

    if (!token) {
      return res
        .status(401)
        .json({ error: "Authentication required - no token found" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SIGNING_KEY);

      if (
        decoded.userId === MOCK_USER.userId ||
        decoded.userId === MOCK_USER_2.userId
      ) {
        if (process.env.NODE_ENV !== "development") {
          throw new Error("Mock users are only allowed in development mode");
        }
        req.user = decoded;
        return next();
      }

      const user = await User.findByPk(decoded.userId);
      if (!decoded || !decoded.userId || user === null) {
        throw new Error("Invalid token payload");
      }

      if (requireSubscription && !user.active) {
        throw new Error("User does not have an active subscription");
      }

      console.log("User authenticated:", decoded);
      req.user = decoded;
      next();
    } catch (err) {
      // Clear invalid cookie
      res.clearCookie("authtoken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        domain: new URL(process.env.FRONTEND_URL).hostname,
      });

      res.clearCookie("xsrf-token", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        domain: new URL(process.env.FRONTEND_URL).hostname,
      });

      return res.status(403).json({
        error: "Invalid or expired token",
        details: err.message,
      });
    }
  };
};

export const isAuthWithoutSubscription = createAuthMiddleware(false);
export const isAuth = createAuthMiddleware(true);

export const isAuthSocket = async (socket, next) => {
  const token =
    socket.handshake.auth.token ||
    socket.handshake.headers.cookie?.split("authtoken=")[1]?.split(";")[0];

  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SIGNING_KEY);

    if (
      decoded.userId === MOCK_USER.userId ||
      decoded.userId === MOCK_USER_2.userId
    ) {
      if (process.env.NODE_ENV !== "development") {
        return next(
          new Error("Mock users are only allowed in development mode")
        );
      }
      socket.user = decoded;
      return next();
    }

    const user = await User.findByPk(decoded.userId);

    if (!decoded || !decoded.userId || user === null) {
      return next(new Error("Invalid token payload"));
    }

    if (!user.active) {
      return next(new Error("User does not have an active subscription"));
    }

    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
};

// CSRF protection middleware
export const {
  doubleCsrfProtection, // This is the default CSRF protection middleware.
  generateCsrfToken,
} = doubleCsrf({
  getSecret: (req) => process.env.CSRF_SECRET,
  getSessionIdentifier: (req) => req.cookies.authtoken,
  cookieName: "xsrf-token",
  cookieOptions: {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: new URL(process.env.BACKEND_URL).hostname, // Change to frontend domain
  },
});
