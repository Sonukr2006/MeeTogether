import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CircleCheckBig,
  Clock3,
  MessageCircle,
  Search,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { projects } from "../../data/projects";
import { ensureDiscussionThread } from "../../store/projectDiscussionsSlice";

const STATUS_ORDER = ["Open", "In progress", "Done"];

const statusMeta = {
  Open: {
    icon: AlertCircle,
    chipClassName:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
    panelClassName:
      "border-amber-200/80 dark:border-amber-500/20",
  },
  "In progress": {
    icon: Clock3,
    chipClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
    panelClassName:
      "border-sky-200/80 dark:border-sky-500/20",
  },
  Done: {
    icon: CircleCheckBig,
    chipClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    panelClassName:
      "border-emerald-200/80 dark:border-emerald-500/20",
  },
};

const allIssues = projects.flatMap((project) =>
  project.tasks.map((task, index) => ({
    id: `${project.id}-${task.id}`,
    title: task.title,
    owner: task.owner,
    status: task.status,
    projectId: project.id,
    projectTitle: project.title,
    difficulty: project.difficulty,
    mentorStatus: project.mentorStatus,
    stack: project.techStack.slice(0, 3),
    roleNeed: project.openRoles[0],
    priority: index === 0 ? "High" : index === 1 ? "Medium" : "Normal",
  }))
);

export default function Issues() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [assignedIssueIds, setAssignedIssueIds] = useState({});

  const filteredIssues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allIssues.filter((issue) => {
      const matchesProject =
        projectFilter === "All" || issue.projectTitle === projectFilter;
      const matchesQuery =
        !normalizedQuery ||
        [
          issue.title,
          issue.owner,
          issue.projectTitle,
          issue.status,
          issue.roleNeed,
          ...issue.stack,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesProject && matchesQuery;
    });
  }, [projectFilter, query]);

  const issuesByStatus = STATUS_ORDER.map((status) => ({
    status,
    items: filteredIssues.filter((issue) => issue.status === status),
  }));

  const handleDiscuss = (issue) => {
    dispatch(
      ensureDiscussionThread({
        authorName: "Sonu Kumar",
        projectId: issue.projectId,
        projectTitle: issue.projectTitle,
      })
    );
    navigate(`/discussions?projectId=${issue.projectId}`);
  };

  const handleAssignToggle = (issueId) => {
    setAssignedIssueIds((current) => ({
      ...current,
      [issueId]: !current[issueId],
    }));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 text-slate-900 dark:text-slate-100">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Work coordination surface
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Issues</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Track open blockers, active implementation work, and completed tasks across build rooms.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks, owners, or project names"
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setProjectFilter("All")}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                projectFilter === "All"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              All projects
            </button>
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setProjectFilter(project.title)}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                  projectFilter === project.title
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {project.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {issuesByStatus.map(({ status, items }) => {
          const meta = statusMeta[status];
          const StatusIcon = meta.icon;

          return (
            <div
              key={status}
              className={`rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-900 ${meta.panelClassName}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.chipClassName}`}
                  >
                    <StatusIcon size={13} />
                    {status}
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {items.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {items.length > 0 ? (
                  items.map((issue) => (
                    <article
                      key={issue.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {issue.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {issue.projectTitle}
                          </p>
                        </div>
                        <span className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          {issue.priority}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          Owner: {issue.owner}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {issue.difficulty}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          Need: {issue.roleNeed}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {issue.stack.map((tech) => (
                          <span
                            key={tech}
                            className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <Sparkles size={12} />
                        {issue.mentorStatus}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleDiscuss(issue)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                        >
                          <MessageCircle size={14} />
                          Discuss
                        </button>
                        <Link
                          to={`/projects/${issue.projectId}`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10 dark:hover:text-sky-300"
                        >
                          <Sparkles size={14} />
                          Open project
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleAssignToggle(issue.id)}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                            assignedIssueIds[issue.id]
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
                          }`}
                        >
                          <UserPlus size={14} />
                          {assignedIssueIds[issue.id] ? "Assigned to you" : "Assign"}
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    No issues in this column right now.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
