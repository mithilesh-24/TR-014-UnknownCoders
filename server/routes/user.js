const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { auth } = require("../middleware/auth");
const { getDashboard, getForecast, getSolar, getInsights, onboardHouse } = require("../controllers/user.controller");

// Multer configuration for owner proof uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `proof-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// All routes require auth
router.use(auth);

router.get("/dashboard", getDashboard);
router.get("/forecast", getForecast);
router.get("/solar", getSolar);
router.get("/insights", getInsights);

// Handle multipart/form-data for onboarding
router.post("/onboard", upload.single("ownerProof"), onboardHouse);

module.exports = router;
