const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

// ---------------------------------------------------------------------------
// Multer configuration
// ---------------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ---------------------------------------------------------------------------
// Helper: generate JWT
// ---------------------------------------------------------------------------
function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// ---------------------------------------------------------------------------
// POST /api/auth/signup
// ---------------------------------------------------------------------------
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, password });

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboarded: user.onboarded,
      },
    });
  } catch (err) {
    console.error("[Auth] Signup error:", err.message);
    return res.status(500).json({ message: "Server error during signup" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Admin shortcut: username 'admin' with password 'admin123'
    if (username === "admin" && password === "admin123") {
      const admin = await User.findOne({ role: "admin" });
      if (admin) {
        const token = generateToken(admin);
        return res.json({
          token,
          user: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            onboarded: admin.onboarded,
          },
        });
      }
    }

    // Standard email/password login
    const loginEmail = email || username;
    if (!loginEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: loginEmail.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboarded: user.onboarded,
      },
    });
  } catch (err) {
    console.error("[Auth] Login error:", err.message);
    return res.status(500).json({ message: "Server error during login" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/upload
// ---------------------------------------------------------------------------
router.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = `/uploads/${req.file.filename}`;
    return res.json({ message: "File uploaded successfully", filePath });
  } catch (err) {
    console.error("[Auth] Upload error:", err.message);
    return res.status(500).json({ message: "Server error during file upload" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/me - Validate token & return user data
// ---------------------------------------------------------------------------
router.get("/me", auth, async (req, res) => {
  try {
    const user = req.user;
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboarded: user.onboarded,
        hasSolar: user.hasSolar,
      },
    });
  } catch (err) {
    console.error("[Auth] Me error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
