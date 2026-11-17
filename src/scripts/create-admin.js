import "dotenv/config";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/User.js";
import Wallet from "../models/Wallet.js";

const [, , fullNameArg, emailArg, passwordArg] = process.argv;

if (!fullNameArg || !emailArg || !passwordArg) {
  console.error('Usage: node src/scripts/create-admin.js "Full Name" admin@example.com StrongPassword123');
  process.exit(1);
}

const fullName = fullNameArg.trim();
const email = emailArg.trim().toLowerCase();
const password = passwordArg;

async function main() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rimonx";

  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGO_DB_NAME || undefined,
  });

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    existingUser.role = "ADMIN";
    existingUser.isActive = true;
    await existingUser.save();

    const existingWallet = await Wallet.findOne({ user: existingUser._id });
    if (!existingWallet) {
      await Wallet.create({ user: existingUser._id, points: 10, currency: "POINTS" });
    }

    console.log(`Admin role granted to ${existingUser.email}`);
    return process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    fullName,
    email,
    passwordHash,
    role: "ADMIN",
    isActive: true,
  });

  await Wallet.create({
    user: user._id,
    points: 0,
    currency: "POINTS",
  });

  console.log(`Admin created: ${user.email}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Failed to create admin:", error.message);
  process.exit(1);
});
