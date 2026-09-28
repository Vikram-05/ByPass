import { Clock } from "lucide-react";

export default function TimePicker({ value, onChange, label = "Time" }) {
  // value is a Date
  const toLocalInput = (d) => {
    const date = d instanceof Date ? d : new Date(d);
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handle = (e) => {
    const v = e.target.value;
    if (!v) return;
    onChange(new Date(v));
  };

  const setNow = () => onChange(new Date());

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-ink-600 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {label}
        </label>
        <button
          type="button"
          onClick={setNow}
          className="text-[11px] font-medium text-ink-500 hover:text-ink-900 transition"
        >
          Use now
        </button>
      </div>
      <input
        type="datetime-local"
        value={toLocalInput(value)}
        onChange={handle}
        className="w-full px-3 py-2.5 rounded-xl bg-ink-50 border border-ink-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:bg-white transition"
      />
    </div>
  );
}