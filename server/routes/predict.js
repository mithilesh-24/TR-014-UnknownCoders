/**
 * routes/predict.js
 * ------------------
 * Public route: POST /api/predict
 *
 * No authentication required — this is the inference gateway
 * consumed by the frontend or external clients.
 */

const express    = require('express');
const router     = express.Router();
const { predict } = require('../controllers/predictController');

// POST /api/predict → call HuggingFace ML endpoint
router.post('/', predict);

module.exports = router;
