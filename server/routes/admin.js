const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../middleware/auth");
const { 
  getOverview, 
  getHouses, 
  getHouseById, 
  getPrediction, 
  getFairness 
} = require("../controllers/admin.controller");

// All routes require auth + admin
router.use(auth, adminOnly);

router.get("/overview", getOverview);
router.get("/houses", getHouses);
router.get("/houses/:id", getHouseById);
router.get("/prediction", getPrediction);
router.get("/fairness", getFairness);

module.exports = router;
