export default function Loader({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-[3px] border-ink-200 border-t-accent-500 rounded-full animate-spin" />
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}