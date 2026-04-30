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
    <div className="border-t border-gray-200 pt-3 dark:border-gray-800">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onLikeClick}
            className={`flex items-center gap-1 transition duration-200 hover:scale-105 ${
              liked
                ? "text-pink-500"
                : "text-gray-500 hover:text-pink-500 dark:text-gray-400"
            }`}
          >
            <span>{liked ? "❤️" : "🤍"}</span>
            <span>{likes}</span>
          </button>

          <button
            type="button"
            onClick={onCommentClick}
            className="flex items-center gap-1 text-gray-500 transition duration-200 hover:scale-105 hover:text-blue-500 dark:text-gray-400"
          >
            <span>💬</span>
            <span>{comments}</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1 text-gray-500 transition duration-200 hover:scale-105 hover:text-purple-500 dark:text-gray-400"
          >
            <span>🔗</span>
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={onSaveClick}
            className={`flex items-center gap-1 transition duration-200 hover:scale-105 ${
              saved
                ? "text-yellow-400"
                : "text-gray-500 hover:text-yellow-400 dark:text-gray-400"
            }`}
          >
            <span>{saved ? "🔖" : "📑"}</span>
            <span>{saved ? "Saved" : "Save"}</span>
          </button>
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-1 text-xs bg-purple-100 text-purple-600 rounded-lg transition duration-200 hover:scale-105 hover:bg-purple-200">
            ✨ AI
          </button>

          <button className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg transition duration-200 hover:scale-105 hover:bg-green-600">
            🚀 Start
          </button>
        </div>
      </div>
    </div>
  );
}
