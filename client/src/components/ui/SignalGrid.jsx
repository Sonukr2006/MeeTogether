export default function SignalGrid({
  items,
  className = "mb-4 grid gap-2 sm:grid-cols-3",
}) {
  return (
    <div className={className}>
      {items.map(({ label, icon: Icon }) => (
        <div
          key={label}
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
        >
          <div className="flex items-center gap-2">
            <Icon size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
