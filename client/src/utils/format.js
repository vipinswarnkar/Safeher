// Small display helpers shared by the pages

export function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "1 h 05 min", "12 min", "less than a minute"
export function formatDuration(start, end = new Date()) {
  const minutes = Math.floor((new Date(end) - new Date(start)) / 60000);
  if (minutes < 1) return "less than a minute";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return `${hours} h ${String(rest).padStart(2, "0")} min`;
}

// Nominatim names are long ("Place, Area, City, District, State, PIN, Country").
// Keep the first two parts for list views.
export function shortPlace(name) {
  if (!name) return "";
  return name.split(",").slice(0, 2).join(",").trim();
}

export const STATUS_STYLES = {
  active: "bg-green-100 text-green-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-amber-100 text-amber-700",
  resolved: "bg-slate-100 text-slate-600",
};
