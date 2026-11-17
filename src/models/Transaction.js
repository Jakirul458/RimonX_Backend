import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["welcome_bonus", "export", "refund", "admin_adjustment", "purchase"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
    },
    operationId: {
      type: String,
      default: null,
      index: true,
    },
    toolName: {
      type: String,
      default: null,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
