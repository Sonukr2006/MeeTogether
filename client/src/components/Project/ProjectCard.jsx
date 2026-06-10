import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Bookmark,
  ExternalLink,
  MessagesSquare,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";
import {
  openAnalyzePanel,
  setProjectLikedState,
  setProjectSavedState,
  toggleLiveProjectLike,
  toggleLiveProjectSave,
} from "../../store/projectInteractionsSlice";
import {
  adjustProjectLikeState,
  updateProjectLikeState,
} from "../../store/projectsSlice";
import CardMetaRow from "../ui/CardMetaRow";
import ExpandableText from "../ui/ExpandableText";
import ProjectDetailsPanel from "../ui/ProjectDetailsPanel";
import ProjectInsightsPanel from "../ui/ProjectInsightsPanel";
import CommentActionButton from "../ui/CommentActionButton";
import LikeActionButton from "../ui/LikeActionButton";
import SignalGrid from "../ui/SignalGrid";
import TagList from "../ui/TagList";
import UserMiniProfile from "../ui/UserMiniProfile";
import CommentModal from "../Post/CommentModal";

export default function ProjectCard({ project, prioritizeImage = false }) {
  const dispatch = useDispatch();
  const { activeAnalyzeProjectId, likedProjects, savedProjects } = useSelector(
    (state) => state.projectInteractions,
  );
  const [showAllTags, setShowAllTags] = useState(false);
  const [activeDetailModal, setActiveDetailModal] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const visibleTags = showAllTags ? project.tags : project.tags.slice(0, 3);
  const extraTagCount = Math.max(project.tags.length - 3, 0);
  const liked = Boolean(likedProjects[project.id]);
  const saved = Boolean(savedProjects[project.id]);
  const showAnalyzePanel = activeAnalyzeProjectId === project.id;
  const likeCount = project.likes ?? 0;
  const discussionCount =
    project.comments ??
    (Array.isArray(project.discussions) ? project.discussions.length : 0);

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
          loading={prioritizeImage ? "eager" : "lazy"}
          fetchPriority={prioritizeImage ? "high" : "auto"}
          decoding="async"
          width="1200"
          height="630"
          sizes="(max-width: 767px) 100vw, 50vw"
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
        <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-5 text-sm">
              <LikeActionButton
                liked={liked}
                count={likeCount}
                label="Like"
                activeLabel="Liked"
                onClick={async () => {
                  const nextLiked = !liked;
                  const delta = nextLiked ? 1 : -1;

                  dispatch(
                    setProjectLikedState({
                      projectId: project.id,
                      liked: nextLiked,
                    }),
                  );
                  dispatch(
                    adjustProjectLikeState({ projectId: project.id, delta }),
                  );

                  try {
                    const result = await dispatch(
                      toggleLiveProjectLike({
                        projectId: project.id,
                        liked: nextLiked,
                      }),
                    ).unwrap();
                    dispatch(
                      setProjectLikedState({
                        projectId: project.id,
                        liked: result.liked,
                      }),
                    );
                    if (typeof result.likesCount === "number") {
                      dispatch(updateProjectLikeState(result));
                    }
                  } catch {
                    dispatch(
                      setProjectLikedState({ projectId: project.id, liked }),
                    );
                    dispatch(
                      adjustProjectLikeState({
                        projectId: project.id,
                        delta: -delta,
                      }),
                    );
                  }
                }}
              />

              <CommentActionButton
                count={discussionCount}
                label="Comments"
                ariaLabel={`Open project comments${discussionCount ? `, ${discussionCount} discussions` : ""}`}
                onClick={() => setShowComments((value) => !value)}
              />

              <button
                type="button"
                onClick={async () => {
                  const nextSaved = !saved;
                  dispatch(
                    setProjectSavedState({
                      projectId: project.id,
                      saved: nextSaved,
                    }),
                  );

                  try {
                    const result = await dispatch(
                      toggleLiveProjectSave({
                        projectId: project.id,
                        saved: nextSaved,
                      }),
                    ).unwrap();
                    dispatch(
                      setProjectSavedState({
                        projectId: project.id,
                        saved: result.saved,
                      }),
                    );
                  } catch {
                    dispatch(
                      setProjectSavedState({ projectId: project.id, saved }),
                    );
                  }
                }}
                className={`inline-flex items-center justify-center transition hover:text-emerald-600 dark:hover:text-emerald-400 ${
                  saved
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
                aria-label={saved ? "Saved project" : "Save project"}
              >
                <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
              </button>

              <button
                type="button"
                onClick={() => dispatch(openAnalyzePanel(project.id))}
                className="inline-flex items-center justify-center text-slate-500 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                aria-label={
                  showAnalyzePanel ? "Analyzed project" : "Analyze project"
                }
              >
                <Sparkles size={16} />
              </button>
            </div>

            <div className="flex gap-2">
              <Link
                to={`/discussions?projectId=${project.id}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <MessagesSquare size={14} />
                Discuss
              </Link>
              <Link
                to={`/projects/${project.id}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-emerald-700"
              >
                <ExternalLink size={14} />
                View
              </Link>
            </div>
          </div>

          {showComments ? (
            <div className="relative mt-3">
              <CommentModal
                onClose={() => setShowComments(false)}
                title="Project comments"
                subtitle="Leave a real comment directly on this build room."
                emptyMessage="No comments yet. Be the first to leave feedback on this project."
                placeholder="Write a project comment..."
                projectId={project.id}
                inline
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
