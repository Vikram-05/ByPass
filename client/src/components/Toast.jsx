import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const styles = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      ring: "ring-emerald-200",
      bg: "bg-emerald-50",
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-rose-600" />,
      ring: "ring-rose-200",
      bg: "bg-rose-50",
    },
    info: {
      icon: <Info className="w-5 h-5 text-sky-600" />,
      ring: "ring-sky-200",
      bg: "bg-sky-50",
    },
  }[toast.type || "info"];

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] animate-toast-in">
      <div
        className={`flex items-start gap-3 ${styles.bg} ${styles.ring} ring-1 rounded-xl shadow-lg px-4 py-3 max-w-md`}
      >
        {styles.icon}
        <div className="flex-1">
          {toast.title && (
            <p className="text-sm font-semibold text-ink-900">{toast.title}</p>
          )}
          {toast.message && (
            <p className="text-xs text-ink-600 mt-0.5">{toast.message}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/60 transition"
        >
          <X className="w-4 h-4 text-ink-500" />
        </button>
      </div>
    </div>
  );
}