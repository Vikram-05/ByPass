import { useEffect, useState } from "react";
import {
  X,
  LogIn,
  LogOut,
  QrCode,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import MapPicker from "./MapPicker";
import TimePicker from "./TimePicker";

export default function ActionModal({
  open,
  mode, // "in" | "out"
  event,
  riderId,
  onClose,
  onSubmit,
  submitting,
}) {
  const [location, setLocation] = useState(null);
  const [time, setTime] = useState(new Date());
  const [qrCode, setQrCode] = useState("12345");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setLocation(null);
      setTime(new Date());
      setQrCode(mode === "in" ? "12345" : "139985");
      setError("");
    }
  }, [open, mode]);

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  const isIn = mode === "in";
  const title = isIn ? "Check In" : "Check Out";
  const accent = isIn ? "emerald" : "rose";

  const handleSubmit = () => {
    setError("");
    if (!location) {
      setError("Please select a location on the map.");
      return;
    }
    if (!qrCode.trim()) {
      setError("QR code is required.");
      return;
    }
    if (!time) {
      setError("Please select a time.");
      return;
    }
    onSubmit({
      mode,
      eventID: event.challengeID,
      riderID: riderId,
      address: location.address,
      qrCode: qrCode.trim(),
      latitude: location.latitude,
      longitude: location.longitude,
      time,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto animate-fade-up">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-ink-100 px-5 sm:px-6 py-4 flex items-start justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isIn
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {isIn ? (
                <LogIn className="w-5 h-5" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-ink-900 leading-tight">
                {title}
              </h3>
              <p className="text-xs text-ink-500 line-clamp-1 max-w-[240px] sm:max-w-md">
                {event.rideName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-ink-50 transition"
          >
            <X className="w-4 h-4 text-ink-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6">
          <MapPicker value={location} onChange={setLocation} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <TimePicker
              value={time}
              onChange={setTime}
              label={`${title} time`}
            />

            <div>
              <label className="text-xs font-medium text-ink-600 flex items-center gap-1.5 mb-2">
                <QrCode className="w-3.5 h-3.5" />
                QR Code
              </label>
              <input
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder={isIn ? "12345" : "139985"}
                className="w-full px-3 py-2.5 rounded-xl bg-ink-50 border border-ink-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent-400 focus:bg-white transition"
              />
              <p className="text-[10px] text-ink-400 mt-1">
                Default value pre-filled from previous session.
              </p>
            </div>
          </div>

          {/* Info strip */}
          <div className="rounded-xl bg-ink-50 ring-1 ring-ink-100 p-4 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-ink-500">Member ID</span>
              <span className="font-medium text-ink-800 font-mono">
                {riderId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Event ID</span>
              <span className="font-medium text-ink-800 font-mono truncate max-w-[60%]">
                {event.challengeID}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Action</span>
              <span
                className={`font-semibold ${
                  isIn ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {title.toUpperCase()}
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-ink-50 text-ink-700 hover:bg-ink-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50 ${
                isIn
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {submitting ? "Submitting…" : `Confirm ${title}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}