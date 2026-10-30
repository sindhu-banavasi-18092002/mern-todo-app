import jwt from "jsonwebtoken";
import User from "../models/User.js";

/** Sign a JWT for a user id. */
export function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

/** Requires a valid `Authorization: Bearer <token>` header. */
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized. Please log in." });
    }

    const token = header.slice(7).trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ message: "User no longer exists." });

    req.user = user;
    next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Session expired. Please log in again."
        : "Invalid token. Please log in again.";
    res.status(401).json({ message });
  }
}

/** Restrict a route to specific roles: requireRole("admin") */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to do that." });
    }
    next();
  };
}
