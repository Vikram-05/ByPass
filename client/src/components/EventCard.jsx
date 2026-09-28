import {
  Calendar,
  MapPin,
  ArrowRight,
  Users,
  GraduationCap,
  Ticket,
} from "lucide-react";
import { formatDate } from "../utils/format";

export default function EventCard({ event, onClick }) {
  const joined = event.Joined === "Yes";
  const isCollege = event.source === "college";

  return (
    <button
      onClick={() => onClick(event)}
      className="group text-left w-full bg-white rounded-2xl ring-1 ring-ink-100 hover:ring-ink-200 hover:shadow-md transition-all overflow-hidden flex flex-col"
    >
      {/* Banner — shorter on mobile */}
      <div className="relative h-24 sm:h-36 bg-ink-100 overflow-hidden shrink-0">
        {event.rideBanner ? (
          <img
            src={event.rideBanner}
            alt={event.rideName}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-300">
            <MapPin className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide bg-white/90 backdrop-blur px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-ink-700 inline-flex items-center gap-1">
            {isCollege ? (
              <>
                <GraduationCap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden xs:inline">College</span>
              </>
            ) : (
              event.eventType || "Event"
            )}
          </span>
          {joined && !isCollege && (
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/95 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
              Joined
            </span>
          )}
          {isCollege && event.invitationCode && (
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide bg-accent-500/95 text-ink-950 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md inline-flex items-center gap-1">
              <Ticket className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">{event.invitationCode}</span>
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-xs sm:text-sm leading-snug text-ink-900 line-clamp-2 group-hover:text-ink-700">
          {event.rideName}
        </h3>

        {event.event_category && (
          <p className="text-[10px] sm:text-[11px] text-ink-500 mt-1 line-clamp-1">
            {event.event_category}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 sm:mt-3 text-[10px] sm:text-xs text-ink-500">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(event.date || event.startedDate)}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1">
            <Users className="w-3 h-3" />
            {event.leaderboard || "Individual"}
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 sm:pt-3 border-t border-ink-50">
          <span className="text-[9px] sm:text-[11px] text-ink-400 font-mono truncate max-w-[60%]">
            {event.challengeID}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-ink-900">
            Open <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </button>
  );
}