import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineCog6Tooth,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import GlassCard from "../../components/ui/GlassCard";
import useApi from "../../hooks/useApi";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function SettingsInput({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: "500", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%", borderRadius: "0.75rem",
          border: "1px solid rgba(255,255,255,0.06)",
          backgroundColor: "rgba(255,255,255,0.04)",
          padding: "0.625rem 1rem", fontSize: "0.875rem",
          color: "#e2e8f0", outline: "none", transition: "all 0.2s",
        }}
        onFocus={(e) => { e.target.style.borderColor = "rgba(99, 102, 241, 0.3)"; e.target.style.backgroundColor = "rgba(255,255,255,0.06)"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.06)"; e.target.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
      />
    </div>
  );
}

export default function SettingsPage() {
  const { get, put } = useApi();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    gridName: "",
    location: "",
    maxHouses: 55,
    batteryCapacity: 500,
    alertThresholdCritical: 30,
    alertThresholdWarning: 10,
    mlServiceUrl: "http://localhost:5001",
    weatherCity: "London",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const result = await get("/admin/settings");
        setSettings(result);
        setForm({
          gridName: result.gridName || "",
          location: result.location || "",
          maxHouses: result.maxHouses || 55,
          batteryCapacity: result.batteryCapacity || 500,
          alertThresholdCritical: result.alertThresholdCritical || 30,
          alertThresholdWarning: result.alertThresholdWarning || 10,
          mlServiceUrl: result.mlServiceUrl || "http://localhost:5001",
          weatherCity: result.weatherCity || "London",
        });
      } catch (err) {
        setError(err.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field) => (e) => {
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      console.log("[SettingsPage] Saving settings:", form);
      const result = await put("/admin/settings", form);
      setSettings(result.settings);
      setSuccess("Settings saved successfully!");
      console.log("[SettingsPage] Settings saved:", result);
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton-pulse skeleton-title" style={{ width: "14rem", marginBottom: "2rem" }} />
        <div className="skeleton-pulse skeleton-chart-full" style={{ height: "24rem" }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="page-inner-lg">
        {/* Header */}
        <motion.div variants={itemVariants} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ padding: "0.625rem", borderRadius: "0.75rem", backgroundColor: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
              <HiOutlineCog6Tooth style={{ fontSize: "1.25rem", color: "#818cf8" }} />
            </div>
            <div>
              <h1 className="page-title">System Settings</h1>
              <p className="page-subtitle">Configure your smart grid parameters</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              borderRadius: "0.75rem", backgroundColor: "var(--accent)",
              padding: "0.625rem 1.25rem", fontSize: "0.875rem", fontWeight: "500",
              color: "#fff", boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.2)",
              transition: "all 0.2s", opacity: saving ? 0.5 : 1,
              cursor: saving ? "not-allowed" : "pointer", border: "none",
            }}
          >
            {saving ? (
              <HiOutlineArrowPath style={{ fontSize: "1rem", animation: "spin 1s linear infinite" }} />
            ) : (
              <HiOutlineCheckCircle style={{ fontSize: "1rem" }} />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </motion.button>
        </motion.div>

        {/* Status Messages */}
        {error && (
          <motion.div variants={itemVariants} style={{ marginBottom: "1rem" }}>
            <div style={{ borderRadius: "0.75rem", backgroundColor: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <HiOutlineExclamationTriangle style={{ color: "#f87171", flexShrink: 0 }} />
              <p style={{ fontSize: "0.875rem", color: "#fca5a5" }}>{error}</p>
            </div>
          </motion.div>
        )}
        {success && (
          <motion.div variants={itemVariants} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "1rem" }}>
            <div style={{ borderRadius: "0.75rem", backgroundColor: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <HiOutlineCheckCircle style={{ color: "#34d399", flexShrink: 0 }} />
              <p style={{ fontSize: "0.875rem", color: "#34d399" }}>{success}</p>
            </div>
          </motion.div>
        )}

        {/* General Settings */}
        <motion.div variants={itemVariants}>
          <GlassCard hover={false} style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#e2e8f0", marginBottom: "1.25rem" }}>General</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              <SettingsInput label="Grid Name" value={form.gridName} onChange={handleChange("gridName")} placeholder="Smart Energy Grid" />
              <SettingsInput label="Location" value={form.location} onChange={handleChange("location")} placeholder="London" />
              <SettingsInput label="Max Houses" value={form.maxHouses} onChange={handleChange("maxHouses")} type="number" />
              <SettingsInput label="Battery Capacity (kWh)" value={form.batteryCapacity} onChange={handleChange("batteryCapacity")} type="number" />
            </div>
          </GlassCard>
        </motion.div>

        {/* Alert Thresholds */}
        <motion.div variants={itemVariants} style={{ marginTop: "1.5rem" }}>
          <GlassCard hover={false} style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#e2e8f0", marginBottom: "1.25rem" }}>Alert Thresholds</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              <SettingsInput label="Critical Threshold (%)" value={form.alertThresholdCritical} onChange={handleChange("alertThresholdCritical")} type="number" />
              <SettingsInput label="Warning Threshold (%)" value={form.alertThresholdWarning} onChange={handleChange("alertThresholdWarning")} type="number" />
            </div>
          </GlassCard>
        </motion.div>

        {/* Integration Settings */}
        <motion.div variants={itemVariants} style={{ marginTop: "1.5rem" }}>
          <GlassCard hover={false} style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#e2e8f0", marginBottom: "1.25rem" }}>Integrations</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              <SettingsInput label="ML Service URL" value={form.mlServiceUrl} onChange={handleChange("mlServiceUrl")} placeholder="http://localhost:5001" />
              <SettingsInput label="Weather City" value={form.weatherCity} onChange={handleChange("weatherCity")} placeholder="London" />
            </div>
          </GlassCard>
        </motion.div>

        {/* Last Updated */}
        {settings?.updatedAt && (
          <motion.div variants={itemVariants} style={{ marginTop: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Last updated: {new Date(settings.updatedAt).toLocaleString()}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
