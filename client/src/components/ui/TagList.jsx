export default function TagList({
  items,
  className = "mb-4 flex flex-wrap gap-2",
  tagClassName = "rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  prefix = "#",
}) {
  return (
    <div className={className}>
      {items.map((item) => (
        <span key={item} className={tagClassName}>
          {prefix}
          {item}
        </span>
      ))}
    </div>
  );
}
