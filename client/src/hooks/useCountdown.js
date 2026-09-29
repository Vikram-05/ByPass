import { useEffect, useState } from "react";

/**
 * Returns a live-formatted remaining time string for a target timestamp.
 * Ticks once per second. Returns "" if no target.
 */
export default function useCountdown(targetTs) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!targetTs) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetTs]);

  if (!targetTs) return "";

  const diff = Math.max(0, targetTs - now);
  const s = Math.floor(diff / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (diff <= 0) return "due now";
  if (h > 0) return `${h}h ${m}m ${String(sec).padStart(2, "0")}s`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}