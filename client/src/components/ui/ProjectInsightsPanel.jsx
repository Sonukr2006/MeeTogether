export default function ProjectInsightsPanel({ project }) {
  const completedTasks = project.tasks.filter((task) => task.status === "Done").length;
  const totalTasks = project.tasks.length;
  const openTaskCount = project.tasks.filter((task) => task.status === "Open").length;
  const healthLabel =
    project.progress >= 60 ? "Strong momentum" : project.progress >= 40 ? "On track" : "Needs support";
  const healthTone =
    project.progress >= 60
      ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20"
      : project.progress >= 40
        ? "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-500/10 dark:border-sky-500/20"
        : "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20";

  const insightCards = [
    {
      label: "Skill match",
      value: `${project.techStack.length} stack signals`,
      note: project.techStack.slice(0, 3).join(" + "),
    },
    {
      label: "Hiring signal",
      value: `${project.progress}% shipped`,
      note: `${completedTasks}/${totalTasks} scoped tasks completed`,
    },
    {
      label: "Missing roles",
      value: `${project.openRoles.length} open`,
      note: project.openRoles.join(", "),
    },
    {
      label: "Project health",
      value: healthLabel,
      note: `${openTaskCount} open tasks, ${project.contributors.length} active builders`,
      tone: healthTone,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Analyze
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-slate-950 dark:text-slate-50">
            Builder signal snapshot
          </h3>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${healthTone}`}>
          {healthLabel}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {insightCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg border p-3 ${
              card.tone ||
              "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {card.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{card.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
