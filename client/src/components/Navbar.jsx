import { LogOut, User, Zap, Settings as SettingsIcon } from "lucide-react";

export default function Navbar({ riderId, onLogout, onSettings }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-ink-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
         
          <div>
            <h1 className="text-base font-semibold tracking-tight leading-none">
              ByPass
            </h1>
            <p className="text-[11px] text-ink-400 mt-0.5">Campus Check-in</p>
          </div>
        </div>

        {riderId && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-50 border border-ink-100">
              <User className="w-3.5 h-3.5 text-ink-500" />
              <span className="text-xs font-medium text-ink-700">
                #{riderId}
              </span>
            </div>

            <button
              onClick={onSettings}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-50 transition"
              title="Settings"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-50 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}