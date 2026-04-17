/**
 * services/huggingFaceService.js
 * --------------------------------
 * Handles all communication with the external Hugging Face Inference API.
 *
 * Uses the ML_API_URL environment variable.
 * Falls back gracefully if the endpoint is unreachable or times out.
 *
 * Usage:
 *   const { runInference } = require('./huggingFaceService');
 *   const result = await runInference({ inputData });
 */

const axios = require('axios');

// External Hugging Face endpoint (set via ML_API_URL in .env)
const HF_URL = process.env.ML_API_URL || '';

/**
 * Call the Hugging Face Inference API with the provided payload.
 *
 * @param {Object} inputData  - Arbitrary object sent as the request body
 * @param {number} [timeoutMs=10000] - Request timeout in milliseconds (default 10s)
 * @returns {Promise<{ success: true, prediction: any } | { success: false, error: string }>}
 */
async function runInference(inputData, timeoutMs = 10000) {
  if (!HF_URL) {
    console.warn('[HuggingFace] ML_API_URL is not set — cannot call inference endpoint');
    return { success: false, error: 'ML_API_URL environment variable is not configured' };
  }

  console.log(`[HuggingFace] Calling inference endpoint: ${HF_URL}`);
  console.log('[HuggingFace] Payload:', JSON.stringify(inputData));

  try {
    const response = await axios.post(HF_URL, inputData, {
      timeout: timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization header if HF token is required:
        // 'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
      },
    });

    const prediction = response.data;
    console.log('[HuggingFace] Inference success:', JSON.stringify(prediction));

    return {
      success: true,
      prediction,
    };
  } catch (err) {
    // Distinguish timeout from other errors for clearer logs
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      console.error(`[HuggingFace] Request timed out after ${timeoutMs}ms`);
      return { success: false, error: 'ML API request timed out. Try again later.' };
    }

    const status  = err.response?.status;
    const detail  = err.response?.data || err.message;
    console.error(`[HuggingFace] API error (HTTP ${status || 'N/A'}):`, detail);

    return {
      success: false,
      error: `ML API returned an error: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`,
    };
  }
}

module.exports = { runInference };
