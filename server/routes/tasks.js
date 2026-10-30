import express from "express";
import Task from "../models/Task.js";
import { protect } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";

const router = express.Router();

// Every task route requires a logged-in user
router.use(protect);

const PRIORITIES = ["low", "medium", "high"];
const CATEGORIES = ["personal", "work", "study", "shopping", "health", "other"];

function cleanText(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : undefined;
}

function parseDate(value) {
  if (value === null || value === "" || value === undefined) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// GET /api/tasks?filter=all|active|completed&search=&priority=&category=&sort=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { filter = "all", search = "", priority, category, sort = "newest" } = req.query;
    const query = { user: req.user._id };

    if (filter === "active") query.completed = false;
    if (filter === "completed") query.completed = true;
    if (PRIORITIES.includes(priority)) query.priority = priority;
    if (CATEGORIES.includes(category)) query.category = category;
    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { notes: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      dueDate: { dueDate: 1, createdAt: -1 },
      priority: { priority: 1, createdAt: -1 },
    };

    const tasks = await Task.find(query).sort(sortMap[sort] || sortMap.newest);

    const stats = {
      total: await Task.countDocuments({ user: req.user._id }),
      completed: await Task.countDocuments({ user: req.user._id, completed: true }),
      active: await Task.countDocuments({ user: req.user._id, completed: false }),
      overdue: await Task.countDocuments({
        user: req.user._id,
        completed: false,
        dueDate: { $lt: new Date() },
      }),
    };

    res.json({ tasks, stats });
  })
);

// POST /api/tasks — create a task
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const title = cleanText(req.body.title, 200);
    if (!title) return res.status(400).json({ message: "Please enter a task title." });

    const task = await Task.create({
      user: req.user._id,
      title,
      notes: cleanText(req.body.notes, 1000) || "",
      priority: PRIORITIES.includes(req.body.priority) ? req.body.priority : "medium",
      category: CATEGORIES.includes(req.body.category) ? req.body.category : "personal",
      dueDate: parseDate(req.body.dueDate) ?? null,
    });

    res.status(201).json(task);
  })
);

// PUT /api/tasks/:id — full update (title, notes, priority, category, dueDate, completed)
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const updates = {};

    const title = cleanText(req.body.title, 200);
    if (title !== undefined) {
      if (!title) return res.status(400).json({ message: "Task title cannot be empty." });
      updates.title = title;
    }
    const notes = cleanText(req.body.notes, 1000);
    if (notes !== undefined) updates.notes = notes;
    if (PRIORITIES.includes(req.body.priority)) updates.priority = req.body.priority;
    if (CATEGORIES.includes(req.body.category)) updates.category = req.body.category;
    if (typeof req.body.completed === "boolean") updates.completed = req.body.completed;
    if ("dueDate" in req.body) {
      const dueDate = parseDate(req.body.dueDate);
      if (dueDate === undefined) return res.status(400).json({ message: "Invalid due date." });
      updates.dueDate = dueDate;
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json(task);
  })
);

// PATCH /api/tasks/:id — partial update (used for toggling completed)
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const updates = {};
    if (typeof req.body.completed === "boolean") updates.completed = req.body.completed;
    if (PRIORITIES.includes(req.body.priority)) updates.priority = req.body.priority;
    if (CATEGORIES.includes(req.body.category)) updates.category = req.body.category;
    const title = cleanText(req.body.title, 200);
    if (title) updates.title = title;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "Nothing to update." });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json(task);
  })
);

// DELETE /api/tasks/:id
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json({ message: "Task deleted successfully.", _id: req.params.id });
  })
);

// DELETE /api/tasks?filter=completed — bulk clear completed tasks
router.delete(
  "/",
  asyncHandler(async (req, res) => {
    if (req.query.filter !== "completed") {
      return res.status(400).json({ message: "Use ?filter=completed to clear completed tasks." });
    }
    const result = await Task.deleteMany({ user: req.user._id, completed: true });
    res.json({ message: `Cleared ${result.deletedCount} completed task(s).`, deleted: result.deletedCount });
  })
);

export default router;
