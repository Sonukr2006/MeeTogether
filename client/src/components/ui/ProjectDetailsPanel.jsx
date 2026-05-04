export default function ProjectDetailsPanel({
  activeDetail,
  onClose,
  onOpen,
  stackItems,
  roleItems,
}) {
  const visibleStack = stackItems.slice(0, 2);
  const visibleRoles = roleItems.slice(0, 2);
  const extraStackCount = Math.max(stackItems.length - 2, 0);
  const extraRoleCount = Math.max(roleItems.length - 2, 0);

  const detailConfig =
    activeDetail === "stack"
      ? {
          title: "Stack preview",
          items: stackItems,
          chipClassName:
            "rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
        }
      : activeDetail === "roles"
        ? {
            title: "Open roles",
            items: roleItems,
            chipClassName:
              "rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
          }
        : null;

  return (
    <div className="relative mb-4">
      <div className="grid grid-cols-2 gap-1">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Stack preview
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {visibleStack.map((tech) => (
              <span
                key={tech}
                className="shrink-0 rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
              >
                {tech}
              </span>
            ))}
            {extraStackCount > 0 && (
              <button
                type="button"
                onClick={() => onOpen("stack")}
                className="shrink-0 rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:border-sky-500/40 dark:hover:bg-sky-500/20 dark:hover:text-sky-200"
              >
                +{extraStackCount} more
              </button>
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Open roles
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {visibleRoles.map((role) => (
              <span
                key={role}
                className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
              >
                {role}
              </span>
            ))}
            {extraRoleCount > 0 && (
              <button
                type="button"
                onClick={() => onOpen("roles")}
                className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:border-amber-500/40 dark:hover:bg-amber-500/20 dark:hover:text-amber-200"
              >
                +{extraRoleCount} more
              </button>
            )}
          </div>
        </div>
      </div>

      {detailConfig && (
        <>
          <button
            type="button"
            aria-label="Close details"
            className="fixed inset-0 z-30 cursor-default"
            onClick={onClose}
          />
          <div className="absolute top-full z-40 mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-white">
            <div className="mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Details
              </p>
              <h3 className="mt-0.5 text-sm font-semibold text-slate-950 dark:text-slate-50">
                {detailConfig.title}
              </h3>
            </div>

            <div className="flex flex-wrap gap-1">
              {detailConfig.items.map((item) => (
                <span key={item} className={detailConfig.chipClassName}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
