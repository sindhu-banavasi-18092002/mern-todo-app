/**
 * Demo data seeder. Run: node seed.js
 * Creates (or reuses) a demo account and adds sample tasks.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "./config/db.js";
import User from "./models/User.js";
import Task from "./models/Task.js";

dotenv.config();
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "dev-only-secret-change-me";

const DEMO_EMAIL = "demo@donezo.app";
const DEMO_PASSWORD = "demo1234";

const samples = [
  { title: "Finish the MERN todo app", priority: "high", category: "study", dueOffset: 2 },
  { title: "Push the project to GitHub", priority: "high", category: "work", dueOffset: 0 },
  { title: "Deploy on Vercel", priority: "medium", category: "work", dueOffset: 1 },
  { title: "Buy groceries for the week", priority: "low", category: "shopping", dueOffset: 3 },
  { title: "30 minute evening walk", priority: "low", category: "health", dueOffset: 0, completed: true },
  { title: "Read 20 pages", priority: "medium", category: "personal", dueOffset: 5, notes: "Atomic Habits, chapter 5" },
  { title: "Revise Express middleware", priority: "medium", category: "study", dueOffset: -1 },
];

async function run() {
  await connectDB();

  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({ name: "Demo User", email: DEMO_EMAIL, password: DEMO_PASSWORD });
    console.log(`👤 Created demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  } else {
    console.log(`👤 Demo user already exists: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  }

  const existing = await Task.countDocuments({ user: user._id });
  if (existing > 0) {
    console.log(`ℹ️  ${existing} task(s) already exist for this user — nothing added.`);
  } else {
    const day = 24 * 60 * 60 * 1000;
    await Task.insertMany(
      samples.map(({ dueOffset, ...rest }) => ({
        ...rest,
        user: user._id,
        dueDate: dueOffset === undefined ? null : new Date(Date.now() + dueOffset * day),
      }))
    );
    console.log(`✅ Added ${samples.length} sample tasks.`);
  }

  await disconnectDB();
  await mongoose.connection.close().catch(() => {});
  process.exit(0);
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
