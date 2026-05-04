import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  Code2,
  ExternalLink,
  MessageCircle,
  Target,
  Users,
} from "lucide-react";
import ContributorStack from "./ContributorStack";
import { projects } from "../../data/projects";

const statusClasses = {
  Done: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  "In progress":
    "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  Open: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  Next: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
};

export default function ProjectRoom() {
  const { projectId } = useParams();
  const project = projects.find((item) => String(item.id) === projectId);

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-lg font-semibold">Project room not found</h1>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
        >
          <ArrowLeft size={16} />
          Back to build network
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300"
      >
        <ArrowLeft size={16} />
        Back to build network
      </Link>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {project.image && (
          <img
            src={project.image}
            alt={project.title}
            className="h-72 w-full object-cover"
          />
        )}
        <div className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Target size={12} />
                Project Room
              </span>
              <h1 className="mt-3 text-2xl font-semibold">{project.title}</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                {project.solution}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to={`/discussions?projectId=${project.id}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <MessageCircle size={14} />
                Open discussion
              </Link>
              <a
                href={project.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Code2 size={14} />
                GitHub
              </a>
              <a
                href={project.demo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
              >
                <ExternalLink size={14} />
                Demo
              </a>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Users size={13} />
                Contributors
              </p>
              <div className="mt-2">
                <ContributorStack contributors={project.contributors} />
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarClock size={13} />
                Timeline
              </p>
              <p className="mt-2 text-sm font-semibold">{project.timeline}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <BadgeCheck size={13} />
                Mentor
              </p>
              <p className="mt-2 text-sm font-semibold">{project.mentorStatus}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs text-slate-500">Progress</p>
              <p className="mt-2 text-sm font-semibold">{project.progress}% complete</p>
              <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Target size={17} className="text-emerald-600 dark:text-emerald-400" />
            Tasks
          </h2>
          <div className="mt-4 space-y-3">
            {project.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
              >
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Owner: {task.owner}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                    statusClasses[task.status]
                  }`}
                >
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Code2 size={17} className="text-emerald-600 dark:text-emerald-400" />
            Build Stack
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
              >
                {tech}
              </span>
            ))}
          </div>

          <h2 className="mt-6 flex items-center gap-2 text-base font-semibold">
            <Users size={17} className="text-emerald-600 dark:text-emerald-400" />
            Open Roles
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {project.openRoles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
              >
                {role}
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold">Milestones</h2>
          <div className="mt-4 space-y-3">
            {project.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-950"
              >
                <p className="text-sm font-medium">{milestone.title}</p>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    statusClasses[milestone.status]
                  }`}
                >
                  {milestone.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <MessageCircle size={17} className="text-emerald-600 dark:text-emerald-400" />
            Discussion handoff
          </h2>
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Project conversations now live in the shared Discussions tab so every build room uses one consistent chat surface.
            </p>
            <Link
              to={`/discussions?projectId=${project.id}`}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
            >
              <MessageCircle size={14} />
              Continue in Discussions
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
