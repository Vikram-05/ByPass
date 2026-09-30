import { useEffect, useState } from "react";
import {
  X,
  LogIn,
  LogOut,
  QrCode,
  AlertCircle,
  Clock,
  Zap,
  Timer,
  CalendarClock,
} from "lucide-react";
import MapPicker from "./MapPicker";
import { toLocalInputValue } from "../utils/format";

const PRESETS = [
  { label: "Now", ms: 0 },
  { label: "+30m", ms: 30 * 60 * 1000 },
  { label: "+1h", ms: 60 * 60 * 1000 },
  { label: "+2h", ms: 2 * 60 * 60 * 1000 },
  { label: "+4h", ms: 4 * 60 * 60 * 1000 },
  { label: "+8h", ms: 8 * 60 * 60 * 1000 },
];

export default function ActionModal({
  open,
  mode,        // "in" | "out"
  scheduled,   // true = scheduled, false = immediate
  event,
  riderId,
  onClose,
  onSubmit,
  onSchedule,
  submitting,
}) {
  const [location, setLocation] = useState(null);
  const [qrCode, setQrCode] = useState(mode === "in" ? "12345" : "139985");
  const [error, setError] = useState("");
  const [scheduleAt, setScheduleAt] = useState(
    new Date(Date.now() + 60 * 60 * 1000)
  );

  useEffect(() => {
    if (open) {
      setLocation(null);
      setQrCode(mode === "in" ? "12345" : "139985");
      setError("");
      setScheduleAt(new Date(Date.now() + 60 * 60 * 1000));
    }
  }, [open, mode]);

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const isIn = mode === "in";
  const isScheduled = !!scheduled;

  const title = isScheduled
    ? isIn
      ? "Schedule Check In"
      : "Schedule Check Out"
    : isIn
    ? "Check In"
    : "Check Out";

  if (!open) return null;

  const applyPreset = (ms) => setScheduleAt(new Date(Date.now() + ms));

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

    if (isScheduled) {
      // No time restriction at all — past times fire immediately.
      onSchedule({
        mode,
        riderID: riderId,
        eventID: event.challengeID,
        rideName: event.rideName,
        address: location.address,
        qrCode: qrCode.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        scheduledAt: scheduleAt.getTime(),
      });
    } else {
      onSubmit({
        mode,
        eventID: event.challengeID,
        riderID: riderId,
        address: location.address,
        qrCode: qrCode.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        time: new Date(),
      });
    }
  };

  const isPast = scheduleAt.getTime() <= Date.now();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto animate-fade-up">
        <div className="sticky top-0 z-10 bg-white border-b border-ink-100 px-5 sm:px-6 py-4 flex items-start justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isIn
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {isScheduled ? (
                <CalendarClock className="w-5 h-5" />
              ) : isIn ? (
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

        <div className="p-5 sm:p-6 space-y-6">
          <MapPicker value={location} onChange={setLocation} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {isScheduled ? (
              <div>
                <label className="text-xs font-medium text-ink-600 flex items-center gap-1.5 mb-2">
                  <Timer className="w-3.5 h-3.5" />
                  Auto {isIn ? "check-in" : "check-out"} at
                </label>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESETS.map(({ label, ms }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => applyPreset(ms)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-ink-50 hover:bg-ink-100 text-ink-700 ring-1 ring-ink-100 transition"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* No min attribute — any time allowed */}
                <input
                  type="datetime-local"
                  value={toLocalInputValue(scheduleAt)}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) setScheduleAt(new Date(v));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-ink-50 border border-ink-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:bg-white transition"
                />
                <p className="text-[10px] text-ink-400 mt-1">
                  {isPast
                    ? "Time is in the past — it will fire immediately."
                    : `ByPass will automatically ${
                        isIn ? "check you in" : "check you out"
                      } at this time.`}{" "}
                  You can cancel anytime.
                </p>
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-ink-600 flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  {isIn ? "Check-in time" : "Check-out time"}
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-ink-50 border border-ink-100 text-sm">
                  <Zap
                    className={`w-3.5 h-3.5 ${
                      isIn ? "text-emerald-600" : "text-rose-600"
                    }`}
                  />
                  <span className="font-medium text-ink-800">Right now</span>
                  <span className="text-ink-400 text-xs ml-auto">
                    {new Date().toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            )}

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
                Pre-filled but editable.
              </p>
            </div>
          </div>

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
                {isScheduled
                  ? isIn
                    ? "AUTO CHECK IN"
                    : "AUTO CHECK OUT"
                  : isIn
                  ? "CHECK IN NOW"
                  : "CHECK OUT NOW"}
              </span>
            </div>
            {isScheduled && (
              <div className="flex justify-between">
                <span className="text-ink-500">Scheduled</span>
                <span className="font-medium text-ink-800">
                  {scheduleAt.toLocaleString("en-IN")}
                  {isPast && (
                    <span className="text-ink-400 font-normal"> · now</span>
                  )}
                </span>
              </div>
            )}
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
              {submitting
                ? "Submitting…"
                : isScheduled
                ? isPast
                  ? `Run ${isIn ? "Check In" : "Check Out"} Now`
                  : `Schedule ${isIn ? "Check In" : "Check Out"}`
                : `Confirm ${isIn ? "Check In" : "Check Out"}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}