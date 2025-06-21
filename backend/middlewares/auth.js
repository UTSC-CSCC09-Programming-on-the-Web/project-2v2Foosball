import jwt from "jsonwebtoken";

export const isAuth = (req, res, next) => {
  // Read token from HTTP-only cookie
  const token = req.cookies.authtoken;

  if (!token) {
    return res
      .status(401)
      .json({ error: "Authentication required - no token found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SIGNING_KEY);
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
