import { Sparkles, GraduationCap, Route } from "lucide-react";

const TABS = [
  {
    key: "college",
    label: "All Events",
    hint: "VTU-APTS college events",
    icon: GraduationCap,
  },
  {
    key: "my",
    label: "My Events",
    hint: "Events you joined",
    icon: Sparkles,
  },
  {
    key: "journey",
    label: "Journey",
    hint: "Your hours & check-ins",
    icon: Route,
  },
];

export default function SourceTabs({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-white rounded-2xl ring-1 ring-ink-100 shadow-sm overflow-x-auto max-w-full">
      {TABS.map(({ key, label, hint, icon: Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            title={hint}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap ${
              active
                ? "bg-ink-900 text-white shadow-sm"
                : "text-ink-600 hover:bg-ink-50"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}