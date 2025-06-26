import jwt from "jsonwebtoken";
import { User } from "../models/users.js";

export const isAuth = async (req, res, next) => {
  // Read token from HTTP-only cookie
  const token = req.cookies.authtoken;

  if (!token) {
    return res
      .status(401)
      .json({ error: "Authentication required - no token found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SIGNING_KEY);

    if (
      process.env.NODE_ENV === "development" &&
      decoded.userId === "mock-user-id"
    ) {
      req.user = decoded;
      return next();
    }

    if (
      !decoded ||
      !decoded.userId ||
      (await User.findByPk(decoded.userId)) === null
    ) {
      throw new Error("Invalid token payload");
    }
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

    return res.status(403).json({
      error: "Invalid or expired token",
      details: err.message,
    });
  }
};

export const isAuthSocket = (socket, next) => {
  const token =
    socket.handshake.auth.token ||
    socket.handshake.headers.cookie?.split("authtoken=")[1]?.split(";")[0];

  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SIGNING_KEY);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
};
