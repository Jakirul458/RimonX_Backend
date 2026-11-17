import crypto from "crypto";
import express from "express";

import Transaction from "../models/Transaction.js";
import Wallet from "../models/Wallet.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id }).lean();
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20).lean();

    return res.json({
      wallet: wallet
        ? {
            id: wallet._id.toString(),
            points: wallet.points,
            currency: wallet.currency,
            updatedAt: wallet.updatedAt,
          }
        : { points: 0, currency: "POINTS" },
      transactions: transactions.map((tx) => ({
        id: tx._id.toString(),
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        status: tx.status,
        operationId: tx.operationId,
        toolName: tx.toolName,
        createdAt: tx.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load wallet data." });
  }
});

router.post("/export", requireAuth, async (req, res) => {
  const { action = "download", toolName = "document", operationId, fileType } = req.body || {};

  if (!operationId) {
    return res.status(400).json({
      message: "An export operation id is required to prevent duplicate deductions.",
    });
  }

  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found." });
    }

    const duplicateTransaction = await Transaction.findOne({
      user: req.user.id,
      operationId,
    }).lean();

    if (duplicateTransaction) {
      return res.status(200).json({
        message: "Duplicate export blocked.",
        operationId,
        pointsRemaining: wallet.points,
        duplicate: true,
      });
    }

    const cost = 1;

    if (wallet.points < cost) {
      return res.status(402).json({
        message: "Insufficient points to download or print this document.",
        pointsRemaining: wallet.points,
        requiredPoints: cost,
      });
    }

    wallet.points -= cost;
    await wallet.save();

    const transaction = await Transaction.create({
      user: req.user.id,
      type: "export",
      amount: -cost,
      description: `Export charge: ${action} for ${toolName}`,
      operationId,
      toolName: toolName || "document",
      status: "success",
      metadata: {
        action,
        fileType: fileType || "pdf",
      },
    });

    return res.json({
      message: "Export authorized and charged successfully.",
      pointsRemaining: wallet.points,
      cost,
      operationId,
      transaction: {
        id: transaction._id.toString(),
        amount: transaction.amount,
        type: transaction.type,
      },
    });
  } catch (error) {
    console.error("Export authorization failed:", error);
    return res.status(500).json({ message: "Unable to process export request." });
  }
});

export default router;
