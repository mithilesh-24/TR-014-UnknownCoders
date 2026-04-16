const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../middleware/auth");
const { runDistribution, fetchForecast } = require("../controllers/system.controller");

// All routes require auth + admin
router.use(auth, adminOnly);

router.post("/run-distribution", runDistribution);
router.post("/fetch-forecast", fetchForecast);

module.exports = router;
