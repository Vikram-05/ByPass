import { useEffect, useState } from "react";
import { Timer, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { loadJobs, removeJob } from "../utils/schedule";
import useCountdown from "../hooks/useCountdown";

function JobRow({ job, onCancel, variant = "pending" }) {
  const remaining = useCountdown(job.status === "pending" ? job.scheduledAt : null);
  const styles =
    variant === "pending"
      ? {
          wrap: "bg-rose-50 ring-rose-100",
          icon: job.status === "running"
            ? <Loader2 className="w-4 h-4 text-rose-600 animate-spin" />
            : <Timer className="w-4 h-4 text-rose-600" />,
          title: "text-rose-900",
          sub: "text-rose-700",
        }
      : job.status === "completed"
      ? {
          wrap: "bg-emerald-50 ring-emerald-100",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          title: "text-emerald-900",
          sub: "text-ink-600",
        }
      : {
          wrap: "bg-amber-50 ring-amber-100",
          icon: <AlertCircle className="w-4 h-4 text-amber-600" />,
          title: "text-amber-900",
          sub: "text-ink-600",
        };

  const title =
    variant === "pending"
      ? "Auto check-out scheduled"
      : job.status === "completed"
      ? "Auto check-out completed"
      : "Auto check-out failed";

  return (
    <div
      className={`flex items-center gap-3 ${styles.wrap} ring-1 rounded-xl px-4 py-2.5`}
    >
      {styles.icon}
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold truncate ${styles.title}`}>
          {title}
        </p>
        <p className={`text-[11px] truncate ${styles.sub}`}>
          {job.rideName}
          {variant === "pending" && (
            <>
              {" · fires in "}
              <span className="tabular-nums font-medium">{remaining}</span>
            </>
          )}
          {job.error ? ` · ${job.error}` : ""}
        </p>
      </div>
      <button
        onClick={() => onCancel(job.id)}
        className="p-1.5 rounded-lg hover:bg-white/60 transition shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5 text-ink-500" />
      </button>
    </div>
  );
}

export default function ScheduledPanel() {
  const [jobs, setJobs] = useState(loadJobs());

  useEffect(() => {
    const reload = () => setJobs(loadJobs());
    window.addEventListener("bypass:jobs-changed", reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("bypass:jobs-changed", reload);
      window.removeEventListener("storage", reload);
    };
  }, []);

  const pending = jobs.filter(
    (j) => j.status === "pending" || j.status === "running"
  );
  const recent = jobs
    .filter((j) => j.status === "completed" || j.status === "failed")
    .slice(-2);

  if (pending.length === 0 && recent.length === 0) return null;

  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4 space-y-2">
      {pending.map((j) => (
        <JobRow key={j.id} job={j} onCancel={removeJob} />
      ))}
      {recent.map((j) => (
        <JobRow key={j.id} job={j} onCancel={removeJob} variant="recent" />
      ))}
    </div>
  );
}