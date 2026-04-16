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
  HiOutlineCog,
} from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";

const adminNavItems = [
  { label: "Overview", icon: HiOutlineViewGrid, path: "/admin" },
  { label: "Houses", icon: HiOutlineOfficeBuilding, path: "/admin/houses" },
  { label: "Predictions", icon: HiOutlineTrendingUp, path: "/admin/predictions" },
  { label: "3D View", icon: HiOutlineCube, path: "/admin/3d-view" },
  { label: "Fairness & Alerts", icon: HiOutlineShieldCheck, path: "/admin/fairness" },
  { label: "Settings", icon: HiOutlineCog, path: "/admin/settings" },
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
      className="sidebar"
      variants={sidebarVariants}
      animate={collapsed ? "collapsed" : "expanded"}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Logo */}
      <div className="sidebar-logo-wrapper">
        <div className="sidebar-logo-icon">
          <HiOutlineLightningBolt style={{ width: "1.25rem", height: "1.25rem" }} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              className="sidebar-logo-text gradient-text"
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
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin" || item.path === "/dashboard"}
            className="sidebar-link"
          >
            {({ isActive }) => (
              <motion.div
                className={`sidebar-link-inner ${isActive ? "active" : "inactive"}`}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    className="sidebar-link-active-bg"
                    layoutId="activeNav"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon className="sidebar-link-icon" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      className="sidebar-link-text"
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
      <div className="sidebar-toggle-wrapper">
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-toggle-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
        >
          {collapsed ? (
            <HiOutlineChevronRight style={{ width: "1rem", height: "1rem" }} />
          ) : (
            <>
              <HiOutlineChevronLeft style={{ width: "1rem", height: "1rem" }} />
              <motion.span
                style={{ fontSize: "0.75rem" }}
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
      <div className="sidebar-footer">
        <div className="sidebar-footer-inner">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                className="sidebar-user-info"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="sidebar-user-name">
                  {user?.name || "User"}
                </p>
                <p className="sidebar-user-email">
                  {user?.email || "user@email.com"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            onClick={handleLogout}
            className="sidebar-logout-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Logout"
          >
            <HiOutlineLogout style={{ width: "1rem", height: "1rem" }} />
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
}
