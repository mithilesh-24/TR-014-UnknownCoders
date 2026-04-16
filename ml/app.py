"""
ml/app.py
----------
Flask REST server that loads the trained XGBoost `.pkl` models and
exposes a `/predict` endpoint consumed by the Node.js mlService.

Model feature schemas (from training data):
  temperature_model : hour, day, month, dayofweek, ALLSKY_SFC_SW_DWN, WS10M
  energy_model      : hour, day, month, dayofweek, ALLSKY_SFC_SW_DWN, WS10M, T2M

Pipeline:
  1. Predict temperature  using temperature_model
  2. Use predicted T2M as input to energy_model
  3. Return both values

Routes:
  GET  /health   → { status: "ok" }
  POST /predict  → { temperature: float, energy: float }

Expected POST body:
  {
    "hour":       int   (0-23),
    "day":        int   (1-31),
    "month":      int   (1-12),
    "dayofweek":  int   (0-6, Sun=0),
    "radiation":  float (W/m² → mapped to ALLSKY_SFC_SW_DWN),
    "wind_speed": float (m/s  → mapped to WS10M)
  }
"""

import os
import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify

app = Flask(__name__)

# ── Model paths ──────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR  = os.path.join(BASE_DIR, "models")

TEMP_MODEL_PATH   = os.path.join(MODEL_DIR, "temperature_model.pkl")
ENERGY_MODEL_PATH = os.path.join(MODEL_DIR, "energy_model.pkl")

# ── Load models at startup ───────────────────────────────────────────────────
print("[ML Server] Loading models...")

with open(TEMP_MODEL_PATH, "rb") as f:
    temperature_model = pickle.load(f)

with open(ENERGY_MODEL_PATH, "rb") as f:
    energy_model = pickle.load(f)

TEMP_FEATURES   = list(temperature_model.feature_names_in_)
ENERGY_FEATURES = list(energy_model.feature_names_in_)

print(f"[ML Server] Temperature model  ({temperature_model.n_features_in_} feats): {TEMP_FEATURES}")
print(f"[ML Server] Energy model       ({energy_model.n_features_in_} feats): {ENERGY_FEATURES}")


# ── Helpers ──────────────────────────────────────────────────────────────────
def parse_request(data: dict) -> dict:
    """
    Map frontend-friendly field names to NASA POWER column names
    used during model training.
    """
    return {
        "hour"            : int(data.get("hour", 0)),
        "day"             : int(data.get("day", 1)),
        "month"           : int(data.get("month", 1)),
        "dayofweek"       : int(data.get("dayofweek", 0)),
        "ALLSKY_SFC_SW_DWN": float(data.get("radiation", 0.0)),   # solar radiation W/m²
        "WS10M"           : float(data.get("wind_speed", 0.0)),   # wind speed m/s
    }


# ── Routes ───────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "models": {
            "temperature_features": TEMP_FEATURES,
            "energy_features":      ENERGY_FEATURES,
        }
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        parsed = parse_request(data)

        # ── Step 1: Predict temperature ──────────────────────────────────────
        X_temp = pd.DataFrame([{k: parsed[k] for k in TEMP_FEATURES}])
        predicted_temperature = float(temperature_model.predict(X_temp)[0])
        predicted_temperature = round(max(-20.0, min(60.0, predicted_temperature)), 2)

        # ── Step 2: Predict energy (uses predicted T2M as a feature) ─────────
        energy_row = {k: parsed.get(k, 0.0) for k in ENERGY_FEATURES}
        energy_row["T2M"] = predicted_temperature   # inject predicted temp

        X_energy = pd.DataFrame([energy_row])
        predicted_energy = float(energy_model.predict(X_energy)[0])
        predicted_energy = round(max(0.0, predicted_energy), 2)

        print(f"[ML] T={predicted_temperature}°C  E={predicted_energy} kWh  "
              f"| rad={parsed['ALLSKY_SFC_SW_DWN']} wind={parsed['WS10M']}")

        return jsonify({
            "temperature": predicted_temperature,
            "energy":      predicted_energy,
        })

    except Exception as e:
        app.logger.error(f"[ML Server] Prediction error: {e}")
        return jsonify({"error": str(e)}), 500


# ── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    print(f"[ML Server] Starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
