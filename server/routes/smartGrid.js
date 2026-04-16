/**
 * routes/smartGrid.js
 * --------------------
 * NEW route file — does NOT modify the existing routes/system.js.
 *
 * Exposes:
 *   POST /api/smartgrid/run  → runSmartGrid controller
 *
 * Auth: No token required — this endpoint feeds the public dashboard
 * and is read-only (no DB writes).
 */

const express = require("express");
const router  = express.Router();
const { runSmartGrid } = require("../controllers/smartGrid.controller");

// Public endpoint — no auth middleware
router.post("/run", runSmartGrid);

module.exports = router;
