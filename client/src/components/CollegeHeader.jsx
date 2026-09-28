import { GraduationCap, Hash, User } from "lucide-react";

export default function CollegeHeader({ college, masterEvent, student }) {
  if (!college && !masterEvent && !student) return null;

  return (
    <div className="bg-white rounded-2xl ring-1 ring-ink-100 p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {masterEvent?.rideLogo ? (
          <img
            src={masterEvent.rideLogo}
            alt=""
            className="w-12 h-12 rounded-xl object-cover ring-1 ring-ink-100"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-ink-50 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-ink-500" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-ink-400">
            {masterEvent?.rideName || "College"}
          </p>
          <h2 className="text-sm sm:text-base font-semibold text-ink-900 truncate">
            {college?.name || "—"}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {student?.usn && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-ink-50 ring-1 ring-ink-100 text-ink-700">
            <Hash className="w-3 h-3" />
            {student.usn}
          </span>
        )}
        {student?.rider_id && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-ink-900 text-white">
            <User className="w-3 h-3" />
            {student.rider_id}
          </span>
        )}
      </div>
    </div>
  );
}