import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineBell, HiOutlineCog } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";

const routeTitles = {
  "/admin": "Overview",
  "/admin/houses": "Houses",
  "/admin/predictions": "Predictions",
  "/admin/3d-view": "3D View",
  "/admin/fairness": "Fairness & Alerts",
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
  const { user } = useAuth();
  const title = getPageTitle(location.pathname);

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
        <motion.button
          className="navbar-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <HiOutlineBell style={{ width: "1.25rem", height: "1.25rem" }} />
          <span className="navbar-badge" />
        </motion.button>

        {/* Settings */}
        <motion.button
          className="navbar-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <HiOutlineCog style={{ width: "1.25rem", height: "1.25rem" }} />
        </motion.button>

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
