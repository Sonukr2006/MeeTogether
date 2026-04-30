import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { closeComments } from "../../store/postInteractionsSlice";

export default function CommentModal() {
  const dispatch = useDispatch();
  const panelRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        dispatch(closeComments());
      }
    };

    const listenerTimer = setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(listenerTimer);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [dispatch]);

  return (
    <div
      ref={panelRef}
      className="absolute left-0 right-0 top-full z-30 mt-2 rounded-xl border border-gray-200 bg-white p-3 text-slate-900 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Comments</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Join the discussion on this idea.
          </p>
        </div>

        <button
          type="button"
          onClick={() => dispatch(closeComments())}
          className="rounded-md px-2 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="mb-3 rounded-lg border border-gray-200 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-950">
        <p className="text-sm text-slate-600 dark:text-gray-300">
          No new comments yet. Start the conversation.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Write a comment..."
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
        />
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          Send
        </button>
      </div>
    </div>
  );
}
