import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Bookmark,
  ExternalLink,
  MessageCircle,
  Rocket,
  Sparkles,
  ThumbsUp,
  Users,
} from "lucide-react";
import { ensureDiscussionThread } from "../../store/projectDiscussionsSlice";
import {
  openAnalyzePanel,
  toggleProjectLike,
  toggleProjectSave,
} from "../../store/projectInteractionsSlice";
import CardMetaRow from "../ui/CardMetaRow";
import ExpandableText from "../ui/ExpandableText";
import ProjectDetailsPanel from "../ui/ProjectDetailsPanel";
import ProjectInsightsPanel from "../ui/ProjectInsightsPanel";
import SignalGrid from "../ui/SignalGrid";
import TagList from "../ui/TagList";
import UserMiniProfile from "../ui/UserMiniProfile";

export default function ProjectCard({ project }) {
  const dispatch = useDispatch();
  const { activeAnalyzeProjectId, likedProjects, savedProjects } = useSelector(
    (state) => state.projectInteractions
  );
  const [showAllTags, setShowAllTags] = useState(false);
  const [activeDetailModal, setActiveDetailModal] = useState(null);
  const visibleTags = showAllTags ? project.tags : project.tags.slice(0, 3);
  const extraTagCount = Math.max(project.tags.length - 3, 0);
  const liked = Boolean(likedProjects[project.id]);
  const saved = Boolean(savedProjects[project.id]);
  const showAnalyzePanel = activeAnalyzeProjectId === project.id;

  const roomSignals = [
    { label: `${project.progress}% shipped`, icon: Rocket },
    { label: `${project.contributors.length} builders`, icon: Users },
    { label: `${project.openRoles.length} roles open`, icon: Sparkles },
  ];

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-4 text-slate-950 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-r from-emerald-500/12 via-sky-500/8 to-transparent dark:from-emerald-400/12 dark:via-sky-400/8"
        aria-hidden="true"
      />

      <div className="relative">
        <CardMetaRow
          badge={
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Rocket size={12} />
              Build Room
            </span>
          }
          label="Active collaboration workspace"
          time={project.time}
        />

        <UserMiniProfile user={project.user} />

        <h2 className="mb-2 flex items-start gap-2 text-xl font-semibold">
          <Rocket
            size={19}
            className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-400"
          />
          <span>{project.title}</span>
        </h2>

        <ExpandableText
          text={project.solution}
          previewLimit={90}
          wrapperClassName="mb-3"
        />

        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-800 dark:text-emerald-300">
            Problem
          </p>
          <ExpandableText
            text={project.problem}
            previewLimit={90}
            wrapperClassName="mt-1"
            className="text-sm font-medium text-slate-800 dark:text-slate-200"
            buttonClassName="mt-1 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
          />
        </div>

        <SignalGrid items={roomSignals} />
      </div>

      <ProjectDetailsPanel
        activeDetail={activeDetailModal}
        onClose={() => setActiveDetailModal(null)}
        onOpen={setActiveDetailModal}
        roleItems={project.openRoles}
        stackItems={project.techStack}
      />

      {showAnalyzePanel && (
        <div className="mb-4">
          <ProjectInsightsPanel project={project} />
        </div>
      )}

      {project.image && (
        <img
          src={project.image}
          alt={project.title}
          className="mb-4 h-56 w-full rounded-lg object-cover"
        />
      )}

      <div className="mt-auto flex flex-col gap-3">
        <div>
          <TagList items={visibleTags} className="flex flex-wrap gap-2" />
          {extraTagCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAllTags((value) => !value)}
              className="mt-1 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
            >
              {showAllTags ? "Show less" : `+${extraTagCount} more`}
            </button>
          )}
        </div>


        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-3 text-sm dark:border-slate-800">
            <button
              type="button"
              onClick={() => dispatch(toggleProjectLike(project.id))}
              className={`inline-flex items-center gap-1.5 transition hover:text-emerald-600 dark:hover:text-emerald-400 ${
                liked
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <ThumbsUp size={16} fill={liked ? "currentColor" : "none"} />
              <span>{liked ? "Liked" : "Like"}</span>
            </button>

            <button
              type="button"
              onClick={() => dispatch(toggleProjectSave(project.id))}
              className={`inline-flex items-center gap-1.5 transition hover:text-emerald-600 dark:hover:text-emerald-400 ${
                saved
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
              <span>{saved ? "Saved" : "Save"}</span>
            </button>

            <button
              type="button"
              onClick={() => dispatch(openAnalyzePanel(project.id))}
              className="inline-flex items-center gap-1.5 text-slate-500 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
            >
              <Sparkles size={16} />
              <span>{showAnalyzePanel ? "Analyzed" : "Analyze"}</span>
            </button>
          </div>

          <div className="flex gap-2">
            <Link
              to={`/discussions?projectId=${project.id}`}
              onClick={() =>
                dispatch(
                  ensureDiscussionThread({
                    authorName: "Sonu Kumar",
                    projectId: project.id,
                    projectTitle: project.title,
                  })
                )
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <MessageCircle size={14} />
              Discuss
            </Link>
            <Link
              to={`/projects/${project.id}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
            >
              <ExternalLink size={14} />
              View
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
