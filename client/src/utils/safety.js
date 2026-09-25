// Shared look-up tables for the safety features

export const LEVEL_STYLES = {
  safe: { text: "text-green-700", bg: "bg-green-100", ring: "#16a34a", route: "#16a34a" },
  moderate: { text: "text-amber-700", bg: "bg-amber-100", ring: "#d97706", route: "#d97706" },
  caution: { text: "text-red-700", bg: "bg-red-100", ring: "#dc2626", route: "#dc2626" },
};

export const levelOf = (score) => (score >= 70 ? "safe" : score >= 45 ? "moderate" : "caution");

export const PLACE_STYLES = {
  police: { label: "Police", color: "#1d4ed8", emoji: "👮" },
  hospital: { label: "Hospital", color: "#dc2626", emoji: "🏥" },
  transit: { label: "Station", color: "#7c3aed", emoji: "🚉" },
  open_24x7: { label: "Open 24x7", color: "#059669", emoji: "🏪" },
  pharmacy: { label: "Pharmacy", color: "#0891b2", emoji: "💊" },
  fuel: { label: "Fuel pump", color: "#64748b", emoji: "⛽" },
};

export const REPORT_TYPES = [
  { value: "poor_lighting", label: "Poor lighting", emoji: "💡" },
  { value: "harassment", label: "Harassment", emoji: "⚠️" },
  { value: "stalking", label: "Stalking / followed", emoji: "👣" },
  { value: "isolated_area", label: "Isolated area", emoji: "🌫️" },
  { value: "unsafe_crowd", label: "Unsafe crowd", emoji: "👥" },
  { value: "theft", label: "Theft / snatching", emoji: "👜" },
  { value: "other", label: "Something else", emoji: "❓" },
];

export const reportLabel = (type) => REPORT_TYPES.find((t) => t.value === type)?.label || type;

export const SEVERITY = [
  { value: 1, label: "Minor", color: "#f59e0b" },
  { value: 2, label: "Serious", color: "#f97316" },
  { value: 3, label: "Dangerous", color: "#dc2626" },
];
