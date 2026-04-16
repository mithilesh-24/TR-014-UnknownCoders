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
      className="glass sticky top-0 z-30 px-6 py-4 flex items-center justify-between"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        borderBottom: "1px solid transparent",
        backgroundImage:
          "linear-gradient(var(--bg-secondary), var(--bg-secondary)), linear-gradient(90deg, var(--accent), var(--accent-secondary), transparent)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
      }}
    >
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <motion.button
          className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <HiOutlineBell className="w-5 h-5 text-[var(--text-secondary)]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </motion.button>

        {/* Settings */}
        <motion.button
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <HiOutlineCog className="w-5 h-5 text-[var(--text-secondary)]" />
        </motion.button>

        {/* User info */}
        <div className="flex items-center gap-3 pl-3 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <span className="text-sm text-[var(--text-primary)] hidden sm:block">
            {user?.name || "User"}
          </span>
        </div>
      </div>
    </motion.header>
  );
}
