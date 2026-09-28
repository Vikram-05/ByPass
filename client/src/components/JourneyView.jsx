import { Loader } from "lucide-react";
import JourneySummary from "./JourneySummary";
import JourneyRecord from "./JourneyRecord";
import Pagination from "./Pagination";

export default function JourneyView({
  summary,
  records,
  loading,
  page,
  totalPages,
  pageSize,
  total,
  onPage,
  onPageSize,
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-up">
      {/* Heading */}
      <div className="mb-5">
        <h2 className="text-2xl font-semibold tracking-tight">Journey</h2>
        <p className="text-sm text-ink-500 mt-1">
          Your completed hours and check-in history
        </p>
      </div>

      {/* Summary cards */}
      {summary && <JourneySummary summary={summary} />}

      {/* Records */}
      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader className="w-5 h-5 text-ink-400 animate-spin" />
            <p className="text-sm text-ink-500">Loading records…</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl ring-1 ring-ink-100">
            <p className="text-sm text-ink-500">No journey records yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((r) => (
              <JourneyRecord key={r.eventID} record={r} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          total={total}
          onPage={onPage}
          onPageSize={onPageSize}
        />
      )}
    </div>
  );
}