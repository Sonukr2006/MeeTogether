import { useDispatch, useSelector } from "react-redux";
import {
  ClipboardCheck,
  HelpCircle,
  Lightbulb,
  Rocket,
  Sprout,
  Wrench,
} from "lucide-react";
import CommentModal from "./CommentModal";
import PostActions from "./PostActions";
import {
  openComments,
  toggleLike,
  toggleSave,
} from "../../store/postInteractionsSlice";

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
        "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
    },
    "Help Needed": {
      icon: HelpCircle,
      classes:
        "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    },
    "Mentor Review": {
      icon: ClipboardCheck,
      classes:
        "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    },
    Launch: {
      icon: Rocket,
      classes:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
  };
  const postType = typeStyles[post.type] || {
    icon: Sprout,
    classes:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  };
  const TypeIcon = postType.icon;

  return (
    <>
      <div
        className={`relative rounded-lg border border-slate-200 bg-white p-4 mb-6 shadow-sm transition duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white ${
          showComments
            ? "z-40 shadow-lg"
            : "z-0 hover:-translate-y-1 hover:shadow-md"
        }`}
      >
        {/* User Info */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={post.user.avatar}
            alt="dp"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-sm">{post.user.name}</h3>
            <p className="text-xs text-gray-500">{post.user.bio}</p>
          </div>
          <span className="ml-auto text-xs text-slate-400">{post.time}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${postType.classes}`}
          >
            <TypeIcon size={12} />
            {post.type || "Idea"}
          </span>
        </div>

        {/* Title */}
        <h2 className="mb-2 flex items-start gap-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
          <Lightbulb
            size={19}
            className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
          />
          <span>{post.title}</span>
        </h2>

        {/* Description */}
        <p className="text-slate-600 text-sm mb-3 line-clamp-3 dark:text-slate-300">
          {post.description}
        </p>

        {post.linkedProject && (
          <div className="mb-3 inline-flex max-w-full items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Rocket size={13} className="shrink-0" />
            <span className="truncate">Linked project: {post.linkedProject}</span>
          </div>
        )}

        {/* Image */}
        {post.image && (
          <img
            src={post.image}
            alt="post"
            className="w-full h-56 object-cover rounded-lg mb-3"
          />
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.map((tag, i) => (
            <span
              key={i}
              className="cursor-pointer rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Actions */}
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
    </>
  );
}
