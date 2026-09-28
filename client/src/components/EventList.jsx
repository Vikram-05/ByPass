import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Layers,
  Filter,
} from "lucide-react";
import EventCard from "./EventCard";
import SourceTabs from "./SourceTabs";
import StatusTabs from "./StatusTabs";
import CollegeHeader from "./CollegeHeader";
import Pagination from "./Pagination";

export default function EventList({
  source,
  onSourceChange,
  events,
  onSelect,
  collegeMeta,
  status,
  onStatusChange,
  page,
  totalPages,
  pageSize,
  total,
  onPage,
  onPageSize,
  onCategoryChange,
  categories = [],
  loading,
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const filtered = useMemo(() => {
    let list = events;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.rideName?.toLowerCase().includes(q) ||
          e.challengeID?.toLowerCase().includes(q) ||
          e.event_category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [events, query]);

  const handleCategory = (val) => {
    setCategory(val);
    onCategoryChange?.(val);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-up">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {source === "college" ? "All Events" : "My Events"}
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            {source === "college"
              ? "Browse everything happening at your college"
              : "Events you've joined"}
          </p>
        </div>
        
      </div>

      {/* College meta */}
      {source === "college" && collegeMeta && (
        <CollegeHeader
          college={collegeMeta.college}
          masterEvent={collegeMeta.master_event}
          student={collegeMeta.student}
        />
      )}

      {/* Status tabs */}
      {source === "college" && (
        <div className="mb-5">
          <StatusTabs
            value={status}
            counts={collegeMeta?.counts}
            onChange={onStatusChange}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ID or category…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white ring-1 ring-ink-100 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 transition"
          />
        </div>

        {source === "college" && categories.length > 0 && (
          <div className="relative lg:w-72">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
            <select
              value={category}
              onChange={(e) => handleCategory(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white ring-1 ring-ink-100 text-sm text-ink-700 focus:outline-none focus:ring-2 focus:ring-accent-400 transition appearance-none"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {source === "my" && (
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl ring-1 ring-ink-100">
            <SlidersHorizontal className="w-4 h-4 text-ink-400 ml-2" />
            <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-ink-900 text-white">
              All
            </span>
          </div>
        )}
      </div>

      {/* List — 2 cols on small, 2 on sm, 3 on lg */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 sm:h-72 rounded-2xl bg-white ring-1 ring-ink-100 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl ring-1 ring-ink-100">
          <Layers className="w-8 h-8 text-ink-300 mx-auto mb-3" />
          <p className="text-sm text-ink-500">No events match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {filtered.map((ev) => (
            <EventCard
              key={`${ev.source}-${ev.id}`}
              event={ev}
              onClick={onSelect}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {source === "college" && totalPages > 0 && (
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