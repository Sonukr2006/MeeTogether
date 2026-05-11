import { ThumbsUp } from "lucide-react";

export default function LikeActionButton({
  liked = false,
  count = 0,
  label = "Like",
  activeLabel = "Liked",
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 transition duration-200 ${
        liked
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
      }`}
      aria-label={liked ? activeLabel : label}
    >
      <ThumbsUp size={16} fill={liked ? "currentColor" : "none"} />
      <span className="text-sm">{count}</span>
      <span className="sr-only sm:not-sr-only sm:inline">{liked ? activeLabel : label}</span>
    </button>
  );
}
