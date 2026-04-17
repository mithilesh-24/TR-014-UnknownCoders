import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import OnboardingPage from "./pages/onboarding/OnboardingPage";

// Admin pages
import OverviewPage from "./pages/admin/OverviewPage";
import HouseMonitoringPage from "./pages/admin/HouseMonitoringPage";
import EnergyVisualizationPage from "./pages/admin/EnergyVisualizationPage";
import PredictionPage from "./pages/admin/PredictionPage";

// User pages
import UserHomePage from "./pages/user/UserHomePage";
import ForecastPage from "./pages/user/ForecastPage";
import SolarPage from "./pages/user/SolarPage";
import InsightsPage from "./pages/user/InsightsPage";

// Admin extra
import FairnessPage from "./pages/admin/FairnessPage";
import SettingsPage from "./pages/admin/SettingsPage";

function AppRoutes() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Auth routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Onboarding - protected */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes - protected, admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <DashboardLayout role="admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="houses" element={<HouseMonitoringPage />} />
          <Route path="predictions" element={<PredictionPage />} />
          <Route path="3d-view" element={<EnergyVisualizationPage />} />
          <Route path="fairness" element={<FairnessPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* User routes - protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout role="user" />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserHomePage />} />
          <Route path="forecast" element={<ForecastPage />} />
          <Route path="solar" element={<SolarPage />} />
          <Route path="insights" element={<InsightsPage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
