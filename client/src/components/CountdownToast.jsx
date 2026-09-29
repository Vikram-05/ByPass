import { useEffect } from "react";
import { Timer, X } from "lucide-react";
import useCountdown from "../hooks/useCountdown";

/**
 * Toast with a live countdown towards `scheduledAt` (ms timestamp).
 * Auto-dismisses when `autoCloseAfter` ms elapse (default: 8s).
 */
export default function CountdownToast({ toast, onClose }) {
  const remaining = useCountdown(toast?.scheduledAt);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, toast.autoCloseAfter ?? 8000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] animate-toast-in">
      <div className="flex items-start gap-3 bg-rose-50 ring-1 ring-rose-200 rounded-xl shadow-lg px-4 py-3 max-w-md">
        <Timer className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink-900">
            {toast.title || "Auto check-out scheduled"}
          </p>
          <p className="text-xs text-ink-600 mt-0.5 break-words">
            {toast.message}
          </p>
          {toast.scheduledAt && (
            <p className="text-xs font-medium text-rose-700 mt-1">
              Fires in <span className="tabular-nums">{remaining}</span>
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/60 transition shrink-0"
        >
          <X className="w-4 h-4 text-ink-500" />
        </button>
      </div>
    </div>
  );
}