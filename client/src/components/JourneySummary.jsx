import { Clock, MapPin, Activity, TrendingUp } from "lucide-react";

export default function JourneySummary({ summary }) {
  if (!summary) return null;

  const stats = [
    {
      label: "Total hours",
      value: summary.total_hours || "0:00",
      icon: Clock,
      accent: "bg-accent-500/10 text-accent-600",
    },
    {
      label: "Activities",
      value: summary.unique_activities ?? 0,
      icon: Activity,
      accent: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Locations",
      value: summary.unique_locations ?? 0,
      icon: MapPin,
      accent: "bg-sky-500/10 text-sky-600",
    },
    {
      label: "Records",
      value: summary.total_records ?? 0,
      icon: TrendingUp,
      accent: "bg-violet-500/10 text-violet-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map(({ label, value, icon: Icon, accent }) => (
        <div
          key={label}
          className="bg-white rounded-2xl ring-1 ring-ink-100 p-4 sm:p-5"
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${accent}`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <p className="text-[11px] uppercase tracking-wide text-ink-400">
            {label}
          </p>
          <p className="text-lg sm:text-xl font-semibold text-ink-900 mt-0.5">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}