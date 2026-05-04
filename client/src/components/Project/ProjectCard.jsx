import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  Code2,
  ExternalLink,
  Gauge,
  MessageCircle,
  Rocket,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import ContributorStack from "./ContributorStack";

const detailItems = [
  { key: "difficulty", label: "Difficulty", icon: Gauge },
  { key: "timeline", label: "Timeline", icon: CalendarClock },
  { key: "mentorStatus", label: "Mentor", icon: BadgeCheck },
];

export default function ProjectCard({ project }) {
  const [joined, setJoined] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [discussionText, setDiscussionText] = useState("");

  const discussions = project.discussions || [
    {
      id: 1,
      author: "Aarav",
      role: "Backend Engineer",
      message: "We should define APIs first so frontend and backend can move together.",
    },
    {
      id: 2,
      author: "Meera",
      role: "Student Contributor",
      message: "I can pick the dashboard UI if someone reviews the component structure.",
    },
  ];

  const handleDiscussionSubmit = (event) => {
    event.preventDefault();
    setDiscussionText("");
  };

  const roomSignals = [
    { label: `${project.progress}% shipped`, icon: Rocket },
    { label: `${project.contributors.length} builders`, icon: Users },
    { label: `${project.openRoles.length} roles open`, icon: Sparkles },
  ];

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-4 text-slate-950 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-emerald-500/12 via-sky-500/8 to-transparent dark:from-emerald-400/12 dark:via-sky-400/8"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Rocket size={12} />
            Build Room
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Active collaboration workspace
          </span>
          <span className="ml-auto text-xs text-slate-400">{project.time}</span>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <img
            src={project.user.avatar}
            alt={project.user.name}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
          />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{project.user.name}</h3>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {project.user.bio}
            </p>
          </div>
        </div>

        <h2 className="mb-2 flex items-start gap-2 text-xl font-semibold">
          <Rocket
            size={19}
            className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-400"
          />
          <span>{project.title}</span>
        </h2>

        <p className="mb-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {project.solution}
        </p>

        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          {roomSignals.map(({ label, icon: Icon }) => (
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
      </div>

      <div className="mb-3 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-xs font-medium dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`rounded-md px-3 py-1.5 transition ${
            activeTab === "overview"
              ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-300"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("discussion")}
          className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 transition ${
            activeTab === "discussion"
              ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-300"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          <MessageCircle size={13} />
          Discussion
        </button>
      </div>

      {activeTab === "overview" ? (
        <>
          <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-semibold">Problem:</span> {project.problem}
          </p>

          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {detailItems.map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase text-slate-400">
                  <Icon size={12} />
                  {label}
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {project[key]}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50/80 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Room objective
                </p>
                <p className="mt-1 text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  {project.problem}
                </p>
              </div>
              <ArrowUpRight
                size={16}
                className="shrink-0 text-emerald-700 dark:text-emerald-300"
              />
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Code2 size={14} className="text-emerald-600 dark:text-emerald-400" />
              Tech stack
            </div>
            <div className="flex flex-wrap gap-2">
              {(project.techStack || []).map((tech) => (
                <span
                  key={tech}
                  className="rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Users size={14} className="text-emerald-600 dark:text-emerald-400" />
              Open roles
            </div>
            <div className="flex flex-wrap gap-2">
              {(project.openRoles || []).map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="mb-3 space-y-3">
          <div className="space-y-2">
            {discussions.map((discussion) => (
              <div
                key={discussion.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {discussion.author}
                  </p>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {discussion.role}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {discussion.message}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={handleDiscussionSubmit} className="flex gap-2">
            <input
              value={discussionText}
              onChange={(event) => setDiscussionText(event.target.value)}
              placeholder="Ask about tasks, stack, or blockers"
              className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={!discussionText.trim()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
              aria-label="Send discussion message"
              title="Send"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Image */}
      {activeTab === "overview" && project.image && (
        <img
          src={project.image}
          alt={project.title}
          className="mb-3 h-44 w-full rounded-lg object-cover"
        />
      )}

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Contributors */}
      <ContributorStack contributors={project.contributors} />

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {project.tags.map((tag, i) => (
          <span
            key={i}
            className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-3">
        <div className="flex gap-2">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Code2 size={14} />
              GitHub
            </a>
          )}
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ExternalLink size={14} />
              Demo
            </a>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Link
            to={`/projects/${project.id}`}
            onClick={() => setJoined(true)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              joined
                ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            <Users size={14} />
            {joined ? "Inside Build Room" : "Join Build Room"}
          </Link>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("discussion")}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <MessageCircle size={14} />
              Discuss
            </button>

            <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              <Sparkles size={14} />
              Analyze
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
