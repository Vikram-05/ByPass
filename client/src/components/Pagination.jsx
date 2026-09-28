import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  pageSize,
  onPage,
  onPageSize,
  total,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 bg-white rounded-2xl ring-1 ring-ink-100 p-3">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <span>Page size</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="px-2 py-1.5 rounded-lg bg-ink-50 ring-1 ring-ink-100 text-ink-800 text-xs focus:outline-none focus:ring-2 focus:ring-accent-400"
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="text-ink-400">
          · {total} total · page {page} of {totalPages}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* windowed page numbers */}
        {windowPages(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-2 text-xs text-ink-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`min-w-[34px] h-8 px-2 text-xs font-medium rounded-lg transition ${
                p === page
                  ? "bg-ink-900 text-white"
                  : "bg-ink-50 text-ink-700 hover:bg-ink-100"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function windowPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  pages.push(1);
  if (left > 2) pages.push("…");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}