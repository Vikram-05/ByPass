import { Timer, X, CheckCircle2, AlertCircle, Loader2, LogIn, LogOut } from "lucide-react";
import useCountdown from "../hooks/useCountdown";

function JobRow({ job, onCancel }) {
  const isPending =
    job.status === "delayed" ||
    job.status === "waiting" ||
    job.status === "active";

  const remaining = useCountdown(isPending ? job.scheduledAt : null);
  const mode = job.mode || "out";
  const isIn = mode === "in";

  const style = isPending
    ? isIn
      ? { wrap: "bg-emerald-50 ring-emerald-100", title: "text-emerald-900", sub: "text-emerald-700" }
      : { wrap: "bg-rose-50 ring-rose-100", title: "text-rose-900", sub: "text-rose-700" }
    : job.status === "completed"
    ? { wrap: "bg-emerald-50 ring-emerald-100", title: "text-emerald-900", sub: "text-ink-600" }
    : { wrap: "bg-amber-50 ring-amber-100", title: "text-amber-900", sub: "text-ink-600" };

  const title = isPending
    ? isIn
      ? "Auto check-in scheduled"
      : "Auto check-out scheduled"
    : job.status === "completed"
    ? isIn
      ? "Auto check-in completed"
      : "Auto check-out completed"
    : isIn
    ? "Auto check-in failed"
    : "Auto check-out failed";

  return (
    <div className={`flex items-center gap-3 ${style.wrap} ring-1 rounded-xl px-4 py-2.5`}>
      {job.status === "active" ? (
        <Loader2 className={`w-4 h-4 animate-spin ${isIn ? "text-emerald-600" : "text-rose-600"}`} />
      ) : job.status === "completed" ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      ) : job.status === "failed" ? (
        <AlertCircle className="w-4 h-4 text-amber-600" />
      ) : isIn ? (
        <LogIn className="w-4 h-4 text-emerald-600" />
      ) : (
        <LogOut className="w-4 h-4 text-rose-600" />
      )}
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold truncate ${style.title}`}>{title}</p>
        <p className={`text-[11px] truncate ${style.sub}`}>
          {job.rideName}
          {isPending && (
            <>
              {" · fires in "}
              <span className="tabular-nums font-medium">{remaining}</span>
            </>
          )}
          {job.failedReason ? ` · ${job.failedReason}` : ""}
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

export default function ScheduledPanel({ jobs = [], onCancel }) {
  const pending = jobs.filter(
    (j) => j.status === "delayed" || j.status === "waiting" || j.status === "active"
  );
  const recent = jobs
    .filter((j) => j.status === "completed" || j.status === "failed")
    .slice(-3);

  if (pending.length === 0 && recent.length === 0) return null;

  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4 space-y-2">
      {pending.map((j) => (
        <JobRow key={j.id} job={j} onCancel={onCancel} />
      ))}
      {recent.map((j) => (
        <JobRow key={j.id} job={j} onCancel={onCancel} />
      ))}
    </div>
  );
}