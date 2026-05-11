import {
  Bookmark,
  Share2,
  Sparkles,
} from "lucide-react";
import CommentActionButton from "../ui/CommentActionButton";
import LikeActionButton from "../ui/LikeActionButton";

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
          <LikeActionButton
            liked={liked}
            count={likes}
            label="Support"
            activeLabel="Supported"
            onClick={onLikeClick}
          />

          <CommentActionButton count={comments} label="Comments" onClick={onCommentClick} />

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
