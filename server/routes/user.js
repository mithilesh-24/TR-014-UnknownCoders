const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { getDashboard, getForecast, getSolar, getInsights, onboardHouse } = require("../controllers/user.controller");

// All routes require auth
router.use(auth);

router.get("/dashboard", getDashboard);
router.get("/forecast", getForecast);
router.get("/solar", getSolar);
router.get("/insights", getInsights);
router.post("/onboard", onboardHouse);

module.exports = router;
