export default function CardMetaRow({
  badge,
  label,
  time,
  className = "mb-4",
}) {
  return (
    <div className={`${className} flex flex-wrap items-center gap-2`}>
      {badge}
      {label && (
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
      )}
      {time && <span className="ml-auto text-xs text-slate-400">{time}</span>}
    </div>
  );
}
