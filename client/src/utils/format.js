export const formatDateTime = (value) => {
  if (!value) return "";
  // value like "2026-Sep-28 22:51"
  const normalized = value.replace(/-/g, " ");
  const d = new Date(value.replace(/-/g, " "));
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const toApiTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${months[d.getMonth()]}-${pad(
    d.getDate()
  )}+${pad(d.getHours())}%3A${pad(d.getMinutes())}`;
};

export const toApiTimeRaw = (date) => {
  // raw string before URL encoding (axios will encode for us)
  const d = date instanceof Date ? date : new Date(date);
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${months[d.getMonth()]}-${pad(
    d.getDate()
  )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value.replace(" ", "T"));
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};