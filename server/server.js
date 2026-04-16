const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { startCronJobs } = require("./utils/cronJobs");
const { runAllSeeds } = require("./utils/seedData");

// ---------------------------------------------------------------------------
// Route imports
// ---------------------------------------------------------------------------
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const systemRoutes = require("./routes/system");
const smartGridRoutes = require("./routes/smartGrid");

// ---------------------------------------------------------------------------
// Express app setup
// ---------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------------------------------------------------------------------
// Mount routes
// ---------------------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/system",    systemRoutes);
app.use("/api/system",    smartGridRoutes); // NEW — smart grid ML pipeline (POST /system/run)

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// MongoDB connection & server start
// ---------------------------------------------------------------------------
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    // Seed initial data
    await runAllSeeds();

    // Start cron jobs for hourly energy distribution
    startCronJobs();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

module.exports = app;

