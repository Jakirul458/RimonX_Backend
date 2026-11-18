import express from "express";

import Wallet from "../models/Wallet.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id }).lean();

    return res.json({
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
    return res.status(500).json({ message: "Unable to load wallet data." });
  }
});

router.post("/export", requireAuth, async (req, res) => {
  const { operationId } = req.body || {};

  if (typeof operationId !== "string" || !operationId.trim() || operationId.length > 128) {
    return res.status(400).json({
      message: "A valid export operation id is required to prevent duplicate deductions.",
    });
  }

  try {
    const cost = 1;
    const wallet = await Wallet.findOneAndUpdate(
      {
        user: req.user.id,
        points: { $gte: cost },
        recentExportOperationIds: { $ne: operationId },
      },
      {
        $inc: { points: -cost },
        $push: {
          recentExportOperationIds: {
            $each: [operationId],
            $slice: -50,
          },
        },
      },
      { new: true },
    );

    if (!wallet) {
      const currentWallet = await Wallet.findOne({ user: req.user.id }).select(
        "+recentExportOperationIds",
      );
      if (!currentWallet) {
        return res.status(404).json({ message: "Wallet not found." });
      }

      if (currentWallet.recentExportOperationIds.includes(operationId)) {
        return res.status(200).json({
          message: "Duplicate export blocked.",
          operationId,
          pointsRemaining: currentWallet.points,
          duplicate: true,
        });
      }

      return res.status(402).json({
        message: "Insufficient points to download or print this document.",
        pointsRemaining: currentWallet.points,
        requiredPoints: cost,
      });
    }

    return res.json({
      message: "Export authorized and charged successfully.",
      pointsRemaining: wallet.points,
      cost,
      operationId,
    });
  } catch (error) {
    console.error("Export authorization failed:", error);
    return res.status(500).json({ message: "Unable to process export request." });
  }
});

export default router;
