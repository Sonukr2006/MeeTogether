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
        <div className="flex items-center gap-5 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
          <button
            type="button"
            onClick={onLikeClick}
            className={`inline-flex items-center gap-2 transition duration-200 ${
              liked
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
            }`}
            aria-label={`Support post${likes ? `, ${likes} supports` : ""}`}
          >
            <ThumbsUp size={16} fill={liked ? "currentColor" : "none"} />
            <span className="text-sm">{likes}</span>
            <span className="sr-only sm:not-sr-only sm:inline">Support</span>
          </button>

          <button
            type="button"
            onClick={onCommentClick}
            className="inline-flex items-center gap-2 text-slate-500 transition duration-200 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
            aria-label={`Comments, ${comments}`}
          >
            <MessageCircle size={16} />
            <span className="text-sm">{comments}</span>
            <span className="sr-only sm:not-sr-only sm:inline">Comments</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center text-slate-500 transition duration-200 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
            aria-label="Share post"
          >
            <Share2 size={16} />
            <span className="sr-only">Share</span>
          </button>

          <button
            type="button"
            onClick={onSaveClick}
            className={`inline-flex items-center justify-center transition duration-200 ${
              saved
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
            }`}
            aria-label={saved ? "Saved post" : "Save post"}
          >
            <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
            <span className="sr-only">{saved ? "Saved" : "Save"}</span>
          </button>

          <button
            className="inline-flex items-center justify-center text-slate-700 transition duration-200 hover:text-emerald-600 dark:text-slate-200 dark:hover:text-emerald-300"
            aria-label="Analyze post"
          >
            <Sparkles size={14} />
            <span className="sr-only">Analyze</span>
          </button>
        </div>
      </div>
    </div>
  );
}
