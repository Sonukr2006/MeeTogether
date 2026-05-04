import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { MessageCircle, Send, Target } from "lucide-react";
import { projects } from "../../data/projects";
import {
  addDiscussionMessage,
  ensureDiscussionThread,
  setActiveDiscussionThread,
} from "../../store/projectDiscussionsSlice";

const Discussions = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messageText, setMessageText] = useState("");
  const projectIdParam = searchParams.get("projectId");

  const threadsByProject = useSelector((state) => state.projectDiscussions.threadsByProject);
  const activeThreadByProject = useSelector(
    (state) => state.projectDiscussions.activeThreadByProject
  );

  const selectedProject = useMemo(() => {
    if (projectIdParam) {
      return projects.find((project) => String(project.id) === projectIdParam) || projects[0];
    }

    return projects[0];
  }, [projectIdParam]);

  const selectedProjectId = String(selectedProject.id);
  const selectedThreads = threadsByProject[selectedProjectId] || [];
  const activeThreadId = activeThreadByProject[selectedProjectId];
  const activeThread =
    selectedThreads.find((thread) => thread.id === activeThreadId) || selectedThreads[0];

  useEffect(() => {
    if (!projectIdParam) {
      setSearchParams({ projectId: String(selectedProject.id) }, { replace: true });
      return;
    }

    dispatch(
      ensureDiscussionThread({
        authorName: "Sonu Kumar",
        projectId: selectedProject.id,
        projectTitle: selectedProject.title,
      })
    );
  }, [dispatch, projectIdParam, selectedProject.id, selectedProject.title, setSearchParams]);

  const handleProjectSelect = (projectId) => {
    setSearchParams({ projectId: String(projectId) });
  };

  const handleMessageSubmit = (event) => {
    event.preventDefault();

    if (!messageText.trim()) {
      return;
    }

    dispatch(
      addDiscussionMessage({
        author: "Sonu Kumar",
        message: messageText.trim(),
        projectId: selectedProject.id,
        projectTitle: selectedProject.title,
        role: "Student Builder",
      })
    );
    setMessageText("");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 text-slate-900 dark:text-slate-100">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Shared collaboration surface
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Discussions</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Join project chats, continue active threads, and start a discussion when a build room needs input.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Target size={17} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-semibold">Build rooms</h2>
          </div>
          <div className="space-y-2">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => handleProjectSelect(project.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  String(project.id) === selectedProjectId
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800"
                }`}
              >
                <p className="text-sm font-semibold">{project.title}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {project.openRoles.length} roles open
                </p>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Active room
              </p>
              <h2 className="mt-1 text-xl font-semibold">{selectedProject.title}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {activeThread
                  ? `Joined existing chat created by ${activeThread.createdBy}`
                  : "This room will create a fresh discussion thread on the first message."}
              </p>
            </div>
            <Link
              to={`/projects/${selectedProject.id}`}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <MessageCircle size={14} />
              Open build room
            </Link>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
            <div className="space-y-2">
              {selectedThreads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() =>
                    dispatch(
                      setActiveDiscussionThread({
                        projectId: selectedProject.id,
                        threadId: thread.id,
                      })
                    )
                  }
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    activeThread?.id === thread.id
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800"
                  }`}
                >
                  <p className="text-sm font-semibold">{thread.title}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {thread.lastActivity}
                  </p>
                </button>
              ))}
            </div>

            <div>
              <div className="space-y-3">
                {(activeThread?.messages || []).map((discussion) => (
                  <div
                    key={discussion.id}
                    className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950"
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{discussion.author}</p>
                      <span className="text-xs text-slate-400">{discussion.role}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {discussion.message}
                    </p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleMessageSubmit} className="mt-4 flex gap-2">
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder={`Message ${selectedProject.title} discussion`}
                  className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
                  aria-label="Send discussion message"
                  title="Send"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Discussions;
