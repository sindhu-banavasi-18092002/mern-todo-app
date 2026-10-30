import express from "express";
import rateLimit from "express-rate-limit";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { protect, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";

const router = express.Router();

router.use(protect, requireRole("admin"));

// GET /api/admin/stats — platform-wide numbers
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [users, tasks, completed] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      Task.countDocuments({ completed: true }),
    ]);
    res.json({ users, tasks, completed, pending: tasks - completed });
  })
);

// GET /api/admin/users — list users with task counts
router.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await User.find().sort({ createdAt: -1 }).limit(200);
    const counts = await Task.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);
    const map = new Map(counts.map((c) => [String(c._id), c.count]));

    res.json(
      users.map((u) => ({ ...u.toPublicJSON(), tasks: map.get(String(u._id)) || 0 }))
    );
  })
);

// DELETE /api/admin/users/:id — remove a user and their tasks
router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ message: "You cannot delete your own admin account." });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    await Task.deleteMany({ user: user._id });
    res.json({ message: `Deleted ${user.email} and their tasks.` });
  })
);

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

export default router;
