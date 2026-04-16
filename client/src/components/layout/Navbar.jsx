import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineBell, HiOutlineCog } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";

const routeTitles = {
  "/admin": "Overview",
  "/admin/houses": "Houses",
  "/admin/predictions": "Predictions",
  "/admin/3d-view": "3D View",
  "/admin/fairness": "Fairness & Alerts",
  "/admin/settings": "Settings",
  "/dashboard": "Home",
  "/dashboard/forecast": "Forecast",
  "/dashboard/solar": "Solar",
  "/dashboard/insights": "Insights",
  "/onboarding": "Onboarding",
};

function getPageTitle(pathname) {
  if (routeTitles[pathname]) return routeTitles[pathname];
  const match = Object.keys(routeTitles).find((key) => pathname.startsWith(key));
  return match ? routeTitles[match] : "Dashboard";
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const title = getPageTitle(location.pathname);
  const [showNotifications, setShowNotifications] = useState(false);

  const isAdmin = user?.role === "admin";

  const handleSettingsClick = () => {
    console.log("[Navbar] Settings clicked");
    if (isAdmin) {
      navigate("/admin/settings");
    }
  };

  const handleNotificationClick = () => {
    console.log("[Navbar] Notification bell clicked");
    if (isAdmin) {
      setShowNotifications(!showNotifications);
    }
  };

  return (
    <motion.header
      className="navbar"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="navbar-title">
        {title}
      </h1>

      <div className="navbar-actions">
        {/* Notification bell */}
        <div style={{ position: "relative" }}>
          <motion.button
            className="navbar-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNotificationClick}
            title="Notifications"
          >
            <HiOutlineBell style={{ width: "1.25rem", height: "1.25rem" }} />
            <span className="navbar-badge" />
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: "absolute", right: 0, top: "100%", marginTop: "0.5rem",
                  width: "20rem", borderRadius: "0.75rem", padding: "1rem",
                  backgroundColor: "rgba(26, 26, 46, 0.95)", border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(16px)", boxShadow: "0 10px 40px rgba(0,0,0,0.4)", zIndex: 50,
                }}
              >
                <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "#e2e8f0", marginBottom: "0.5rem" }}>
                  Notifications
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  {isAdmin ? "View alerts on the Fairness & Alerts page." : "No new notifications."}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => { setShowNotifications(false); navigate("/admin/fairness"); }}
                    style={{
                      marginTop: "0.75rem", width: "100%", padding: "0.5rem",
                      borderRadius: "0.5rem", backgroundColor: "rgba(99, 102, 241, 0.1)",
                      border: "1px solid rgba(99, 102, 241, 0.2)", color: "#818cf8",
                      fontSize: "0.75rem", fontWeight: "500", cursor: "pointer",
                    }}
                  >
                    View All Alerts
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings */}
        {isAdmin && (
          <motion.button
            className="navbar-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSettingsClick}
            title="Settings"
          >
            <HiOutlineCog style={{ width: "1.25rem", height: "1.25rem" }} />
          </motion.button>
        )}

        {/* User info */}
        <div className="navbar-user">
          <div className="sidebar-avatar" style={{ width: "2rem", height: "2rem" }}>
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <span>
            {user?.name || "User"}
          </span>
        </div>
      </div>
    </motion.header>
  );
}
