# ⚡ Tensor: Next-Gen Smart Grid Management Platform

Tensor is a state-of-the-art Smart Grid management platform designed to balance energy demand and supply in real-time. It leverages Machine Learning to forecast energy consumption and solar generation, ensuring a stable and efficient power distribution system.

---

## 🚀 Live Services

| Component | URL |
| :--- | :--- |
| **Frontend (Production)** | [https://tr-014-unknown-coders.vercel.app/](https://tr-014-unknown-coders.vercel.app/) |
| **Backend API** | [https://tr-014-unknowncoders-production.up.railway.app/](https://tr-014-unknowncoders-production.up.railway.app/) |
| **ML Service** | [https://tr-014-unknowncoders-ml-production.up.railway.app/](https://tr-014-unknowncoders-ml-production.up.railway.app/) |

---

## 🛠️ How it Works

The Tensor platform operates as a distributed system of microservices:

### 1. Unified Frontend (React & Vite)
- **Dashboard**: Real-time visualization of energy consumption, solar generation, and grid health.
- **Onboarding**: A multi-step profile builder for new households, including identity verification and solar capacity assessment.
- **Admin Control**: Comprehensive grid oversight, fairness monitoring, and manual overrides for energy distribution.

### 2. Intelligent Backend (Node.js & Express)
- **Grid Logic**: Calculates energy balancing based on real-time household data and weather inputs.
- **Data Persistence**: Uses MongoDB for scalable storage of consumption logs, user profiles, and grid states.
- **Security**: JWT-based authentication with secure password hashing (Bcrypt).
- **Automation**: Background cron jobs for periodic demand simulation and battery charging updates.

### 3. Machine Learning Service (Python & Flask)
- **Forecasting**: Predicts solar/wind generation and household demand using historical data.
- **HuggingFace Integration**: Bridges the local platform with advanced external ML models for hyper-accurate forecasting.

---

## 🧱 Technology Stack

- **Frontend**: React 18, Vite, Vanilla CSS (Semantic UI), Framer Motion, Recharts.
- **Backend API**: Node.js, Express, Mongoose, Multer (File Uploads), JWT.
- **ML & Data Science**: Python 3.11, Flask, Pandas, HuggingFace Inference API.
- **Database**: MongoDB Atlas.
- **Deployment**: Railway (Backend & ML), Vercel (Frontend).

---

## 📦 Deployment & Maintenance

### Environment Variables
To run this project, you will need to set the following:

**Backend (`/server/.env`):**
- `MONGODB_URI`: Your MongoDB connection string.
- `JWT_SECRET`: Secret key for authentication tokens.
- `ML_SERVICE_URL`: URL of the Python ML service.
- `HUGGINGFACE_TOKEN`: API key for ML model inference.

**Frontend (`/client/.env`):**
- `VITE_API_BASE_URL`: The production URL of the Railway backend.

### Project Structure
```text
├── client/          # Vite/React Frontend
├── server/          # Node.js Backend API
└── ml/              # Python ML Service
```

---

## 👨‍💻 Contributing
This project was built by the **UnknownCoders** team as part of the TR-014 Smart Grid initiative.

---
© 2026 Tensor Smart Energy. All Rights Reserved.
