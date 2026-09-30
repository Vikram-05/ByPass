const TAB_ORDER = [
  { key: "current", label: "Current" },
  { key: "upcoming", label: "Upcoming" },
  { key: "closed", label: "Closed" },
];

export default function StatusTabs({ value, counts = {}, onChange }) {
  return (
    <div
      className="flex items-center gap-1 overflow-x-auto"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {TAB_ORDER.map(({ key, label }) => {
        const active = value === key;
        const count = counts?.[key];
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-m text-xs font-medium whitespace-nowrap transition ring-1 ${active
                ? "bg-accent-500 text-white ring-accent-500"
                : "bg-white text-ink-600 ring-ink-100 hover:bg-ink-50"
              }`}
          >
            {label}
            {typeof count === "number" && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${active ? "bg-ink-950/10" : "bg-ink-100"
                  }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}