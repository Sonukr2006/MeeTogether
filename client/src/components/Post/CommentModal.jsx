import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { apiRequest } from "../../lib/api";
import { closeComments } from "../../store/postInteractionsSlice";
import { updatePostCommentsCount } from "../../store/postsSlice";
import { updateProjectCommentsCount } from "../../store/projectsSlice";

export default function CommentModal({
  onClose,
  title = "Comments",
  subtitle = "Join the discussion on this idea.",
  emptyMessage = "No new comments yet. Start the conversation.",
  placeholder = "Write a comment...",
  sendLabel = "Send",
  inline = false,
  postId = null,
  projectId = null,
}) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.currentUser);
  const panelRef = useRef(null);
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      dispatch(closeComments());
    }
  }, [onClose, dispatch]);
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const resourceId = postId ?? projectId;
  const entityType = postId ? "post" : projectId ? "project" : null;
  const [isLoading, setIsLoading] = useState(Boolean(resourceId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        handleClose();
      }
    };

    const listenerTimer = setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(listenerTimer);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [handleClose]);

  useEffect(() => {
    let ignore = false;

    const loadComments = async () => {
      if (!resourceId || !entityType) {
        setComments([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        const response = await apiRequest(`/${entityType}s/${resourceId}/comments`);

        if (!ignore) {
          const items = response?.data ?? (Array.isArray(response) ? response : []);
          setComments(items);
        }
      } catch {
        if (!ignore) {
          setError("Could not load comments right now.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadComments();

    return () => {
      ignore = true;
    };
  }, [entityType, resourceId]);

  const handleSubmit = async () => {
    const nextMessage = draft.trim();
    if (!nextMessage || !resourceId || !entityType || !currentUser || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const result = await apiRequest(`/${entityType}s/${resourceId}/comments`, {
        method: "POST",
        body: JSON.stringify({ message: nextMessage }),
      });

      setComments((prev) => [...prev, result.comment]);
      setDraft("");
      if (entityType === "post") {
        dispatch(
          updatePostCommentsCount({
            postId: resourceId,
            commentsCount: result.commentsCount,
          }),
        );
      } else if (entityType === "project") {
        dispatch(
          updateProjectCommentsCount({
            projectId: resourceId,
            commentsCount: result.commentsCount,
          }),
        );
      }
    } catch (submitError) {
      setError(
        submitError?.message?.includes("Unauthorized")
          ? "Sign in again to post a comment."
          : "Could not send your comment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={panelRef}
      className={`rounded-xl border border-gray-200 bg-white p-3 text-slate-900 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white ${
        inline
          ? "relative"
          : "absolute left-0 right-0 top-full z-30 mt-2"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="rounded-md px-2 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="mb-3 max-h-64 space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-950">
        {isLoading ? (
          <p className="text-sm text-slate-600 dark:text-gray-300">Loading comments...</p>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {comment.author.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {comment.author.title}
                  </p>
                </div>
                <p className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                  {new Date(comment.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200">{comment.message}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-600 dark:text-gray-300">{emptyMessage}</p>
        )}
      </div>

      {error ? (
        <p className="mb-3 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!draft.trim() || isSubmitting || !resourceId || !currentUser}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          {isSubmitting ? "Sending..." : sendLabel}
        </button>
      </div>
    </div>
  );
}
