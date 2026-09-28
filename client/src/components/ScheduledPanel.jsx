import { useEffect, useState } from "react";
import { Timer, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { loadJobs, removeJob } from "../utils/schedule";

function timeLeft(ms) {
  if (ms <= 0) return "due";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export default function ScheduledPanel() {
  const [jobs, setJobs] = useState(loadJobs());
  const [, force] = useState(0);

  // re-read on schedule changes
  useEffect(() => {
    const reload = () => setJobs(loadJobs());
    window.addEventListener("bypass:jobs-changed", reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("bypass:jobs-changed", reload);
      window.removeEventListener("storage", reload);
    };
  }, []);

  // tick every second for countdown
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const now = Date.now();
  const pending = jobs.filter((j) => j.status === "pending" || j.status === "running");
  const recent = jobs
    .filter((j) => j.status === "completed" || j.status === "failed")
    .slice(-2);

  if (pending.length === 0 && recent.length === 0) return null;

  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4 space-y-2">
      {pending.map((j) => (
        <div
          key={j.id}
          className="flex items-center gap-3 bg-rose-50 ring-1 ring-rose-100 rounded-xl px-4 py-2.5"
        >
          {j.status === "running" ? (
            <Loader2 className="w-4 h-4 text-rose-600 animate-spin" />
          ) : (
            <Timer className="w-4 h-4 text-rose-600" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-rose-900 truncate">
              Auto check-out scheduled
            </p>
            <p className="text-[11px] text-rose-700 truncate">
              {j.rideName} · fires in {timeLeft(j.scheduledAt - now)} ·
              {" "}
              {new Date(j.scheduledAt).toLocaleString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short",
              })}
            </p>
          </div>
          <button
            onClick={() => removeJob(j.id)}
            className="p-1.5 rounded-lg hover:bg-rose-100 transition"
            aria-label="Cancel scheduled checkout"
          >
            <X className="w-3.5 h-3.5 text-rose-600" />
          </button>
        </div>
      ))}

      {recent.map((j) => (
        <div
          key={j.id}
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ring-1 ${
            j.status === "completed"
              ? "bg-emerald-50 ring-emerald-100"
              : "bg-amber-50 ring-amber-100"
          }`}
        >
          {j.status === "completed" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600" />
          )}
          <div className="min-w-0 flex-1">
            <p
              className={`text-xs font-semibold truncate ${
                j.status === "completed"
                  ? "text-emerald-900"
                  : "text-amber-900"
              }`}
            >
              {j.status === "completed"
                ? "Auto check-out completed"
                : "Auto check-out failed"}
            </p>
            <p className="text-[11px] text-ink-600 truncate">
              {j.rideName}
              {j.error ? ` · ${j.error}` : ""}
            </p>
          </div>
          <button
            onClick={() => removeJob(j.id)}
            className="p-1.5 rounded-lg hover:bg-white/60 transition"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5 text-ink-500" />
          </button>
        </div>
      ))}
    </div>
  );
}