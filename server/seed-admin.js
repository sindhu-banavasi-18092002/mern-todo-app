/**
 * Promotes a user to admin, or creates one.
 * Usage: node seed-admin.js you@example.com [password] [name]
 * With no arguments it uses ADMIN_EMAIL / ADMIN_PASSWORD from .env.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "./config/db.js";
import User from "./models/User.js";

dotenv.config();
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "dev-only-secret-change-me";

const [emailArg, passwordArg, nameArg] = process.argv.slice(2);
const email = (emailArg || process.env.ADMIN_EMAIL || "").toLowerCase();
const password = passwordArg || process.env.ADMIN_PASSWORD || "";

async function run() {
  if (!email) {
    console.error("Usage: node seed-admin.js <email> [password] [name]");
    process.exit(1);
  }

  await connectDB();
  let user = await User.findOne({ email });

  if (user) {
    user.role = "admin";
    await user.save();
    console.log(`✅ ${email} is now an admin.`);
  } else if (password) {
    user = await User.create({ name: nameArg || "Admin", email, password, role: "admin" });
    console.log(`✅ Created admin ${email}.`);
  } else {
    console.error(`No user with ${email}. Pass a password to create one.`);
  }

  await disconnectDB();
  await mongoose.connection.close().catch(() => {});
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
