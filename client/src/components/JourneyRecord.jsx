import { MapPin, Clock, AlertCircle, ExternalLink } from "lucide-react";

const isUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);

export default function JourneyRecord({ record }) {
  const { activityName, eventID, totalHours, checkins = [] } = record;

  return (
    <div className="bg-white rounded-2xl ring-1 ring-ink-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-ink-50 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm sm:text-base text-ink-900 leading-snug line-clamp-2">
            {activityName}
          </h3>
          <p className="text-[11px] text-ink-400 font-mono mt-1 truncate">
            {eventID}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] uppercase tracking-wide text-ink-400">
            Total
          </p>
          <p className="text-sm font-semibold text-ink-900">{totalHours}</p>
        </div>
      </div>

      {/* Check-ins */}
      <ul className="divide-y divide-ink-50">
        {checkins.map((c, i) => (
          <li key={c.activityID || i} className="p-4 sm:p-5 space-y-2.5">
            {/* Times row */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-ink-700">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium">{c.checkinTime}</span>
              </div>
              <span className="text-ink-300">→</span>
              <div className="flex items-center gap-1.5 text-ink-700">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span className="font-medium">
                  {c.checkoutTime || "—"}
                </span>
              </div>
              <span className="ml-auto text-[11px] font-mono px-2 py-0.5 rounded-md bg-ink-50 text-ink-700">
                {c.duration}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-start gap-1.5 text-xs text-ink-600">
              <MapPin className="w-3.5 h-3.5 text-ink-400 mt-0.5 shrink-0" />
              {isUrl(c.sevaKendra) ? (
                <a
                  href={c.sevaKendra}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:underline inline-flex items-center gap-1 break-all"
                >
                  Open in Maps
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="break-words">{c.sevaKendra || "—"}</span>
              )}
            </div>

            {/* Remarks */}
            {c.remarks && (
              <div className="flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50 ring-1 ring-amber-100 rounded-lg px-2.5 py-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{c.remarks}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}