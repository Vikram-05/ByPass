import {
  ArrowLeft,
  Calendar,
  LogIn,
  LogOut,
  Info,
  MapPin,
  Users,
  Trophy,
  Hash,
  Ticket,
  GraduationCap,
  UserPlus,
  Loader2,
  CalendarClock,
} from "lucide-react";
import { formatDateTime } from "../utils/format";

export default function EventDetail({
  event,
  onBack,
  onAction,              // (mode, { scheduled }) → opens modal
  onJoin,
  joining,
  checkedIn,
  hasScheduledCheckin,
  hasScheduledCheckout,
  collegeMeta,
}) {
  const joined = event.Joined === "Yes";
  const finished = event.finished === "1";
  const isCollege = event.source === "college";
  const isMyEvent = event.source === "cykul";

  const infoRows = [
    { label: "Event ID", value: event.challengeID, mono: true, icon: Hash },
    {
      label: "Starts",
      value: formatDateTime(event.date || event.startedDate),
      icon: Calendar,
    },
    {
      label: "Ends",
      value: event.endDate ? formatDateTime(event.endDate) : "—",
      icon: Calendar,
    },
    { label: "Type", value: event.eventType || "Event", icon: Users },
  ];

  if (event.event_category) {
    infoRows.push({
      label: "Category",
      value: event.event_category,
      icon: GraduationCap,
    });
  }

  if (event.invitationCode) {
    infoRows.push({
      label: "Invitation code",
      value: event.invitationCode,
      mono: true,
      icon: Ticket,
    });
  }

  if (event.leaderboard) {
    infoRows.push({
      label: "Leaderboard",
      value: event.leaderboard,
      icon: Trophy,
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-up">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-900 mb-5 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to events
      </button>

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden ring-1 ring-ink-100 bg-ink-100">
        <div className="h-44 sm:h-56 relative">
          {event.rideBanner ? (
            <img
              src={event.rideBanner}
              alt={event.rideName}
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <div className="flex gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wide bg-white/90 backdrop-blur px-2 py-1 rounded-md text-ink-700">
                {isMyEvent
                  ? event.category || "Event"
                  : isCollege
                  ? "College Event"
                  : "Event"}
              </span>
              {joined && isMyEvent && (
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-emerald-500 text-white px-2 py-1 rounded-md">
                  Joined
                </span>
              )}
              {finished && (
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-ink-800 text-white px-2 py-1 rounded-md">
                  Finished
                </span>
              )}
            </div>
            <h1 className="text-white text-xl sm:text-2xl font-semibold leading-snug max-w-2xl">
              {event.rideName}
            </h1>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="bg-white rounded-2xl ring-1 ring-ink-100 p-5 sm:col-span-2">
          <h2 className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-4">
            Event details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {infoRows.map(({ label, value, mono, icon: Icon }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-ink-50 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-ink-500" />
                </div>
                <div className="min-w-0">
                  <dt className="text-[11px] text-ink-400">{label}</dt>
                  <dd
                    className={`text-sm font-medium text-ink-900 break-words ${
                      mono ? "font-mono text-xs" : ""
                    }`}
                  >
                    {value || "—"}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        {event.about && event.about !== "undefined" && (
          <div className="bg-white rounded-2xl ring-1 ring-ink-100 p-5 sm:col-span-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-ink-50 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-ink-500" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-ink-900">
                  About this event
                </h3>
                <p className="text-xs text-ink-600 mt-1 leading-relaxed whitespace-pre-line">
                  {event.about}
                </p>
              </div>
            </div>
          </div>
        )}

        {isMyEvent && (
          <div className="bg-white rounded-2xl ring-1 ring-ink-100 p-5 sm:col-span-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-accent-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-900">
                  How it works
                </h3>
                <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                  <strong>Check In</strong> / <strong>Check Out</strong> fire
                  immediately at your current location.{" "}
                  <strong>Schedule</strong> lets you pick <em>any</em> time —
                  past, present, or future. If the time is in the past, it
                  fires right away. ByPass runs it automatically — even if
                  you close the browser.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* College meta */}
      {isCollege && collegeMeta && (
        <div className="bg-white rounded-2xl ring-1 ring-ink-100 p-5 mt-6 flex items-center gap-4">
          {collegeMeta.master_event?.rideLogo && (
            <img
              src={collegeMeta.master_event.rideLogo}
              alt=""
              className="w-12 h-12 rounded-xl object-cover ring-1 ring-ink-100"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-ink-400">
              College
            </p>
            <p className="text-sm font-semibold text-ink-900 truncate">
              {collegeMeta.college?.name || "—"}
            </p>
            {collegeMeta.student?.usn && (
              <p className="text-[11px] text-ink-500 font-mono mt-0.5">
                USN {collegeMeta.student.usn}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ---------------- Actions ---------------- */}
      <div className="mt-6 space-y-3">
        {isCollege && event.invitationCode && (
          <button
            onClick={onJoin}
            disabled={joining}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-ink-900 text-white font-medium text-sm hover:bg-ink-800 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm"
          >
            {joining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Joining…
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Join Event
              </>
            )}
          </button>
        )}

        {isMyEvent && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Immediate Check In */}
            <button
              onClick={() => onAction("in", { scheduled: false })}
              disabled={checkedIn}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              {checkedIn ? "Already Checked In" : "Check In"}
            </button>

            {/* Immediate Check Out */}
            <button
              onClick={() => onAction("out", { scheduled: false })}
              disabled={!checkedIn}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-rose-600 text-white font-medium text-sm hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Check Out
            </button>

            {/* Schedule Check In — always enabled unless already scheduled */}
            <button
              onClick={() => onAction("in", { scheduled: true })}
              disabled={hasScheduledCheckin}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white text-emerald-700 ring-1 ring-emerald-200 font-medium text-sm hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <CalendarClock className="w-4 h-4" />
              {hasScheduledCheckin ? "Check-in Scheduled" : "Schedule Check In"}
            </button>

            {/* Schedule Check Out — always enabled unless already scheduled */}
            <button
              onClick={() => onAction("out", { scheduled: true })}
              disabled={hasScheduledCheckout}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white text-rose-700 ring-1 ring-rose-200 font-medium text-sm hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <CalendarClock className="w-4 h-4" />
              {hasScheduledCheckout
                ? "Check-out Scheduled"
                : "Schedule Check Out"}
            </button>
          </div>
        )}
      </div>

      {isMyEvent ? (
        <p className="text-[11px] text-ink-400 text-center mt-4 flex items-center justify-center gap-1">
          <MapPin className="w-3 h-3" />
          Location, time, and QR code are sent to the server on confirm.
        </p>
      ) : (
        <p className="text-[11px] text-ink-400 text-center mt-4 flex items-center justify-center gap-1">
          <MapPin className="w-3 h-3" />
          Join this event to enable check-in / check-out.
        </p>
      )}
    </div>
  );
}