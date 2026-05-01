import { useState } from "react";
import { MessageCircle, Rocket, Sparkles, Users } from "lucide-react";
import ContributorStack from "./ContributorStack";

export default function ProjectCard({ project }) {
  const [joined, setJoined] = useState(false);

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 text-slate-950 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-white">
      {/* User Info */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={project.user.avatar}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h3 className="text-sm font-semibold">{project.user.name}</h3>
          <p className="text-xs text-gray-500">{project.user.bio}</p>
        </div>
        <span className="ml-auto text-xs text-slate-400">{project.time}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          <Rocket size={12} />
          Project
        </span>
      </div>

      {/* Title */}
      <h2 className="mb-2 flex items-start gap-2 text-lg font-semibold">
        <Rocket
          size={19}
          className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
        />
        <span>{project.title}</span>
      </h2>

      {/* Problem */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
        <span className="font-semibold">Problem:</span> {project.problem}
      </p>

      {/* Solution */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        <span className="font-semibold">Solution:</span> {project.solution}
      </p>

      {/* Image */}
      {project.image && (
        <img
          src={project.image}
          className="w-full h-44 object-cover rounded-lg mb-3"
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
      <div className="flex justify-between items-center mt-auto">
        <button
          onClick={() => setJoined(!joined)}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
            joined
              ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          <Users size={14} />
          {joined ? "Collaborating" : "Collaborate"}
        </button>

        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
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
  );
}
