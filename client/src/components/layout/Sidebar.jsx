import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineViewGrid,
  HiOutlineHome,
  HiOutlineChartBar,
  HiOutlineCube,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineSun,
  HiOutlineTrendingUp,
  HiOutlineEye,
  HiOutlineLogout,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineOfficeBuilding,
} from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";

const adminNavItems = [
  { label: "Overview", icon: HiOutlineViewGrid, path: "/admin" },
  { label: "Houses", icon: HiOutlineOfficeBuilding, path: "/admin/houses" },
  { label: "Predictions", icon: HiOutlineTrendingUp, path: "/admin/predictions" },
  { label: "3D View", icon: HiOutlineCube, path: "/admin/3d-view" },
  { label: "Fairness & Alerts", icon: HiOutlineShieldCheck, path: "/admin/fairness" },
];

const userNavItems = [
  { label: "Home", icon: HiOutlineHome, path: "/dashboard" },
  { label: "Forecast", icon: HiOutlineChartBar, path: "/dashboard/forecast" },
  { label: "Solar", icon: HiOutlineSun, path: "/dashboard/solar" },
  { label: "Insights", icon: HiOutlineEye, path: "/dashboard/insights" },
];

const sidebarVariants = {
  expanded: { width: 260 },
  collapsed: { width: 76 },
};

export default function Sidebar({ role = "user" }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = role === "admin" ? adminNavItems : userNavItems;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <motion.aside
      className="glass-strong h-screen sticky top-0 flex flex-col z-40 overflow-hidden"
      variants={sidebarVariants}
      animate={collapsed ? "collapsed" : "expanded"}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center flex-shrink-0">
          <HiOutlineLightningBolt className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              className="text-lg font-bold gradient-text whitespace-nowrap"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              SmartEnergy
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin" || item.path === "/dashboard"}
            className="block"
          >
            {({ isActive }) => (
              <motion.div
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
                }`}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent-secondary)]/10 border border-[var(--accent)]/20"
                    layoutId="activeNav"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    style={{
                      boxShadow: "0 0 20px rgba(99, 102, 241, 0.15)",
                    }}
                  />
                )}
                <item.icon className="w-5 h-5 relative z-10 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      className="text-sm font-medium relative z-10 whitespace-nowrap"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-2">
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
        >
          {collapsed ? (
            <HiOutlineChevronRight className="w-4 h-4" />
          ) : (
            <>
              <HiOutlineChevronLeft className="w-4 h-4" />
              <motion.span
                className="text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Collapse
              </motion.span>
            </>
          )}
        </motion.button>
      </div>

      {/* User info + logout */}
      <div className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                className="flex-1 min-w-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {user?.email || "user@email.com"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-400 transition-colors flex-shrink-0"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Logout"
          >
            <HiOutlineLogout className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
}
