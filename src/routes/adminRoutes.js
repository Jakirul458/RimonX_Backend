import bcrypt from "bcryptjs";
import express from "express";

import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/overview", async (req, res) => {
  try {
    const [userCount, adminCount, totalPoints] = await Promise.all([
      User.countDocuments({ role: "USER" }),
      User.countDocuments({ role: "ADMIN" }),
      Wallet.aggregate([{ $group: { _id: null, points: { $sum: "$points" } } }]),
    ]);

    return res.json({
      metrics: {
        totalUsers: userCount,
        totalAdmins: adminCount,
        totalPointsAvailable: totalPoints[0]?.points || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load admin overview." });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const walletMap = await Wallet.find().lean();
    const walletByUser = new Map(walletMap.map((wallet) => [wallet.user.toString(), wallet]));

    const payload = users.map((user) => ({
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? null,
      role: user.role,
      isActive: user.isActive,
      points: walletByUser.get(user._id.toString())?.points || 0,
      createdAt: user.createdAt,
    }));

    return res.json({ users: payload });
  } catch (error) {
    return res.status(500).json({ message: "Unable to list users." });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const wallet = await Wallet.findOne({ user: user._id }).lean();

    return res.json({
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone ?? null,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      wallet: wallet
        ? {
            id: wallet._id.toString(),
            points: wallet.points,
            currency: wallet.currency,
            updatedAt: wallet.updatedAt,
          }
        : { points: 0, currency: "POINTS" },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load user profile." });
  }
});

router.patch("/users/:id/role", async (req, res) => {
  const { role } = req.body || {};

  if (!role || !["USER", "ADMIN"].includes(role)) {
    return res.status(400).json({ message: "Role must be USER or ADMIN." });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.role = role;
    await user.save();

    return res.json({
      message: "User role updated.",
      user: user.toSafeObject(),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update user role." });
  }
});

router.patch("/users/:id/points", async (req, res) => {
  const { delta } = req.body || {};
  const adjustment = Number(delta ?? 0);

  if (!Number.isSafeInteger(adjustment) || adjustment <= 0) {
    return res.status(400).json({ message: "Points adjustment must be a positive whole number." });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: user._id, points: 0, currency: "POINTS" });
    }

    wallet.points += adjustment;
    await wallet.save();

    return res.json({
      message: "Wallet updated successfully.",
      wallet: {
        id: wallet._id.toString(),
        points: wallet.points,
        currency: wallet.currency,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to adjust user points." });
  }
});

router.post("/users/:id/reset-password", async (req, res) => {
  const { newPassword } = req.body || {};

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long." });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({
      message: "Password updated. Share it with the user directly.",
      user: user.toSafeObject(),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to reset user password." });
  }
});

export default router;
