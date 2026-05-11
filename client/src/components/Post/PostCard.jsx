import { useDispatch, useSelector } from "react-redux";
import {
  ArrowUpRight,
  ClipboardCheck,
  HelpCircle,
  Lightbulb,
  MessageSquareText,
  Rocket,
  Sprout,
  Tags,
  Users,
  Wrench,
} from "lucide-react";
import CommentModal from "./CommentModal";
import PostActions from "./PostActions";
import {
  openComments,
  toggleLike,
  toggleSave,
} from "../../store/postInteractionsSlice";
import CardMetaRow from "../ui/CardMetaRow";
import ExpandableText from "../ui/ExpandableText";
import SignalGrid from "../ui/SignalGrid";
import TagList from "../ui/TagList";
import UserMiniProfile from "../ui/UserMiniProfile";

export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const { activeCommentsPostId, likedPosts, savedPosts } = useSelector(
    (state) => state.postInteractions
  );

  const liked = Boolean(likedPosts[post.id]);
  const saved = Boolean(savedPosts[post.id]);
  const showComments = activeCommentsPostId === post.id;
  const likes = liked ? post.likes + 1 : post.likes;

  const typeStyles = {
    "Build Log": {
      icon: Wrench,
      classes:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
      accent:
        "from-sky-500/12 via-sky-500/6 to-transparent dark:from-sky-400/12 dark:via-sky-400/6",
      label: "Progress update",
    },
    "Help Needed": {
      icon: HelpCircle,
      classes:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
      accent:
        "from-amber-500/12 via-amber-500/6 to-transparent dark:from-amber-400/12 dark:via-amber-400/6",
      label: "Needs collaborator",
    },
    "Mentor Review": {
      icon: ClipboardCheck,
      classes:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
      accent:
        "from-violet-500/12 via-violet-500/6 to-transparent dark:from-violet-400/12 dark:via-violet-400/6",
      label: "Seeking review",
    },
    Launch: {
      icon: Rocket,
      classes:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
      accent:
        "from-emerald-500/12 via-emerald-500/6 to-transparent dark:from-emerald-400/12 dark:via-emerald-400/6",
      label: "Shipped milestone",
    },
    "Professional Update": {
      icon: Lightbulb,
      classes:
        "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600/30 dark:bg-slate-800/70 dark:text-slate-200",
      accent:
        "from-slate-500/12 via-slate-500/6 to-transparent dark:from-slate-300/12 dark:via-slate-300/6",
      label: "Professional signal",
    },
  };
  const postType = typeStyles[post.type] || {
    icon: Sprout,
    classes:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    accent:
      "from-emerald-500/12 via-emerald-500/6 to-transparent dark:from-emerald-400/12 dark:via-emerald-400/6",
    label: "Builder update",
  };
  const TypeIcon = postType.icon;
  const proofSignals = [
    { icon: Users, label: `${likes} builders backed` },
    { icon: MessageSquareText, label: `${post.comments} discussion points` },
    { icon: Tags, label: `${post.tags.length} proof tags` },
  ];

  return (
    <>
      <div
        className={`relative mb-6 overflow-visible rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white ${
          showComments
            ? "z-40 shadow-lg"
            : "z-0 hover:-translate-y-1 hover:shadow-md"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r ${postType.accent}`}
          aria-hidden="true"
        />

        <div className="relative">
          <CardMetaRow
            badge={
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${postType.classes}`}
              >
                <TypeIcon size={12} />
                {post.type || "Idea"}
              </span>
            }
            label={postType.label}
            time={post.time}
          />

          <UserMiniProfile user={post.user} />

          <h2 className="mb-2 flex items-start gap-2 text-xl font-semibold text-slate-950 dark:text-slate-50">
            <Lightbulb
              size={19}
              className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-400"
            />
            <span>{post.title}</span>
          </h2>

          <ExpandableText
            text={post.description}
            previewLimit={140}
            wrapperClassName="mb-4"
          />

          <SignalGrid items={proofSignals} />

          {post.linkedProject && (
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-emerald-100 bg-emerald-50/80 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Linked project
                  </p>
                  <p className="truncate text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                    {post.linkedProject}
                  </p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-emerald-700 dark:bg-slate-900 dark:text-emerald-300">
                  <Rocket size={16} />
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <span>Proof attached to active build context</span>
                <ArrowUpRight size={13} />
              </div>
            </div>
          )}

          {post.image && (
            <img
              src={post.image}
              alt={post.title}
              className="mb-4 h-56 w-full rounded-lg object-cover"
            />
          )}

          <TagList
            items={post.tags}
            tagClassName="cursor-pointer rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
          />

          <div className="relative">
            <PostActions
              comments={post.comments}
              liked={liked}
              likes={likes}
              saved={saved}
              onCommentClick={() => dispatch(openComments(post.id))}
              onLikeClick={() => dispatch(toggleLike(post.id))}
              onSaveClick={() => dispatch(toggleSave(post.id))}
            />

            {showComments && <CommentModal />}
          </div>
        </div>
      </div>
    </>
  );
}
