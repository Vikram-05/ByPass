import { useState } from "react";
import { Search, ArrowRight, Zap } from "lucide-react";

export default function MemberEntry({ onSubmit, loading }) {
  const [id, setId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = id.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <div className="max-h-screen min-h-screen flex items-start justify-center px-4 py-10 ">
      <div className="w-full max-w-md animate-fade-up ">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 b rounded-2xl bg-ink-900 flex items-center justify-center mb-4 shadow-lg">
            <Zap className="w-7 h-7 text-accent-400" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">ByPass</h1>
          <p className="text-ink-500 mt-2 text-sm max-w-xs">
            Enter your member ID to view your events and check in or out on the
            map.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm ring-1 ring-ink-100 p-6"
        >
          <label
            htmlFor="riderId"
            className="block text-xs font-medium text-ink-600 mb-2"
          >
            Member ID
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              id="riderId"
              inputMode="numeric"
              autoComplete="off"
              value={id}
              onChange={(e) => setId(e.target.value.replace(/\s/g, ""))}
              placeholder="e.g. 1234567"
              className="w-full pl-9 pr-3 py-3 rounded-xl bg-ink-50 border border-ink-100 text-sm font-medium tracking-wide focus:outline-none focus:ring-2 focus:ring-accent-400 focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={!id.trim() || loading}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {loading ? "Fetching events…" : "Continue"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <p className="text-[11px] text-ink-400 text-center mt-4">
            No login required. Your ID is only used to load your events.
          </p>
        </form>
      </div>
    </div>
  );
}