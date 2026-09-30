import { Clock, MapPin, Activity, TrendingUp } from "lucide-react";

/**
 * Convert "HH:MM" (e.g. "55:52") to decimal hours.
 */
function hoursFromString(hhmm) {
  if (typeof hhmm !== "string") return 0;
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10) || 0);
  return h + m / 60;
}

export default function JourneySummary({ summary }) {
  if (!summary) return null;

  const totalHoursStr = summary.total_hours || "0:00";
  const totalHoursNum = hoursFromString(totalHoursStr);

  /**
   * Threshold-based theme for the whole "Total hours" card.
   *   < 20h   → rose    (needs more)
   *   20–60h  → amber   (in progress)
   *   > 60h   → emerald (goal reached)
   */
  const hoursTheme =
    totalHoursNum > 60
      ? {
          card: "bg-emerald-50 ring-emerald-200",
          pill: "bg-emerald-500/15 text-emerald-700",
          label: "text-emerald-700",
          value: "text-emerald-900",
        }
      : totalHoursNum >= 20
      ? {
          card: "bg-accent-500/10 ring-accent-500/20",
          pill: "bg-accent-500/20 text-accent-600",
          label: "text-accent-600",
          value: "text-ink-900",
        }
      : {
          card: "bg-rose-50 ring-rose-200",
          pill: "bg-rose-500/15 text-rose-700",
          label: "text-rose-700",
          value: "text-rose-900",
        };

  const stats = [
    {
      label: "Total hours",
      value: totalHoursStr,
      icon: Clock,
      theme: hoursTheme,
    },
    {
      label: "Activities",
      value: summary.unique_activities ?? 0,
      icon: Activity,
      theme: {
        card: "bg-white ring-ink-100",
        pill: "bg-emerald-500/10 text-emerald-600",
        label: "text-ink-400",
        value: "text-ink-900",
      },
    },
    {
      label: "Locations",
      value: summary.unique_locations ?? 0,
      icon: MapPin,
      theme: {
        card: "bg-white ring-ink-100",
        pill: "bg-sky-500/10 text-sky-600",
        label: "text-ink-400",
        value: "text-ink-900",
      },
    },
    {
      label: "Records",
      value: summary.total_records ?? 0,
      icon: TrendingUp,
      theme: {
        card: "bg-white ring-ink-100",
        pill: "bg-violet-500/10 text-violet-600",
        label: "text-ink-400",
        value: "text-ink-900",
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map(({ label, value, icon: Icon, theme }) => (
        <div
          key={label}
          className={`rounded-2xl ring-1 p-4 sm:p-5 transition ${theme.card}`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${theme.pill}`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <p
            className={`text-[11px] uppercase tracking-wide ${theme.label}`}
          >
            {label}
          </p>
          <p
            className={`text-lg sm:text-xl font-semibold mt-0.5 tabular-nums ${theme.value}`}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}