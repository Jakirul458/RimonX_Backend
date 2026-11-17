import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    const user = await User.findById(decoded.userId).lean();

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export const requireAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required." });
  }

  return next();
};
