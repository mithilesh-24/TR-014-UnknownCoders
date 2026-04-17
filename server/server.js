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

console.log("[Startup] Attempting to listen on port:", PORT);

const server = app.listen(PORT, () => {
  console.log(`[Startup] Server successfully bound to port ${PORT}`);
  console.log(`[Startup] Base URL: http://localhost:${PORT}/`);
  
  if (!process.env.MONGODB_URI) {
    console.error("[Startup] CRITICAL: MONGODB_URI is not defined in environment variables!");
    return;
  }

  console.log("[Startup] Connecting to MongoDB...");
  
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log("[Startup] MongoDB connection established successfully.");
      
      try {
        console.log("[Startup] Checking database state / seeding...");
        await runAllSeeds();
        
        console.log("[Startup] Starting background cron jobs...");
        startCronJobs();
        
        console.log("[Startup] Full system initialization complete.");
      } catch (initErr) {
        console.error("[Startup] Error during post-connection initialization:", initErr.message);
        // We don't exit(1) here to allow the server to keep responding (e.g., to health checks)
      }
    })
    .catch((err) => {
      console.error("[Startup] MongoDB connection failed:", err.message);
      console.error("[Startup] Stack Trace:", err.stack);
    });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Shutdown] SIGTERM received. Closing HTTP server...');
  server.close(() => {
    console.log('[Shutdown] HTTP server closed.');
    mongoose.connection.close(false, () => {
      console.log('[Shutdown] MongoDB connection closed.');
      process.exit(0);
    });
  });
});

module.exports = app;

