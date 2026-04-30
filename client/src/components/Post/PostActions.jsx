import {
  Bookmark,
  MessageCircle,
  Share2,
  Sparkles,
  ThumbsUp,
} from "lucide-react";

export default function PostActions({
  comments,
  liked,
  likes,
  saved,
  onCommentClick,
  onLikeClick,
  onSaveClick,
}) {
  return (
    <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onLikeClick}
            className={`flex items-center gap-1.5 transition duration-200 hover:scale-105 ${
              liked
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
            }`}
          >
            <ThumbsUp size={16} fill={liked ? "currentColor" : "none"} />
            <span>Support</span>
            <span>{likes}</span>
          </button>

          <button
            type="button"
            onClick={onCommentClick}
            className="flex items-center gap-1.5 text-slate-500 transition duration-200 hover:scale-105 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            <MessageCircle size={16} />
            <span>{comments}</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 text-slate-500 transition duration-200 hover:scale-105 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={onSaveClick}
            className={`flex items-center gap-1.5 transition duration-200 hover:scale-105 ${
              saved
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
            }`}
          >
            <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
            <span>{saved ? "Saved" : "Save"}</span>
          </button>
        </div>

        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition duration-200 hover:scale-105 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            <Sparkles size={14} />
            Analyze
          </button>
        </div>
      </div>
    </div>
  );
}
