import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Task title cannot exceed 200 characters"],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    category: {
      type: String,
      enum: ["personal", "work", "study", "shopping", "health", "other"],
      default: "personal",
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Speeds up "my tasks, newest first" queries
taskSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Task", taskSchema);
