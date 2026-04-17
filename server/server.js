/**
 * server.js
 * ----------
 * Main Express application entry point.
 *
 * Production-ready for Railway deployment:
 *  - Reads PORT from process.env (Railway injects this automatically)
 *  - CORS open for all origins (tighten in production if needed)
 *  - Request logging on every route
 *  - Global error handler at the bottom
 *  - Graceful root "/" route so Railway health checks pass
 */

const express    = require("express");
const mongoose   = require("mongoose");
const cors       = require("cors");
const path       = require("path");
require("dotenv").config();

const { startCronJobs }  = require("./utils/cronJobs");
const { runAllSeeds }    = require("./utils/seedData");
const { requestLogger }  = require("./utils/logger");

// ---------------------------------------------------------------------------
// Route imports — existing routes (untouched business logic)
// ---------------------------------------------------------------------------
const authRoutes     = require("./routes/auth");
const adminRoutes    = require("./routes/admin");
const userRoutes     = require("./routes/user");
const systemRoutes   = require("./routes/system");
const smartGridRoutes = require("./routes/smartGrid");

// New production routes
const predictRoutes  = require("./routes/predict");
const weatherRoutes  = require("./routes/weather");

// ---------------------------------------------------------------------------
// Express app setup
// ---------------------------------------------------------------------------
const app  = express();
const PORT = process.env.PORT || 5000; // Railway sets PORT automatically

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Allow all origins — update to a whitelist before going fully public
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log every incoming request (method, path, status, timing)
app.use(requestLogger);

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------------------------------------------------------------------
// Root route — Railway / health-check ping
// ---------------------------------------------------------------------------
app.get("/", (_req, res) => {
  res.json({
    message   : "Backend running",
    status    : "ok",
    timestamp : new Date().toISOString(),
    version   : "1.0.0",
  });
});

// ---------------------------------------------------------------------------
// Mount routes
// ---------------------------------------------------------------------------

// Existing routes (untouched)
app.use("/api/auth",   authRoutes);
app.use("/api/admin",  adminRoutes);
app.use("/api/user",   userRoutes);
app.use("/api/system", smartGridRoutes); // must come before systemRoutes
app.use("/api/system", systemRoutes);

// New production routes
app.use("/api/predict", predictRoutes);  // POST /api/predict  → HuggingFace ML
app.use("/api/weather", weatherRoutes);  // GET  /api/weather  → OpenWeatherMap

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status    : "ok",
    uptime    : process.uptime(),
    timestamp : new Date().toISOString(),
    env       : process.env.NODE_ENV || "development",
  });
});

// ---------------------------------------------------------------------------
// 404 handler — catches any route not matched above
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ---------------------------------------------------------------------------
// Global error handler — all next(err) calls end up here
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[Server] Unhandled error:", err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success : false,
    error   : err.message || "Internal server error",
  });
});

// ---------------------------------------------------------------------------
// MongoDB connection & server start
// ---------------------------------------------------------------------------

// Listen on PORT immediately so Railway sees the app as healthy
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Root:    http://localhost:${PORT}/`);
  console.log(`Health:  http://localhost:${PORT}/api/health`);
  console.log(`Predict: http://localhost:${PORT}/api/predict`);
  console.log(`Weather: http://localhost:${PORT}/api/weather`);

  // Connect to MongoDB in the background
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log("Connected to MongoDB established");
      
      try {
        // Seed initial data
        await runAllSeeds();
        // Start cron jobs for hourly energy distribution
        startCronJobs();
      } catch (seedErr) {
        console.error("[Startup] Error during seeding/cron startup:", seedErr.message);
      }
    })
    .catch((err) => {
      console.error("MongoDB connection fatal error:", err.message);
      // In production, we might not want to exit immediately if DB is down, 
      // but seeding is critical for this specific app's demo state.
      // process.exit(1); 
    });
});

module.exports = app;

