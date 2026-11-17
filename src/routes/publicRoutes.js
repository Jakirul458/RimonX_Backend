import express from "express";

import { getDefaultPricing } from "../utils/credits.js";

const router = express.Router();

router.get("/pricing", (req, res) => {
  return res.json(getDefaultPricing());
});

router.get("/legal/terms", (req, res) => {
  return res.json({
    title: "Terms of Service",
    summary:
      "Users may generate and preview documents without charge. Download and print actions require wallet points.",
    clauses: [
      "The platform provides free generation and preview tooling.",
      "Users must not misuse the export system or attempt to bypass point enforcement.",
      "Use of the site is subject to applicable laws and acceptable usage policies.",
    ],
  });
});

router.get("/legal/privacy", (req, res) => {
  return res.json({
    title: "Privacy Policy",
    summary:
      "Account, wallet, and document metadata are stored securely for essential platform functionality.",
    points: [
      "We use email and password authentication to secure user accounts.",
      "We store wallet, transaction, and administrative metadata required for billing and credit operations.",
      "We do not sell personal information to third parties.",
    ],
  });
});

router.get("/legal/refunds", (req, res) => {
  return res.json({
    title: "Refund and Credits Policy",
    summary:
      "Points are non-transferable and are treated as digital credits tied to the user account.",
    policy: [
      "Welcome credits are granted once upon successful registration.",
      "Points are not automatically expired and remain available unless otherwise adjusted by admin action.",
      "Refunds are only considered in exceptional cases where platform error prevented a valid service from being provided.",
    ],
  });
});

export default router;
