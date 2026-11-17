import "dotenv/config";

import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import { connectDB } from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 5000;
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later.",
  }),
);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "RimonX Backend",
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);
  res.status(500).json({ message: "Internal server error." });
});

connectDB().catch((error) => {
  console.error("MongoDB connection failed:", error.message);
});

app.listen(port, () => {
  console.log(`RimonX backend running on http://localhost:${port}`);
});
