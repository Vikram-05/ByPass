export const formatDateTime = (value) => {
  if (!value) return "";
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

/** Return "YYYY-Mon-DD HH:MM" for the Cykul scan endpoint. */
export const toApiTimeRaw = (date) => {
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

/** Local value for <input type="datetime-local"> */
export const toLocalInputValue = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};