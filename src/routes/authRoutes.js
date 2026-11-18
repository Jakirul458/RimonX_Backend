import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ userId: user._id.toString(), role: user.role }, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "7d",
  });

router.post("/register", async (req, res) => {
  const { fullName, email, phone, password, confirmPassword } = req.body || {};

  if (!fullName || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({ message: "Full name, email, mobile number, password, and confirm password are required." });
  }

  if (typeof fullName !== "string" || fullName.trim().length < 2) {
    return res.status(400).json({ message: "Full name must be at least 2 characters long." });
  }

  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Please provide a valid email address." });
  }

  if (
    typeof phone !== "string" ||
    phone.trim().length > 24 ||
    !/^\+?[1-9]\d{7,14}$/.test(phone.trim().replace(/[\s()-]/g, ""))
  ) {
    return res.status(400).json({ message: "Please provide a valid mobile number with country code if needed." });
  }

  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash,
      role: "USER",
    });

    const wallet = await Wallet.create({
      user: user._id,
      points: 10,
      currency: "POINTS",
    });

    const token = signToken(user);

    return res.status(201).json({
      message: "Registration successful.",
      token,
      user: user.toSafeObject(),
      wallet: {
        id: wallet._id,
        user: wallet.user,
        points: wallet.points,
        currency: wallet.currency,
      },
    });
  } catch (error) {
    console.error("Registration failed:", error);
    return res.status(500).json({ message: "Unable to register user right now." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const wallet = await Wallet.findOne({ user: user._id });
    const token = signToken(user);

    return res.json({
      message: "Login successful.",
      token,
      user: user.toSafeObject(),
      wallet: wallet
        ? {
            id: wallet._id,
            user: wallet.user,
            points: wallet.points,
            currency: wallet.currency,
          }
        : null,
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Unable to log in right now." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    const wallet = await Wallet.findOne({ user: req.user.id }).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone ?? null,
        role: user.role,
        isActive: user.isActive,
      },
      wallet: wallet
        ? {
            id: wallet._id.toString(),
            points: wallet.points,
            currency: wallet.currency,
          }
        : { points: 0, currency: "POINTS" },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch current user." });
  }
});

router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Current password, new password, and confirm password are required." });
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ message: "New password must be at least 8 characters long." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "New password and confirm password do not match." });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({
      message: "Password changed successfully.",
      user: user.toSafeObject(),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to change password right now." });
  }
});

export default router;
