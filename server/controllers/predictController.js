/**
 * controllers/predictController.js
 * ----------------------------------
 * Handles POST /api/predict
 *
 * Validates the incoming request body, delegates to the HuggingFace
 * inference service, and returns a consistent JSON response.
 *
 * Response format:
 *   Success → { success: true,  prediction: <value> }
 *   Failure → { success: false, error: "<message>" }
 */

const { runInference } = require('../services/huggingFaceService');

/**
 * POST /api/predict
 *
 * Body (JSON):   Any object that your HF model expects as input.
 *                At minimum pass `{ inputs: "..." }` for text models,
 *                or a feature vector for tabular/regression models.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function predict(req, res, next) {
  try {
    const inputData = req.body;

    // Basic validation — body must be a non-empty object
    if (!inputData || typeof inputData !== 'object' || Object.keys(inputData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body is empty. Provide input features as JSON.',
      });
    }

    // Call the HuggingFace inference service (10-second timeout via service default)
    const result = await runInference(inputData);

    if (!result.success) {
      // Service returned a handled error — send 502 (bad gateway, upstream issue)
      return res.status(502).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    // Unexpected errors bubble up to the global error handler
    next(err);
  }
}

module.exports = { predict };
