import express from "express";
import User from "../models/User.js";
import { signToken, protect } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";

const router = express.Router();

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");

// POST /api/auth/register — create an account and return a token
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Name is required." });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) return res.status(400).json({ message: "That email is already registered." });

    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      password,
    });

    res.status(201).json({ token: signToken(user._id), user: user.toPublicJSON() });
  })
);

// POST /api/auth/login — email + password → token
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    if (!isEmail(email) || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid email or password." });

    const ok = await user.matchPassword(String(password));
    if (!ok) return res.status(401).json({ message: "Invalid email or password." });

    res.json({ token: signToken(user._id), user: user.toPublicJSON() });
  })
);

// GET /api/auth/me — current user (requires token)
router.get(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user.toPublicJSON() });
  })
);

export default router;
